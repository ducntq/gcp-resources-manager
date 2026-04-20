using System.Collections.Concurrent;
using System.Text.Json;
using GcpResourcesManager.Api.Models;

namespace GcpResourcesManager.Api.Services;

public class ProjectRegistry
{
    private readonly string _keysDirectory;
    private readonly ConcurrentDictionary<string, ProjectInfo> _projects = new();
    private readonly object _scanLock = new();
    private DateTime _lastScan = DateTime.MinValue;

    public ProjectRegistry(IConfiguration config)
    {
        _keysDirectory = Environment.GetEnvironmentVariable("KEYS_DIRECTORY")
            ?? config["Gcp:KeysDirectory"]
            ?? "./keys";
        Directory.CreateDirectory(_keysDirectory);
    }

    public string KeysDirectory => _keysDirectory;

    public IReadOnlyList<ProjectInfo> List()
    {
        EnsureScanned();
        return _projects.Values.OrderBy(p => p.ProjectId).ToList();
    }

    public ProjectInfo? Get(string projectId)
    {
        EnsureScanned();
        return _projects.TryGetValue(projectId, out var info) ? info : null;
    }

    public void Refresh()
    {
        lock (_scanLock)
        {
            _projects.Clear();
            foreach (var file in Directory.EnumerateFiles(_keysDirectory, "*.json"))
            {
                var info = TryParse(file);
                if (info is not null) _projects[info.ProjectId] = info;
            }
            _lastScan = DateTime.UtcNow;
        }
    }

    public async Task<ProjectInfo> AddAsync(Stream jsonStream, CancellationToken ct)
    {
        using var ms = new MemoryStream();
        await jsonStream.CopyToAsync(ms, ct);
        var bytes = ms.ToArray();

        using var doc = JsonDocument.Parse(bytes);
        var root = doc.RootElement;
        if (!root.TryGetProperty("project_id", out var pid) ||
            !root.TryGetProperty("client_email", out var email) ||
            !root.TryGetProperty("type", out var type) ||
            type.GetString() != "service_account")
        {
            throw new InvalidDataException("File is not a valid GCP service-account key.");
        }

        var projectId = pid.GetString()!;
        var clientEmail = email.GetString()!;
        var dest = Path.Combine(_keysDirectory, $"{projectId}.json");
        await File.WriteAllBytesAsync(dest, bytes, ct);

        var info = new ProjectInfo(projectId, clientEmail, dest);
        _projects[projectId] = info;
        return info;
    }

    public bool Remove(string projectId)
    {
        if (!_projects.TryRemove(projectId, out var info)) return false;
        if (File.Exists(info.KeyFile)) File.Delete(info.KeyFile);
        return true;
    }

    private void EnsureScanned()
    {
        if (_projects.IsEmpty || (DateTime.UtcNow - _lastScan).TotalSeconds > 30)
            Refresh();
    }

    private static ProjectInfo? TryParse(string path)
    {
        try
        {
            using var fs = File.OpenRead(path);
            using var doc = JsonDocument.Parse(fs);
            var root = doc.RootElement;
            if (!root.TryGetProperty("project_id", out var pid)) return null;
            if (!root.TryGetProperty("client_email", out var email)) return null;
            return new ProjectInfo(pid.GetString()!, email.GetString()!, path);
        }
        catch
        {
            return null;
        }
    }
}

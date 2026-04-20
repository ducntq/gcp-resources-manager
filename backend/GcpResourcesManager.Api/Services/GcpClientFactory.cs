using System.Collections.Concurrent;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Compute.v1;
using Google.Apis.Services;

namespace GcpResourcesManager.Api.Services;

public class GcpClientFactory : IDisposable
{
    private readonly ProjectRegistry _registry;
    private readonly ConcurrentDictionary<string, ComputeService> _clients = new();

    public GcpClientFactory(ProjectRegistry registry) => _registry = registry;

    public ComputeService Get(string projectId)
    {
        var info = _registry.Get(projectId)
            ?? throw new KeyNotFoundException($"Project '{projectId}' is not configured.");

        return _clients.GetOrAdd(projectId, _ =>
        {
            using var fs = File.OpenRead(info.KeyFile);
            var cred = GoogleCredential.FromStream(fs)
                .CreateScoped(ComputeService.ScopeConstants.CloudPlatform);
            return new ComputeService(new BaseClientService.Initializer
            {
                HttpClientInitializer = cred,
                ApplicationName = "gcp-resources-manager",
            });
        });
    }

    public void Invalidate(string projectId)
    {
        if (_clients.TryRemove(projectId, out var svc))
            svc.Dispose();
    }

    public void Dispose()
    {
        foreach (var svc in _clients.Values) svc.Dispose();
        _clients.Clear();
    }
}

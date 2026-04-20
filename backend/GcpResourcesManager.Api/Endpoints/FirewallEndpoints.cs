using GcpResourcesManager.Api.Models;
using GcpResourcesManager.Api.Services;
using Google.Apis.Compute.v1.Data;

namespace GcpResourcesManager.Api.Endpoints;

public static class FirewallEndpoints
{
    public static RouteGroupBuilder MapFirewallEndpoints(this RouteGroupBuilder api)
    {
        var g = api.MapGroup("/projects/{projectId}/firewalls");

        g.MapGet("/", async (string projectId, GcpClientFactory factory, CancellationToken ct) =>
        {
            var svc = factory.Get(projectId);
            var req = svc.Firewalls.List(projectId);
            req.MaxResults = 500;

            var results = new List<object>();
            string? pageToken = null;
            do
            {
                req.PageToken = pageToken;
                var page = await req.ExecuteAsync(ct);
                if (page.Items is not null)
                    foreach (var f in page.Items) results.Add(Project(f));
                pageToken = page.NextPageToken;
            } while (!string.IsNullOrEmpty(pageToken));

            return Results.Ok(results);
        });

        g.MapGet("/{name}", async (string projectId, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var f = await factory.Get(projectId).Firewalls.Get(projectId, name).ExecuteAsync(ct);
            return Results.Ok(Project(f));
        });

        g.MapPost("/", async (string projectId, FirewallRuleInput input, GcpClientFactory factory, CancellationToken ct) =>
        {
            var body = ToFirewall(input, projectId);
            var op = await factory.Get(projectId).Firewalls.Insert(body, projectId).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        g.MapPut("/{name}", async (string projectId, string name, FirewallRuleInput input, GcpClientFactory factory, CancellationToken ct) =>
        {
            var body = ToFirewall(input with { Name = name }, projectId);
            var op = await factory.Get(projectId).Firewalls.Patch(body, projectId, name).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        g.MapDelete("/{name}", async (string projectId, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var op = await factory.Get(projectId).Firewalls.Delete(projectId, name).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        return api;
    }

    private static Firewall ToFirewall(FirewallRuleInput i, string projectId) => new()
    {
        Name = i.Name,
        Description = i.Description,
        Network = NormalizeNetwork(i.Network, projectId),
        Priority = i.Priority,
        Direction = i.Direction,
        SourceRanges = i.SourceRanges?.ToList(),
        DestinationRanges = i.DestinationRanges?.ToList(),
        SourceTags = i.SourceTags?.ToList(),
        TargetTags = i.TargetTags?.ToList(),
        SourceServiceAccounts = i.SourceServiceAccounts?.ToList(),
        TargetServiceAccounts = i.TargetServiceAccounts?.ToList(),
        Disabled = i.Disabled,
        Allowed = i.Allowed?.Select(a => new Firewall.AllowedData
        {
            IPProtocol = a.IpProtocol,
            Ports = a.Ports?.ToList(),
        }).ToList(),
        Denied = i.Denied?.Select(a => new Firewall.DeniedData
        {
            IPProtocol = a.IpProtocol,
            Ports = a.Ports?.ToList(),
        }).ToList(),
    };

    public static object Project(Firewall f) => new
    {
        name = f.Name,
        description = f.Description,
        network = ShortName(f.Network),
        priority = f.Priority,
        direction = f.Direction,
        sourceRanges = f.SourceRanges,
        destinationRanges = f.DestinationRanges,
        sourceTags = f.SourceTags,
        targetTags = f.TargetTags,
        sourceServiceAccounts = f.SourceServiceAccounts,
        targetServiceAccounts = f.TargetServiceAccounts,
        disabled = f.Disabled,
        allowed = f.Allowed?.Select(a => new { ipProtocol = a.IPProtocol, ports = a.Ports }),
        denied = f.Denied?.Select(a => new { ipProtocol = a.IPProtocol, ports = a.Ports }),
        creationTimestamp = f.CreationTimestamp,
    };

    private static string? ShortName(string? url) =>
        string.IsNullOrEmpty(url) ? url : url[(url.LastIndexOf('/') + 1)..];

    private static string? NormalizeNetwork(string? value, string projectId)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var v = value.Trim();
        if (v.StartsWith("http", StringComparison.OrdinalIgnoreCase)) return v;
        if (v.StartsWith("projects/", StringComparison.OrdinalIgnoreCase)) return v;
        if (v.StartsWith("global/", StringComparison.OrdinalIgnoreCase))
            return $"projects/{projectId}/{v}";
        return $"projects/{projectId}/global/networks/{v}";
    }
}

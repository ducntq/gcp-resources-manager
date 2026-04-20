using GcpResourcesManager.Api.Services;
using Google.Apis.Compute.v1.Data;

namespace GcpResourcesManager.Api.Endpoints;

public static class OperationEndpoints
{
    public static RouteGroupBuilder MapOperationEndpoints(this RouteGroupBuilder api)
    {
        var g = api.MapGroup("/projects/{projectId}/operations");

        g.MapGet("/{name}", async (string projectId, string name, string? zone, GcpClientFactory factory, CancellationToken ct) =>
        {
            var svc = factory.Get(projectId);
            Operation op = string.IsNullOrEmpty(zone)
                ? await svc.GlobalOperations.Get(projectId, name).ExecuteAsync(ct)
                : await svc.ZoneOperations.Get(projectId, zone, name).ExecuteAsync(ct);
            return Results.Ok(Project(op));
        });

        return api;
    }

    public static object Project(Operation op) => new
    {
        id = op.Id?.ToString(),
        name = op.Name,
        operationType = op.OperationType,
        status = op.Status,
        progress = op.Progress,
        targetLink = op.TargetLink,
        zone = ShortName(op.Zone),
        error = op.Error?.Errors?.Select(e => new { code = e.Code, message = e.Message }),
    };

    private static string? ShortName(string? url) =>
        string.IsNullOrEmpty(url) ? url : url[(url.LastIndexOf('/') + 1)..];
}

using GcpResourcesManager.Api.Services;
using Google.Apis.Compute.v1.Data;

namespace GcpResourcesManager.Api.Endpoints;

public static class MachineTypeEndpoints
{
    public static RouteGroupBuilder MapMachineTypeEndpoints(this RouteGroupBuilder api)
    {
        var g = api.MapGroup("/projects/{projectId}/zones/{zone}/machine-types");

        g.MapGet("/", async (string projectId, string zone, GcpClientFactory factory, CancellationToken ct) =>
        {
            var svc = factory.Get(projectId);
            var req = svc.MachineTypes.List(projectId, zone);
            req.MaxResults = 500;

            var results = new List<object>();
            string? pageToken = null;
            do
            {
                req.PageToken = pageToken;
                var page = await req.ExecuteAsync(ct);
                if (page.Items is not null)
                    foreach (var m in page.Items) results.Add(Project(m));
                pageToken = page.NextPageToken;
            } while (!string.IsNullOrEmpty(pageToken));

            return Results.Ok(results);
        });

        return api;
    }

    private static object Project(MachineType m) => new
    {
        name = m.Name,
        description = m.Description,
        guestCpus = m.GuestCpus,
        memoryMb = m.MemoryMb,
        isSharedCpu = m.IsSharedCpu,
        deprecated = m.Deprecated?.State,
    };
}

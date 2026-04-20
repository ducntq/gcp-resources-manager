using GcpResourcesManager.Api.Services;
using Google.Apis.Compute.v1.Data;

namespace GcpResourcesManager.Api.Endpoints;

public static class VmEndpoints
{
    public static RouteGroupBuilder MapVmEndpoints(this RouteGroupBuilder api)
    {
        var g = api.MapGroup("/projects/{projectId}/instances");

        g.MapGet("/", async (string projectId, GcpClientFactory factory, CancellationToken ct) =>
        {
            var svc = factory.Get(projectId);
            var req = svc.Instances.AggregatedList(projectId);
            req.MaxResults = 500;

            var results = new List<object>();
            string? pageToken = null;
            do
            {
                req.PageToken = pageToken;
                var page = await req.ExecuteAsync(ct);
                if (page.Items is not null)
                {
                    foreach (var (zoneKey, scoped) in page.Items)
                    {
                        if (scoped.Instances is null) continue;
                        foreach (var inst in scoped.Instances)
                            results.Add(Project(inst, zoneKey));
                    }
                }
                pageToken = page.NextPageToken;
            } while (!string.IsNullOrEmpty(pageToken));

            return Results.Ok(results);
        });

        g.MapGet("/{zone}/{name}", async (string projectId, string zone, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var svc = factory.Get(projectId);
            var inst = await svc.Instances.Get(projectId, zone, name).ExecuteAsync(ct);
            return Results.Ok(ProjectDetail(inst, $"zones/{zone}"));
        });

        g.MapPost("/{zone}/{name}/start", async (string projectId, string zone, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var op = await factory.Get(projectId).Instances.Start(projectId, zone, name).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        g.MapPost("/{zone}/{name}/stop", async (string projectId, string zone, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var op = await factory.Get(projectId).Instances.Stop(projectId, zone, name).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        g.MapPost("/{zone}/{name}/reset", async (string projectId, string zone, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var op = await factory.Get(projectId).Instances.Reset(projectId, zone, name).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        g.MapDelete("/{zone}/{name}", async (string projectId, string zone, string name, GcpClientFactory factory, CancellationToken ct) =>
        {
            var op = await factory.Get(projectId).Instances.Delete(projectId, zone, name).ExecuteAsync(ct);
            return Results.Accepted(value: OperationEndpoints.Project(op));
        });

        return api;
    }

    private static object Project(Instance i, string zoneRef)
    {
        var zone = zoneRef.Contains("/") ? zoneRef[(zoneRef.LastIndexOf('/') + 1)..] : zoneRef;
        return new
        {
            name = i.Name,
            id = i.Id?.ToString(),
            zone,
            machineType = ShortName(i.MachineType),
            status = i.Status,
            creationTimestamp = i.CreationTimestamp,
            cpuPlatform = i.CpuPlatform,
            internalIps = i.NetworkInterfaces?.Select(n => n.NetworkIP).Where(ip => ip is not null).ToArray(),
            externalIps = i.NetworkInterfaces?
                .SelectMany(n => n.AccessConfigs ?? new List<AccessConfig>())
                .Select(a => a.NatIP).Where(ip => ip is not null).ToArray(),
            networks = i.NetworkInterfaces?.Select(n => ShortName(n.Network)).ToArray(),
            labels = i.Labels,
            tags = i.Tags?.Items,
        };
    }

    private static object ProjectDetail(Instance i, string zoneRef)
    {
        var zone = zoneRef.Contains("/") ? zoneRef[(zoneRef.LastIndexOf('/') + 1)..] : zoneRef;
        return new
        {
            name = i.Name,
            id = i.Id?.ToString(),
            description = i.Description,
            zone,
            machineType = ShortName(i.MachineType),
            status = i.Status,
            statusMessage = i.StatusMessage,
            creationTimestamp = i.CreationTimestamp,
            lastStartTimestamp = i.LastStartTimestamp,
            lastStopTimestamp = i.LastStopTimestamp,
            cpuPlatform = i.CpuPlatform,
            deletionProtection = i.DeletionProtection,
            canIpForward = i.CanIpForward,
            hostname = i.Hostname,
            labels = i.Labels,
            tags = i.Tags?.Items,
            networkInterfaces = i.NetworkInterfaces?.Select(n => new
            {
                name = n.Name,
                network = ShortName(n.Network),
                subnetwork = ShortName(n.Subnetwork),
                networkIP = n.NetworkIP,
                nicType = n.NicType,
                stackType = n.StackType,
                accessConfigs = n.AccessConfigs?.Select(a => new
                {
                    name = a.Name,
                    type = a.Type,
                    natIP = a.NatIP,
                    networkTier = a.NetworkTier,
                }),
            }),
            disks = i.Disks?.Select(d => new
            {
                deviceName = d.DeviceName,
                boot = d.Boot,
                autoDelete = d.AutoDelete,
                mode = d.Mode,
                type = d.Type,
                diskSizeGb = d.DiskSizeGb,
                source = ShortName(d.Source),
            }),
            serviceAccounts = i.ServiceAccounts?.Select(s => new
            {
                email = s.Email,
                scopes = s.Scopes,
            }),
            scheduling = i.Scheduling is null ? null : new
            {
                automaticRestart = i.Scheduling.AutomaticRestart,
                onHostMaintenance = i.Scheduling.OnHostMaintenance,
                preemptible = i.Scheduling.Preemptible,
                provisioningModel = i.Scheduling.ProvisioningModel,
            },
            shieldedInstanceConfig = i.ShieldedInstanceConfig is null ? null : new
            {
                enableSecureBoot = i.ShieldedInstanceConfig.EnableSecureBoot,
                enableVtpm = i.ShieldedInstanceConfig.EnableVtpm,
                enableIntegrityMonitoring = i.ShieldedInstanceConfig.EnableIntegrityMonitoring,
            },
            metadata = i.Metadata?.Items?
                .Where(m => m.Key is not null)
                .Select(m => new { key = m.Key, value = m.Value }),
        };
    }

    private static string? ShortName(string? url) =>
        string.IsNullOrEmpty(url) ? url : url[(url.LastIndexOf('/') + 1)..];
}

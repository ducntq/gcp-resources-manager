using GcpResourcesManager.Api.Services;

namespace GcpResourcesManager.Api.Endpoints;

public static class ProjectEndpoints
{
    public static RouteGroupBuilder MapProjectEndpoints(this RouteGroupBuilder api)
    {
        var g = api.MapGroup("/projects");

        g.MapGet("/", (ProjectRegistry reg) =>
            Results.Ok(reg.List().Select(p => new { p.ProjectId, p.ClientEmail })));

        g.MapPost("/", async (HttpRequest req, ProjectRegistry reg, GcpClientFactory factory, CancellationToken ct) =>
        {
            if (!req.HasFormContentType)
                return Results.BadRequest(new { error = "Expected multipart/form-data with 'file' field." });
            var form = await req.ReadFormAsync(ct);
            var file = form.Files["file"];
            if (file is null || file.Length == 0)
                return Results.BadRequest(new { error = "Missing 'file'." });

            try
            {
                await using var stream = file.OpenReadStream();
                var info = await reg.AddAsync(stream, ct);
                factory.Invalidate(info.ProjectId);
                return Results.Created($"/api/projects/{info.ProjectId}",
                    new { info.ProjectId, info.ClientEmail });
            }
            catch (InvalidDataException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
        }).DisableAntiforgery();

        g.MapDelete("/{projectId}", (string projectId, ProjectRegistry reg, GcpClientFactory factory) =>
        {
            factory.Invalidate(projectId);
            return reg.Remove(projectId) ? Results.NoContent() : Results.NotFound();
        });

        g.MapPost("/refresh", (ProjectRegistry reg) =>
        {
            reg.Refresh();
            return Results.Ok(new { count = reg.List().Count });
        });

        return api;
    }
}

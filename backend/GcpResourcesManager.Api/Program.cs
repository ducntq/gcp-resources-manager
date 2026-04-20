using GcpResourcesManager.Api.Endpoints;
using GcpResourcesManager.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSingleton<ProjectRegistry>();
builder.Services.AddSingleton<GcpClientFactory>();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173")
     .AllowAnyHeader()
     .AllowAnyMethod()));

builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

app.UseCors();

var api = app.MapGroup("/api");
api.MapProjectEndpoints();
api.MapVmEndpoints();
api.MapFirewallEndpoints();
api.MapOperationEndpoints();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();

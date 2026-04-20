namespace GcpResourcesManager.Api.Models;

public record VmMetadataItemInput(string Key, string? Value);

public record VmPatchInput(
    Dictionary<string, string>? Labels,
    string[]? Tags,
    VmMetadataItemInput[]? Metadata,
    bool? DeletionProtection,
    string? MachineType);

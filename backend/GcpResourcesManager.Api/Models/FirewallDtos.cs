namespace GcpResourcesManager.Api.Models;

public record FirewallRuleEntry(string? IpProtocol, string[]? Ports);

public record FirewallRuleInput(
    string Name,
    string? Description,
    string? Network,
    int? Priority,
    string? Direction,
    string[]? SourceRanges,
    string[]? DestinationRanges,
    string[]? SourceTags,
    string[]? TargetTags,
    string[]? SourceServiceAccounts,
    string[]? TargetServiceAccounts,
    FirewallRuleEntry[]? Allowed,
    FirewallRuleEntry[]? Denied,
    bool? Disabled);

import { api } from "./client";

export type FirewallEntry = { ipProtocol?: string; ports?: string[] };

export type Firewall = {
  name: string;
  description?: string;
  network?: string;
  priority?: number;
  direction?: "INGRESS" | "EGRESS";
  sourceRanges?: string[];
  destinationRanges?: string[];
  sourceTags?: string[];
  targetTags?: string[];
  sourceServiceAccounts?: string[];
  targetServiceAccounts?: string[];
  disabled?: boolean;
  allowed?: FirewallEntry[];
  denied?: FirewallEntry[];
  creationTimestamp?: string;
};

export type FirewallInput = Omit<Firewall, "creationTimestamp">;

const base = (p: string) => `/api/projects/${encodeURIComponent(p)}/firewalls`;

export const firewallsApi = {
  list: (projectId: string) => api.get<Firewall[]>(base(projectId)),
  get: (projectId: string, name: string) =>
    api.get<Firewall>(`${base(projectId)}/${name}`),
  create: (projectId: string, input: FirewallInput) =>
    api.post<unknown>(base(projectId), input),
  update: (projectId: string, name: string, input: FirewallInput) =>
    api.put<unknown>(`${base(projectId)}/${name}`, input),
  remove: (projectId: string, name: string) =>
    api.del<unknown>(`${base(projectId)}/${name}`),
};

import { api } from "./client";
import type { Firewall } from "./firewalls";
import type { Operation } from "./operations";

export type Vm = {
  name: string;
  id?: string;
  zone: string;
  machineType?: string;
  status?: string;
  creationTimestamp?: string;
  cpuPlatform?: string;
  internalIps?: string[];
  externalIps?: string[];
  networks?: string[];
  labels?: Record<string, string>;
  tags?: string[];
};

export type VmAccessConfig = {
  name?: string;
  type?: string;
  natIP?: string;
  networkTier?: string;
};

export type VmNetworkInterface = {
  name?: string;
  network?: string;
  subnetwork?: string;
  networkIP?: string;
  nicType?: string;
  stackType?: string;
  accessConfigs?: VmAccessConfig[];
};

export type VmDisk = {
  deviceName?: string;
  boot?: boolean;
  autoDelete?: boolean;
  mode?: string;
  type?: string;
  diskSizeGb?: string | number;
  source?: string;
};

export type VmServiceAccount = {
  email?: string;
  scopes?: string[];
};

export type VmScheduling = {
  automaticRestart?: boolean;
  onHostMaintenance?: string;
  preemptible?: boolean;
  provisioningModel?: string;
};

export type VmShielded = {
  enableSecureBoot?: boolean;
  enableVtpm?: boolean;
  enableIntegrityMonitoring?: boolean;
};

export type VmMetadataItem = { key: string; value?: string };

export type VmDetail = Vm & {
  description?: string;
  statusMessage?: string;
  lastStartTimestamp?: string;
  lastStopTimestamp?: string;
  deletionProtection?: boolean;
  canIpForward?: boolean;
  hostname?: string;
  networkInterfaces?: VmNetworkInterface[];
  disks?: VmDisk[];
  serviceAccounts?: VmServiceAccount[];
  scheduling?: VmScheduling;
  shieldedInstanceConfig?: VmShielded;
  metadata?: VmMetadataItem[];
};

const base = (p: string) => `/api/projects/${encodeURIComponent(p)}/instances`;

export const vmsApi = {
  list: (projectId: string) => api.get<Vm[]>(base(projectId)),
  get: (projectId: string, zone: string, name: string) =>
    api.get<VmDetail>(`${base(projectId)}/${zone}/${name}`),
  relatedFirewalls: (projectId: string, zone: string, name: string) =>
    api.get<Firewall[]>(`${base(projectId)}/${zone}/${name}/firewalls`),
  start: (projectId: string, zone: string, name: string) =>
    api.post<Operation>(`${base(projectId)}/${zone}/${name}/start`),
  stop: (projectId: string, zone: string, name: string) =>
    api.post<Operation>(`${base(projectId)}/${zone}/${name}/stop`),
  reset: (projectId: string, zone: string, name: string) =>
    api.post<Operation>(`${base(projectId)}/${zone}/${name}/reset`),
  remove: (projectId: string, zone: string, name: string) =>
    api.del<Operation>(`${base(projectId)}/${zone}/${name}`),
};

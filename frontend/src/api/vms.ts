import { api } from "./client";
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

const base = (p: string) => `/api/projects/${encodeURIComponent(p)}/instances`;

export const vmsApi = {
  list: (projectId: string) => api.get<Vm[]>(base(projectId)),
  start: (projectId: string, zone: string, name: string) =>
    api.post<Operation>(`${base(projectId)}/${zone}/${name}/start`),
  stop: (projectId: string, zone: string, name: string) =>
    api.post<Operation>(`${base(projectId)}/${zone}/${name}/stop`),
  reset: (projectId: string, zone: string, name: string) =>
    api.post<Operation>(`${base(projectId)}/${zone}/${name}/reset`),
  remove: (projectId: string, zone: string, name: string) =>
    api.del<Operation>(`${base(projectId)}/${zone}/${name}`),
};

import { api } from "./client";

export type MachineType = {
  name: string;
  description?: string;
  guestCpus?: number;
  memoryMb?: number;
  isSharedCpu?: boolean;
  deprecated?: string;
};

export const machineTypesApi = {
  list: (projectId: string, zone: string) =>
    api.get<MachineType[]>(
      `/api/projects/${encodeURIComponent(projectId)}/zones/${encodeURIComponent(zone)}/machine-types`,
    ),
};

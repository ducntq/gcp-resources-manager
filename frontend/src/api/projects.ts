import { api } from "./client";

export type Project = { projectId: string; clientEmail: string };

export const projectsApi = {
  list: () => api.get<Project[]>("/api/projects"),
  refresh: () => api.post<{ count: number }>("/api/projects/refresh"),
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.upload<Project>("/api/projects", fd);
  },
  remove: (projectId: string) =>
    api.del<void>(`/api/projects/${encodeURIComponent(projectId)}`),
};

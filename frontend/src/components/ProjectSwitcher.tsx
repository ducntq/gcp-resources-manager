import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "../api/projects";
import { useActiveProject } from "../hooks/useActiveProject";
import { ChevronDown } from "lucide-react";
import { useEffect } from "react";

export function ProjectSwitcher() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });
  const [active, setActive] = useActiveProject();

  useEffect(() => {
    if (!active && projects.length > 0) setActive(projects[0].projectId);
    if (active && projects.length > 0 && !projects.some((p) => p.projectId === active))
      setActive(projects[0].projectId);
  }, [projects, active, setActive]);

  if (isLoading) return <div className="text-xs text-gray-400">loading…</div>;
  if (projects.length === 0)
    return <span className="text-xs text-gray-500">No projects</span>;

  return (
    <div className="relative">
      <select
        value={active ?? ""}
        onChange={(e) => setActive(e.target.value)}
        className="appearance-none bg-panel border border-border rounded px-2.5 py-1.5 pr-8 text-sm outline-none focus:border-blue-500"
      >
        {projects.map((p) => (
          <option key={p.projectId} value={p.projectId}>
            {p.projectId}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
      />
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "../api/projects";
import { Button } from "../components/ui/Button";
import { useRef, useState } from "react";
import { RefreshCw, Trash2, Upload } from "lucide-react";

export function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.list,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useMutation({
    mutationFn: (file: File) => projectsApi.upload(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
    onError: (e: Error) => setUploadError(e.message),
  });

  const remove = useMutation({
    mutationFn: (pid: string) => projectsApi.remove(pid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  const refresh = useMutation({
    mutationFn: () => projectsApi.refresh(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });

  return (
    <div>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-xs text-gray-400 mt-1">
            Upload a GCP service-account JSON key for each project you want to
            manage. Files are stored locally on the server.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
          >
            <RefreshCw size={14} /> Rescan
          </Button>
          <Button
            variant="primary"
            onClick={() => fileRef.current?.click()}
            disabled={upload.isPending}
          >
            <Upload size={14} /> Upload key
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              setUploadError(null);
              const f = e.target.files?.[0];
              if (f) upload.mutate(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {uploadError && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {uploadError}
        </div>
      )}
      {error && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {(error as Error).message}
        </div>
      )}

      <div className="border border-border rounded bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1b1f26] text-left text-xs uppercase text-gray-400">
            <tr>
              <th className="px-3 py-2">Project ID</th>
              <th className="px-3 py-2">Service account</th>
              <th className="px-3 py-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-3 py-4 text-gray-400" colSpan={3}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && projects.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-400" colSpan={3}>
                  No projects configured. Upload a key to get started.
                </td>
              </tr>
            )}
            {projects.map((p) => (
              <tr key={p.projectId} className="border-t border-border">
                <td className="px-3 py-2 font-mono">{p.projectId}</td>
                <td className="px-3 py-2 font-mono text-gray-300">
                  {p.clientEmail}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Remove key for ${p.projectId}?`))
                        remove.mutate(p.projectId);
                    }}
                  >
                    <Trash2 size={13} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

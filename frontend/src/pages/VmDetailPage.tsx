import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { vmsApi } from "../api/vms";
import { useActiveProject } from "../hooks/useActiveProject";
import { VmDetailView } from "../components/VmDetailView";
import { RelatedFirewalls } from "../components/RelatedFirewalls";
import { VmEditModal } from "../components/VmEditModal";
import { Button } from "../components/ui/Button";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";

export function VmDetailPage() {
  const [projectId] = useActiveProject();
  const { zone, name } = useParams<{ zone: string; name: string }>();
  const [editing, setEditing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["vm", projectId, zone, name],
    queryFn: () => vmsApi.get(projectId!, zone!, name!),
    enabled: !!projectId && !!zone && !!name,
  });

  if (!projectId)
    return (
      <div className="text-sm text-gray-400">
        No active project. Upload a key on the Projects page.
      </div>
    );

  return (
    <div>
      <header className="mb-4 flex items-start justify-between gap-4">
        <div>
          <Link
            to="/vms"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 mb-2"
          >
            <ArrowLeft size={12} /> Back to instances
          </Link>
          <h1 className="text-xl font-semibold font-mono">{name}</h1>
          <p className="text-xs text-gray-400 mt-1">
            <span className="font-mono">{zone}</span> ·{" "}
            <span className="font-mono text-gray-200">{projectId}</span>
          </p>
        </div>
        {data && (
          <Button variant="primary" onClick={() => setEditing(true)}>
            <Pencil size={14} /> Edit
          </Button>
        )}
      </header>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading details…
        </div>
      )}
      {error && (
        <div className="px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {(error as Error).message}
        </div>
      )}
      {data && (
        <div className="space-y-5">
          <VmDetailView vm={data} />
          <RelatedFirewalls projectId={projectId} zone={zone!} name={name!} />
        </div>
      )}

      {editing && data && (
        <VmEditModal
          projectId={projectId}
          vm={data}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

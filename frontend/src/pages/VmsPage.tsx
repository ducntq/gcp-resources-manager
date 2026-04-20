import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vmsApi, type Vm } from "../api/vms";
import { useActiveProject } from "../hooks/useActiveProject";
import { Button } from "../components/ui/Button";
import { Play, RefreshCw, RotateCcw, Square, Trash2 } from "lucide-react";
import { clsx } from "clsx";

export function VmsPage() {
  const [projectId] = useActiveProject();
  const qc = useQueryClient();

  const { data: vms = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["vms", projectId],
    queryFn: () => vmsApi.list(projectId!),
    enabled: !!projectId,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["vms", projectId] });

  const start = useMutation({
    mutationFn: (v: Vm) => vmsApi.start(projectId!, v.zone, v.name),
    onSuccess: invalidate,
  });
  const stop = useMutation({
    mutationFn: (v: Vm) => vmsApi.stop(projectId!, v.zone, v.name),
    onSuccess: invalidate,
  });
  const reset = useMutation({
    mutationFn: (v: Vm) => vmsApi.reset(projectId!, v.zone, v.name),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (v: Vm) => vmsApi.remove(projectId!, v.zone, v.name),
    onSuccess: invalidate,
  });

  if (!projectId)
    return (
      <div className="text-sm text-gray-400">
        No active project. Upload a key on the Projects page.
      </div>
    );

  return (
    <div>
      <header className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">VM Instances</h1>
          <p className="text-xs text-gray-400 mt-1">
            Across all zones in{" "}
            <span className="font-mono text-gray-200">{projectId}</span>
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />{" "}
          Refresh
        </Button>
      </header>

      {error && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {(error as Error).message}
        </div>
      )}

      <div className="border border-border rounded bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1b1f26] text-left text-xs uppercase text-gray-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Zone</th>
              <th className="px-3 py-2">Machine type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Internal IP</th>
              <th className="px-3 py-2">External IP</th>
              <th className="px-3 py-2 w-48">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td className="px-3 py-4 text-gray-400" colSpan={7}>
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading && vms.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-400" colSpan={7}>
                  No instances.
                </td>
              </tr>
            )}
            {vms.map((v) => {
              const running = v.status === "RUNNING";
              const busy =
                start.isPending ||
                stop.isPending ||
                reset.isPending ||
                remove.isPending;
              return (
                <tr key={`${v.zone}/${v.name}`} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{v.name}</td>
                  <td className="px-3 py-2 text-gray-300">{v.zone}</td>
                  <td className="px-3 py-2 text-gray-300">{v.machineType}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={v.status} />
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-300">
                    {v.internalIps?.join(", ") ?? "—"}
                  </td>
                  <td className="px-3 py-2 font-mono text-gray-300">
                    {v.externalIps?.join(", ") ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy || running}
                        onClick={() => start.mutate(v)}
                      >
                        <Play size={12} /> Start
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy || !running}
                        onClick={() => stop.mutate(v)}
                      >
                        <Square size={12} /> Stop
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy || !running}
                        onClick={() => reset.mutate(v)}
                      >
                        <RotateCcw size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busy}
                        onClick={() => {
                          if (confirm(`Delete instance ${v.name}?`))
                            remove.mutate(v);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status?: string }) {
  const color = {
    RUNNING: "bg-green-500/20 text-green-300 border-green-500/40",
    TERMINATED: "bg-gray-500/20 text-gray-300 border-gray-500/40",
    STOPPING: "bg-yellow-500/20 text-yellow-200 border-yellow-500/40",
    STOPPED: "bg-gray-500/20 text-gray-300 border-gray-500/40",
    PROVISIONING: "bg-blue-500/20 text-blue-200 border-blue-500/40",
    STAGING: "bg-blue-500/20 text-blue-200 border-blue-500/40",
    REPAIRING: "bg-orange-500/20 text-orange-200 border-orange-500/40",
  }[status ?? ""] ?? "bg-gray-500/20 text-gray-300 border-gray-500/40";
  return (
    <span
      className={clsx(
        "inline-block px-1.5 py-0.5 rounded border text-[11px] font-mono",
        color,
      )}
    >
      {status ?? "UNKNOWN"}
    </span>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { firewallsApi, type Firewall, type FirewallInput } from "../api/firewalls";
import { waitForOperation } from "../api/operations";
import { useActiveProject } from "../hooks/useActiveProject";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Field, TextInput } from "../components/ui/Field";
import { Loader2, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

const emptyInput: FirewallInput = {
  name: "",
  description: "",
  network: "default",
  priority: 1000,
  direction: "INGRESS",
  sourceRanges: [],
  targetTags: [],
  allowed: [{ ipProtocol: "tcp", ports: ["22"] }],
};

export function FirewallsPage() {
  const [projectId] = useActiveProject();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<
    { mode: "create" } | { mode: "edit"; original: Firewall } | null
  >(null);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const { data: rules = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["firewalls", projectId],
    queryFn: () => firewallsApi.list(projectId!),
    enabled: !!projectId,
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["firewalls", projectId] });

  const create = useMutation({
    mutationFn: async (input: FirewallInput) => {
      const op = await firewallsApi.create(projectId!, input);
      await waitForOperation(projectId!, op);
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const update = useMutation({
    mutationFn: async ({ name, input }: { name: string; input: FirewallInput }) => {
      const op = await firewallsApi.update(projectId!, name, input);
      await waitForOperation(projectId!, op);
    },
    onSuccess: () => {
      invalidate();
      setEditing(null);
    },
  });
  const remove = useMutation({
    mutationFn: async (name: string) => {
      setDeleting((d) => new Set(d).add(name));
      try {
        const op = await firewallsApi.remove(projectId!, name);
        await waitForOperation(projectId!, op);
      } finally {
        setDeleting((d) => {
          const n = new Set(d);
          n.delete(name);
          return n;
        });
        invalidate();
      }
    },
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
          <h1 className="text-xl font-semibold">Firewall Rules</h1>
          <p className="text-xs text-gray-400 mt-1">
            VPC firewall rules in{" "}
            <span className="font-mono text-gray-200">{projectId}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />{" "}
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setEditing({ mode: "create" })}>
            <Plus size={14} /> New rule
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {(error as Error).message}
        </div>
      )}
      {remove.error && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {(remove.error as Error).message}
        </div>
      )}

      <div className="border border-border rounded bg-panel overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1b1f26] text-left text-xs uppercase text-gray-400">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Network</th>
              <th className="px-3 py-2">Direction</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Sources / Targets</th>
              <th className="px-3 py-2">Action</th>
              <th className="px-3 py-2 w-28"></th>
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
            {!isLoading && rules.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-400" colSpan={7}>
                  No firewall rules.
                </td>
              </tr>
            )}
            {rules.map((r) => {
              const isDeleting = deleting.has(r.name);
              return (
              <tr key={r.name} className="border-t border-border align-top">
                <td className="px-3 py-2 font-mono">
                  <span className="inline-flex items-center gap-2">
                    {r.name}
                    {isDeleting && (
                      <Loader2 size={12} className="animate-spin text-gray-400" />
                    )}
                  </span>
                  {r.disabled && (
                    <span className="ml-2 text-[10px] text-yellow-300">
                      disabled
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-300">{r.network}</td>
                <td className="px-3 py-2 text-gray-300">{r.direction}</td>
                <td className="px-3 py-2 text-gray-300">{r.priority}</td>
                <td className="px-3 py-2 text-gray-300 text-xs">
                  {r.sourceRanges?.length
                    ? `src: ${r.sourceRanges.join(", ")}`
                    : ""}
                  {r.targetTags?.length && (
                    <div>tags: {r.targetTags.join(", ")}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-xs font-mono text-gray-300">
                  {r.allowed?.map((a, i) => (
                    <div key={i}>
                      allow {a.ipProtocol}
                      {a.ports ? `:${a.ports.join(",")}` : ""}
                    </div>
                  ))}
                  {r.denied?.map((a, i) => (
                    <div key={i} className="text-red-300">
                      deny {a.ipProtocol}
                      {a.ports ? `:${a.ports.join(",")}` : ""}
                    </div>
                  ))}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      disabled={isDeleting}
                      onClick={() => setEditing({ mode: "edit", original: r })}
                    >
                      <Pencil size={12} />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isDeleting}
                      onClick={() => {
                        if (confirm(`Delete firewall rule ${r.name}?`))
                          remove.mutate(r.name);
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

      {editing && (
        <FirewallEditor
          initial={
            editing.mode === "create"
              ? emptyInput
              : toInput(editing.original)
          }
          isEdit={editing.mode === "edit"}
          onClose={() => setEditing(null)}
          onSubmit={(input) => {
            if (editing.mode === "create") create.mutate(input);
            else update.mutate({ name: editing.original.name, input });
          }}
          pending={create.isPending || update.isPending}
          error={
            (create.error as Error)?.message ??
            (update.error as Error)?.message ??
            null
          }
        />
      )}
    </div>
  );
}

function toInput(f: Firewall): FirewallInput {
  return {
    name: f.name,
    description: f.description ?? "",
    network: f.network ?? "default",
    priority: f.priority ?? 1000,
    direction: f.direction ?? "INGRESS",
    sourceRanges: f.sourceRanges ?? [],
    destinationRanges: f.destinationRanges ?? [],
    targetTags: f.targetTags ?? [],
    sourceTags: f.sourceTags ?? [],
    allowed: f.allowed ?? [],
    denied: f.denied ?? [],
    disabled: f.disabled,
  };
}

function FirewallEditor({
  initial,
  isEdit,
  onClose,
  onSubmit,
  pending,
  error,
}: {
  initial: FirewallInput;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (input: FirewallInput) => void;
  pending: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<FirewallInput>(initial);
  const [sourceRangesText, setSourceRangesText] = useState(
    initial.sourceRanges?.join(", ") ?? "",
  );
  const [targetTagsText, setTargetTagsText] = useState(
    initial.targetTags?.join(", ") ?? "",
  );
  const set = <K extends keyof FirewallInput>(k: K, v: FirewallInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const entries = form.allowed ?? [];
  const updateEntry = (i: number, proto: string, ports: string) => {
    const next = [...entries];
    next[i] = {
      ipProtocol: proto,
      ports: ports
        ? ports.split(",").map((p) => p.trim()).filter(Boolean)
        : undefined,
    };
    set("allowed", next);
  };

  const parseList = (s: string) =>
    s.split(",").map((p) => p.trim()).filter(Boolean);

  const submit = () =>
    onSubmit({
      ...form,
      sourceRanges: parseList(sourceRangesText),
      targetTags: parseList(targetTagsText),
    });

  return (
    <Modal
      open
      wide
      title={isEdit ? `Edit ${initial.name}` : "New firewall rule"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={pending || !form.name}
            onClick={submit}
          >
            {pending ? "Saving…" : isEdit ? "Update" : "Create"}
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-red-200">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-x-4">
        <Field label="Name">
          <TextInput
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={isEdit}
            placeholder="allow-ssh"
          />
        </Field>
        <Field label="Network">
          <TextInput
            value={form.network ?? ""}
            onChange={(e) => set("network", e.target.value)}
            placeholder="default"
          />
        </Field>
        <Field label="Direction">
          <select
            value={form.direction ?? "INGRESS"}
            onChange={(e) =>
              set("direction", e.target.value as "INGRESS" | "EGRESS")
            }
            className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm"
          >
            <option value="INGRESS">INGRESS</option>
            <option value="EGRESS">EGRESS</option>
          </select>
        </Field>
        <Field label="Priority" hint="0 (highest) – 65535">
          <TextInput
            type="number"
            value={form.priority ?? 1000}
            onChange={(e) => set("priority", Number(e.target.value))}
          />
        </Field>
        <Field
          label="Source ranges"
          hint="Comma-separated CIDRs, e.g. 0.0.0.0/0"
        >
          <TextInput
            value={sourceRangesText}
            onChange={(e) => setSourceRangesText(e.target.value)}
          />
        </Field>
        <Field label="Target tags" hint="Comma-separated network tags">
          <TextInput
            value={targetTagsText}
            onChange={(e) => setTargetTagsText(e.target.value)}
          />
        </Field>
        <div className="col-span-2">
          <Field label="Description">
            <TextInput
              value={form.description ?? ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase tracking-wide text-gray-400">
            Allowed
          </span>
          <Button
            size="sm"
            onClick={() =>
              set("allowed", [...entries, { ipProtocol: "tcp", ports: [] }])
            }
          >
            <Plus size={12} /> Add
          </Button>
        </div>
        <div className="space-y-2">
          {entries.length === 0 && (
            <div className="text-xs text-gray-500">No allow rules.</div>
          )}
          {entries.map((e, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr_auto] gap-2">
              <TextInput
                value={e.ipProtocol ?? ""}
                onChange={(ev) => updateEntry(i, ev.target.value, e.ports?.join(",") ?? "")}
                placeholder="tcp/udp/icmp/all"
              />
              <TextInput
                value={e.ports?.join(",") ?? ""}
                onChange={(ev) => updateEntry(i, e.ipProtocol ?? "", ev.target.value)}
                placeholder="22, 80, 443 (blank for all)"
              />
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  const next = [...entries];
                  next.splice(i, 1);
                  set("allowed", next);
                }}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.disabled}
            onChange={(e) => set("disabled", e.target.checked)}
          />
          Disabled
        </label>
      </div>
    </Modal>
  );
}

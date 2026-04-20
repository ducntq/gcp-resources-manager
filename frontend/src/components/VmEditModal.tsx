import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { vmsApi, type VmDetail, type VmPatchInput } from "../api/vms";
import { machineTypesApi, type MachineType } from "../api/machineTypes";
import { waitForOperation } from "../api/operations";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Field, TextInput } from "./ui/Field";
import { Plus, Trash2 } from "lucide-react";

type KV = { key: string; value: string };

type Props = {
  projectId: string;
  vm: VmDetail;
  onClose: () => void;
};

export function VmEditModal({ projectId, vm, onClose }: Props) {
  const qc = useQueryClient();
  const [labels, setLabels] = useState<KV[]>(toKVs(vm.labels));
  const [tagsText, setTagsText] = useState(vm.tags?.join(", ") ?? "");
  const [metadata, setMetadata] = useState<KV[]>(
    vm.metadata?.map((m) => ({ key: m.key, value: m.value ?? "" })) ?? [],
  );
  const [deletionProtection, setDeletionProtection] = useState(
    !!vm.deletionProtection,
  );
  const [machineType, setMachineType] = useState(vm.machineType ?? "");

  const patch = useMutation({
    mutationFn: async () => {
      const input: VmPatchInput = {};

      const newLabels = kvsToRecord(labels);
      if (!shallowEqualRecord(newLabels, vm.labels ?? {}))
        input.labels = newLabels;

      const newTags = tagsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!arraysEqualSorted(newTags, vm.tags ?? [])) input.tags = newTags;

      const newMeta = metadata
        .filter((m) => m.key.trim())
        .map((m) => ({ key: m.key.trim(), value: m.value }));
      if (
        !metadataEqual(
          newMeta,
          (vm.metadata ?? []).map((m) => ({
            key: m.key,
            value: m.value ?? "",
          })),
        )
      )
        input.metadata = newMeta;

      if (deletionProtection !== !!vm.deletionProtection)
        input.deletionProtection = deletionProtection;

      const mt = machineType.trim();
      if (mt && mt !== (vm.machineType ?? "")) input.machineType = mt;

      if (Object.keys(input).length === 0) return;

      const ops = await vmsApi.patch(projectId, vm.zone, vm.name, input);
      for (const op of ops) await waitForOperation(projectId, op);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vm", projectId, vm.zone, vm.name] });
      qc.invalidateQueries({ queryKey: ["vms", projectId] });
      onClose();
    },
  });

  const disableMachineType = vm.status === "RUNNING";

  const { data: machineTypes = [], isLoading: mtLoading } = useQuery({
    queryKey: ["machine-types", projectId, vm.zone],
    queryFn: () => machineTypesApi.list(projectId, vm.zone),
    staleTime: 60 * 60_000,
  });

  const grouped = useMemo(() => groupByFamily(machineTypes), [machineTypes]);
  const currentInList = machineTypes.some((m) => m.name === machineType);

  return (
    <Modal
      open
      wide
      title={`Edit ${vm.name}`}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose} disabled={patch.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => patch.mutate()}
            disabled={patch.isPending}
          >
            {patch.isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      {patch.error && (
        <div className="mb-3 px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-sm text-red-200">
          {(patch.error as Error).message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4">
        <Field
          label="Machine type"
          hint={
            disableMachineType
              ? "Stop the instance to change its machine type."
              : mtLoading
                ? "Loading available types…"
                : `${machineTypes.length} types available in ${vm.zone}`
          }
        >
          <select
            value={machineType}
            onChange={(e) => setMachineType(e.target.value)}
            disabled={disableMachineType || mtLoading}
            className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
          >
            {!currentInList && machineType && (
              <option value={machineType}>{machineType} (current)</option>
            )}
            {grouped.map(([family, types]) => (
              <optgroup key={family} label={family}>
                {types.map((m) => (
                  <option key={m.name} value={m.name}>
                    {formatMachineTypeOption(m)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
        <Field label="Deletion protection">
          <label className="inline-flex items-center gap-2 pt-1.5 text-sm">
            <input
              type="checkbox"
              checked={deletionProtection}
              onChange={(e) => setDeletionProtection(e.target.checked)}
            />
            Prevent accidental deletion
          </label>
        </Field>
        <div className="col-span-2">
          <Field label="Network tags" hint="Comma-separated, used for firewall targeting">
            <TextInput
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="http-server, ssh"
            />
          </Field>
        </div>
      </div>

      <PairEditor
        title="Labels"
        entries={labels}
        onChange={setLabels}
        addLabel="Add label"
        keyPlaceholder="env"
        valuePlaceholder="prod"
      />

      <PairEditor
        title="Metadata"
        entries={metadata}
        onChange={setMetadata}
        addLabel="Add metadata"
        keyPlaceholder="startup-script"
        valuePlaceholder="value"
        multilineValue
      />
    </Modal>
  );
}

function PairEditor({
  title,
  entries,
  onChange,
  addLabel,
  keyPlaceholder,
  valuePlaceholder,
  multilineValue,
}: {
  title: string;
  entries: KV[];
  onChange: (next: KV[]) => void;
  addLabel: string;
  keyPlaceholder: string;
  valuePlaceholder: string;
  multilineValue?: boolean;
}) {
  const update = (i: number, patch: Partial<KV>) => {
    const next = entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e));
    onChange(next);
  };
  const remove = (i: number) => onChange(entries.filter((_, idx) => idx !== i));
  const add = () => onChange([...entries, { key: "", value: "" }]);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs uppercase tracking-wide text-gray-400">
          {title}
        </span>
        <Button size="sm" onClick={add}>
          <Plus size={12} /> {addLabel}
        </Button>
      </div>
      {entries.length === 0 && (
        <div className="text-xs text-gray-500">None.</div>
      )}
      <div className="space-y-2">
        {entries.map((e, i) => (
          <div
            key={i}
            className={`grid gap-2 items-start ${
              multilineValue
                ? "grid-cols-[180px_1fr_auto]"
                : "grid-cols-[180px_1fr_auto]"
            }`}
          >
            <TextInput
              value={e.key}
              onChange={(ev) => update(i, { key: ev.target.value })}
              placeholder={keyPlaceholder}
            />
            {multilineValue ? (
              <textarea
                value={e.value}
                onChange={(ev) => update(i, { value: ev.target.value })}
                placeholder={valuePlaceholder}
                rows={2}
                className="w-full bg-bg border border-border rounded px-2 py-1.5 text-sm outline-none focus:border-blue-500 font-mono"
              />
            ) : (
              <TextInput
                value={e.value}
                onChange={(ev) => update(i, { value: ev.target.value })}
                placeholder={valuePlaceholder}
              />
            )}
            <Button size="sm" variant="danger" onClick={() => remove(i)}>
              <Trash2 size={12} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function toKVs(rec?: Record<string, string>): KV[] {
  return rec ? Object.entries(rec).map(([key, value]) => ({ key, value })) : [];
}

function kvsToRecord(kvs: KV[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { key, value } of kvs) {
    const k = key.trim();
    if (k) out[k] = value;
  }
  return out;
}

function shallowEqualRecord(
  a: Record<string, string>,
  b: Record<string, string>,
) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) if (a[k] !== b[k]) return false;
  return true;
}

function arraysEqualSorted(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const as = [...a].sort();
  const bs = [...b].sort();
  return as.every((v, i) => v === bs[i]);
}

function formatMachineTypeOption(m: MachineType) {
  const cpu = m.isSharedCpu ? "shared CPU" : `${m.guestCpus ?? "?"} vCPU`;
  const memGb = m.memoryMb ? m.memoryMb / 1024 : null;
  const mem =
    memGb === null
      ? "? GB"
      : memGb >= 1 && Math.abs(memGb - Math.round(memGb)) < 0.05
        ? `${Math.round(memGb)} GB`
        : `${memGb.toFixed(memGb < 1 ? 2 : 1)} GB`;
  const dep = m.deprecated ? " · deprecated" : "";
  return `${m.name} — ${cpu}, ${mem}${dep}`;
}

function groupByFamily(types: MachineType[]): [string, MachineType[]][] {
  const families = new Map<string, MachineType[]>();
  for (const m of types) {
    const family = m.name.split("-")[0] || "other";
    const arr = families.get(family) ?? [];
    arr.push(m);
    families.set(family, arr);
  }
  for (const arr of families.values()) {
    arr.sort((a, b) => {
      const ca = a.guestCpus ?? 0;
      const cb = b.guestCpus ?? 0;
      if (ca !== cb) return ca - cb;
      return (a.memoryMb ?? 0) - (b.memoryMb ?? 0);
    });
  }
  return [...families.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function metadataEqual(a: KV[], b: KV[]) {
  if (a.length !== b.length) return false;
  const sort = (arr: KV[]) => [...arr].sort((x, y) => x.key.localeCompare(y.key));
  const as = sort(a);
  const bs = sort(b);
  return as.every(
    (x, i) => x.key === bs[i].key && (x.value ?? "") === (bs[i].value ?? ""),
  );
}

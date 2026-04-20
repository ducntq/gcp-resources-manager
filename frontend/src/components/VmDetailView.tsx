import type { ReactNode } from "react";
import type { VmDetail } from "../api/vms";

export function VmDetailView({ vm }: { vm: VmDetail }) {
  return (
    <div className="space-y-5 text-sm">
      <Section title="Overview">
        <KV k="Status" v={vm.status} mono />
        <KV k="Zone" v={vm.zone} mono />
        <KV k="Machine type" v={vm.machineType} mono />
        <KV k="CPU platform" v={vm.cpuPlatform} />
        <KV k="ID" v={vm.id} mono />
        <KV k="Hostname" v={vm.hostname} />
        <KV k="Description" v={vm.description} />
        <KV k="Created" v={fmtDate(vm.creationTimestamp)} />
        <KV k="Last start" v={fmtDate(vm.lastStartTimestamp)} />
        <KV k="Last stop" v={fmtDate(vm.lastStopTimestamp)} />
        <KV k="Deletion protection" v={boolText(vm.deletionProtection)} />
        <KV k="IP forwarding" v={boolText(vm.canIpForward)} />
      </Section>

      <Section title="Network interfaces">
        {(vm.networkInterfaces ?? []).map((nic, i) => (
          <div
            key={i}
            className="mb-3 last:mb-0 border border-border rounded p-2 bg-bg"
          >
            <KV k="Name" v={nic.name} mono />
            <KV k="Network" v={nic.network} mono />
            <KV k="Subnetwork" v={nic.subnetwork} mono />
            <KV k="Internal IP" v={nic.networkIP} mono />
            <KV k="NIC type" v={nic.nicType} />
            <KV k="Stack type" v={nic.stackType} />
            {nic.accessConfigs?.length ? (
              <div className="mt-1">
                <div className="text-[11px] uppercase text-gray-500 mb-0.5">
                  Access configs
                </div>
                {nic.accessConfigs.map((a, j) => (
                  <div key={j} className="pl-2 text-xs text-gray-300">
                    {a.type ?? "—"}: {a.natIP ?? "no external IP"}
                    {a.networkTier ? ` (${a.networkTier})` : ""}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {!vm.networkInterfaces?.length && <Empty />}
      </Section>

      <Section title="Disks">
        {(vm.disks ?? []).map((d, i) => (
          <div
            key={i}
            className="mb-2 last:mb-0 border border-border rounded p-2 bg-bg"
          >
            <KV k="Device name" v={d.deviceName} mono />
            <KV k="Source" v={d.source} mono />
            <KV k="Boot" v={boolText(d.boot)} />
            <KV k="Auto-delete" v={boolText(d.autoDelete)} />
            <KV k="Mode" v={d.mode} />
            <KV k="Type" v={d.type} />
            {d.diskSizeGb && <KV k="Size" v={`${d.diskSizeGb} GB`} />}
          </div>
        ))}
        {!vm.disks?.length && <Empty />}
      </Section>

      <Section title="Service accounts">
        {(vm.serviceAccounts ?? []).map((s, i) => (
          <div key={i} className="mb-2 last:mb-0">
            <div className="font-mono">{s.email}</div>
            {s.scopes?.length ? (
              <ul className="pl-4 list-disc text-xs text-gray-400">
                {s.scopes.map((sc) => (
                  <li key={sc} className="font-mono">
                    {sc}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
        {!vm.serviceAccounts?.length && <Empty />}
      </Section>

      <Section title="Scheduling">
        {vm.scheduling ? (
          <>
            <KV k="Provisioning model" v={vm.scheduling.provisioningModel} />
            <KV k="On host maintenance" v={vm.scheduling.onHostMaintenance} />
            <KV
              k="Automatic restart"
              v={boolText(vm.scheduling.automaticRestart)}
            />
            <KV k="Preemptible" v={boolText(vm.scheduling.preemptible)} />
          </>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Shielded VM">
        {vm.shieldedInstanceConfig ? (
          <>
            <KV
              k="Secure Boot"
              v={boolText(vm.shieldedInstanceConfig.enableSecureBoot)}
            />
            <KV k="vTPM" v={boolText(vm.shieldedInstanceConfig.enableVtpm)} />
            <KV
              k="Integrity monitoring"
              v={boolText(vm.shieldedInstanceConfig.enableIntegrityMonitoring)}
            />
          </>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Labels">
        {vm.labels && Object.keys(vm.labels).length ? (
          <div className="flex flex-wrap gap-1">
            {Object.entries(vm.labels).map(([k, v]) => (
              <span
                key={k}
                className="font-mono text-[11px] px-1.5 py-0.5 border border-border rounded bg-bg"
              >
                {k}={v}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Network tags">
        {vm.tags?.length ? (
          <div className="flex flex-wrap gap-1">
            {vm.tags.map((t) => (
              <span
                key={t}
                className="font-mono text-[11px] px-1.5 py-0.5 border border-border rounded bg-bg"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <Empty />
        )}
      </Section>

      <Section title="Metadata">
        {vm.metadata?.length ? (
          <div className="border border-border rounded overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {vm.metadata.map((m) => (
                  <tr key={m.key} className="border-b border-border last:border-0">
                    <td className="px-2 py-1 font-mono text-gray-300 w-48 align-top">
                      {m.key}
                    </td>
                    <td className="px-2 py-1 font-mono text-gray-400 whitespace-pre-wrap break-all">
                      {m.value ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

function KV({ k, v, mono }: { k: string; v?: ReactNode; mono?: boolean }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="flex gap-3 py-0.5">
      <div className="w-44 text-gray-400 text-xs">{k}</div>
      <div className={mono ? "font-mono text-gray-200" : "text-gray-200"}>
        {v}
      </div>
    </div>
  );
}

function Empty() {
  return <div className="text-gray-500 text-xs">—</div>;
}

function boolText(b?: boolean) {
  if (b === undefined || b === null) return undefined;
  return b ? "Yes" : "No";
}

function fmtDate(s?: string) {
  if (!s) return undefined;
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s;
  }
}

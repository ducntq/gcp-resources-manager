import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { vmsApi } from "../api/vms";
import type { Firewall } from "../api/firewalls";
import { Loader2 } from "lucide-react";

export function RelatedFirewalls({
  projectId,
  zone,
  name,
}: {
  projectId: string;
  zone: string;
  name: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["vm-firewalls", projectId, zone, name],
    queryFn: () => vmsApi.relatedFirewalls(projectId, zone, name),
  });

  return (
    <section>
      <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-2">
        Related firewall rules
      </h3>
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 size={12} className="animate-spin" /> Matching rules…
        </div>
      )}
      {error && (
        <div className="px-3 py-2 rounded border border-red-600/40 bg-red-600/10 text-xs text-red-200">
          {(error as Error).message}
        </div>
      )}
      {data && data.length === 0 && (
        <div className="text-xs text-gray-500">
          No firewall rules target this instance.
        </div>
      )}
      {data && data.length > 0 && (
        <div className="border border-border rounded bg-panel overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-[#1b1f26] text-left uppercase text-gray-400">
              <tr>
                <th className="px-2 py-1.5">Name</th>
                <th className="px-2 py-1.5">Direction</th>
                <th className="px-2 py-1.5">Priority</th>
                <th className="px-2 py-1.5">Scope</th>
                <th className="px-2 py-1.5">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortRules(data).map((r) => (
                <tr key={r.name} className="border-t border-border align-top">
                  <td className="px-2 py-1.5 font-mono">
                    <Link
                      to={`/firewalls?edit=${encodeURIComponent(r.name)}`}
                      className="text-blue-300 hover:text-blue-200 hover:underline"
                    >
                      {r.name}
                    </Link>
                    {r.disabled && (
                      <span className="ml-2 text-[10px] text-yellow-300">
                        disabled
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-gray-300">{r.direction}</td>
                  <td className="px-2 py-1.5 text-gray-300">{r.priority}</td>
                  <td className="px-2 py-1.5 text-gray-300">
                    {r.direction === "EGRESS"
                      ? r.destinationRanges?.length
                        ? `to ${r.destinationRanges.join(", ")}`
                        : "to any"
                      : r.sourceRanges?.length
                        ? `from ${r.sourceRanges.join(", ")}`
                        : r.sourceTags?.length
                          ? `from tags: ${r.sourceTags.join(", ")}`
                          : "from any"}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-gray-300">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function sortRules(rules: Firewall[]) {
  return [...rules].sort(
    (a, b) => (a.priority ?? 1000) - (b.priority ?? 1000),
  );
}

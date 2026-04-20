import { api } from "./client";

export type OperationError = { code?: string; message?: string };

export type Operation = {
  id?: string;
  name: string;
  operationType?: string;
  status?: "PENDING" | "RUNNING" | "DONE" | string;
  progress?: number;
  targetLink?: string;
  zone?: string | null;
  error?: OperationError[];
};

export const operationsApi = {
  get: (projectId: string, name: string, zone?: string | null) => {
    const q = zone ? `?zone=${encodeURIComponent(zone)}` : "";
    return api.get<Operation>(
      `/api/projects/${encodeURIComponent(projectId)}/operations/${encodeURIComponent(name)}${q}`,
    );
  },
};

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function waitForOperation(
  projectId: string,
  op: Operation,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<Operation> {
  const interval = opts.intervalMs ?? 1500;
  const deadline = Date.now() + (opts.timeoutMs ?? 5 * 60_000);
  let current = op;
  while (current.status !== "DONE") {
    if (Date.now() > deadline)
      throw new Error(`Operation ${op.name} timed out waiting for completion.`);
    await sleep(interval);
    current = await operationsApi.get(projectId, current.name, current.zone);
  }
  if (current.error?.length) {
    const msg = current.error
      .map((e) => `${e.code ?? ""} ${e.message ?? ""}`.trim())
      .filter(Boolean)
      .join("; ");
    throw new Error(msg || "Operation failed.");
  }
  return current;
}

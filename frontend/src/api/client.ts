export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
  }
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

async function request<T>(path: string, options?: RequestOptions): Promise<T> {
  const { body: rawBody, headers: rawHeaders, ...rest } = options ?? {};
  const headers = new Headers(rawHeaders);
  let body: BodyInit | undefined;
  if (rawBody instanceof FormData) {
    body = rawBody;
  } else if (rawBody !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(rawBody);
  }

  const res = await fetch(path, { ...rest, headers, body });
  const text = await res.text();
  const data = text ? safeParse(text) : undefined;
  if (!res.ok) {
    const msg =
      (data as { error?: string } | undefined)?.error ??
      `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
};

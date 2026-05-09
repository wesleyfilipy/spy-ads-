const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type RequestOptions = RequestInit & { token?: string };

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...rest } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers ?? {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error ?? 'Request failed');
  }

  return res.json();
}

export function apiGet<T>(path: string, token?: string) {
  return apiFetch<T>(path, { method: 'GET', token });
}

export function apiPost<T>(path: string, body: unknown, token?: string) {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    token,
  });
}

export function apiPatch<T>(path: string, body: unknown, token?: string) {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
    token,
  });
}

export function apiDelete<T>(path: string, token?: string) {
  return apiFetch<T>(path, { method: 'DELETE', token });
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'X-API-Key': API_KEY },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) throw new Error(json.message || 'Unknown error');
  return json.data as T;
}

export async function apiPut<T>(path: string, data: T): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
}

export async function apiPost<T>(path: string, body: FormData | object): Promise<T> {
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = { 'X-API-Key': API_KEY };
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: isFormData ? body : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) throw new Error(json.message || 'Unknown error');
  return json.data as T;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers: { 'X-API-Key': API_KEY },
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
}

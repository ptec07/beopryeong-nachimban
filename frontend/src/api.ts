import { AskRequest, AskResponse } from './types';

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, '');
  if (!trimmed || trimmed === '/') {
    return '/api';
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

export function buildApiUrl(path: string, baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const apiPath = normalizedPath.startsWith('/api/') ? normalizedPath.slice('/api'.length) : normalizedPath;
  return `${normalizeBaseUrl(baseUrl)}${apiPath}`;
}

export async function askLegalCompass(
  request: AskRequest,
  baseUrl = import.meta.env.VITE_API_BASE_URL || '/api',
): Promise<AskResponse> {
  const response = await fetch(buildApiUrl('/ask', baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`요청에 실패했습니다. 상태 코드: ${response.status}`);
  }

  return response.json() as Promise<AskResponse>;
}

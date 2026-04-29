import { AskRequest, AskResponse } from './types';

export async function askLegalCompass(request: AskRequest): Promise<AskResponse> {
  const response = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`요청에 실패했습니다. 상태 코드: ${response.status}`);
  }

  return response.json() as Promise<AskResponse>;
}

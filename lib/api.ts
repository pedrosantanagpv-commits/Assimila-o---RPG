export type ABC = {
  a: number;
  b: number;
  c: number;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  action?: string;
  message?: string;
  data?: T;
};

export async function callAssimilacaoApi<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
  usuario = 'Mestre'
): Promise<ApiResponse<T>> {
  const response = await fetch('/api/assimilacao', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      usuario,
      payload,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || 'Erro ao chamar API.');
  }

  return data;
}

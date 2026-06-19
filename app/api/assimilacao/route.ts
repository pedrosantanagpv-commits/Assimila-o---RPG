export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const appsScriptUrl = process.env.APPS_SCRIPT_URL;

    if (!appsScriptUrl) {
      return Response.json(
        {
          success: false,
          message: 'APPS_SCRIPT_URL não configurada na Vercel.',
        },
        { status: 500 }
      );
    }

    const body = await req.json();

    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        // Apps Script costuma lidar melhor com text/plain em chamadas externas.
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        ...body,
        token: process.env.APPS_SCRIPT_TOKEN || '',
      }),
      cache: 'no-store',
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = {
        success: false,
        message: 'Resposta inválida do Apps Script.',
        raw: text,
      };
    }

    return Response.json(data, { status: data.success === false ? 400 : 200 });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Proxy Assimilação online.',
  });
}

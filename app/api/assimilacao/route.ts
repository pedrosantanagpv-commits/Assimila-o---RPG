export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        ...body,
        token: process.env.APPS_SCRIPT_TOKEN || '',
      }),
      redirect: 'follow',
      cache: 'no-store',
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return Response.json(
        {
          success: false,
          message: 'Apps Script respondeu, mas não retornou JSON válido.',
          status: response.status,
          raw: text.slice(0, 500),
        },
        { status: 500 }
      );
    }

    return Response.json(data, {
      status: data.success === false ? 400 : 200,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erro inesperado.',
        hint: 'A Vercel não conseguiu chamar o Apps Script. Verifique APPS_SCRIPT_URL e o acesso público do Web App.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    success: true,
    message: 'Proxy Assimilação online.',
    hasAppsScriptUrl: Boolean(process.env.APPS_SCRIPT_URL),
    appsScriptUrlPreview: process.env.APPS_SCRIPT_URL
      ? process.env.APPS_SCRIPT_URL.slice(0, 45) + '...'
      : null,
  });
}

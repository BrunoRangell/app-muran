// Proxy de imagens da Meta (fbcdn) para contornar CORS / hotlinking / ad-blockers.
// Whitelist estrita de domínios para evitar SSRF.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization',
};

const ALLOWED_HOST_SUFFIXES = [
  '.fbcdn.net',
  '.facebook.com',
  '.akamaihd.net',
  '.cdninstagram.com',
];

function isAllowed(u: URL): boolean {
  const host = u.hostname.toLowerCase();
  return ALLOWED_HOST_SUFFIXES.some((suf) => host === suf.replace(/^\./, '') || host.endsWith(suf));
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const reqUrl = new URL(req.url);
    const raw = reqUrl.searchParams.get('url');
    if (!raw) {
      return new Response('Missing url param', { status: 400, headers: corsHeaders });
    }

    let target: URL;
    try {
      target = new URL(raw);
    } catch {
      return new Response('Invalid url', { status: 400, headers: corsHeaders });
    }

    if (target.protocol !== 'https:' || !isAllowed(target)) {
      return new Response('Domain not allowed', { status: 403, headers: corsHeaders });
    }

    const upstream = await fetch(target.toString(), {
      headers: {
        // Alguns CDNs Meta retornam 403 sem User-Agent comum
        'User-Agent': 'Mozilla/5.0 (compatible; MuranReports/1.0)',
        'Accept': 'image/avif,image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new Response(`Upstream ${upstream.status}`, {
        status: upstream.status,
        headers: corsHeaders,
      });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const body = await upstream.arrayBuffer();

    return new Response(body, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (e) {
    console.error('[meta-image-proxy]', e);
    return new Response('Proxy error', { status: 500, headers: corsHeaders });
  }
});

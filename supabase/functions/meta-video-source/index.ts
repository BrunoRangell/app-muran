// Resolve o source (mp4) e permalink de um vídeo da Meta a partir de um video_id.
// Mantém o access_token no backend e responde com JSON pequeno (URLs).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey',
};

const META_API_VERSION = 'v24.0';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const videoId = url.searchParams.get('video_id');
    if (!videoId || !/^\d+$/.test(videoId)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid video_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokenData, error: tokenError } = await supabase
      .from('api_tokens')
      .select('value')
      .eq('name', 'meta_access_token')
      .single();

    if (tokenError || !tokenData?.value) {
      return new Response(JSON.stringify({ error: 'Meta token não configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = tokenData.value;
    const metaUrl = `https://graph.facebook.com/${META_API_VERSION}/${videoId}?fields=source,permalink_url,picture&access_token=${encodeURIComponent(accessToken)}`;

    const upstream = await fetch(metaUrl);
    const body = await upstream.json();

    if (!upstream.ok) {
      console.error('[meta-video-source] Graph API error', upstream.status, body);
      return new Response(
        JSON.stringify({ error: body?.error?.message || 'Erro Graph API', status: upstream.status }),
        { status: upstream.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = {
      video_id: videoId,
      source: body?.source || null,
      permalink_url: body?.permalink_url || null,
      picture: body?.picture || null,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=21600', // 6h
      },
    });
  } catch (e) {
    console.error('[meta-video-source]', e);
    return new Response(JSON.stringify({ error: 'Erro interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

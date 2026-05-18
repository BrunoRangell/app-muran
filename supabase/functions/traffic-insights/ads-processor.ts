import { TopAd } from "./types.ts";

const META_API_VERSION = "v24.0";

const VIDEO_MEDIA_TYPES = new Set([
  'video',
  'video_inline',
  'video_autoplay',
  'video_direct_response',
  'video_direct_response_autoplay',
  'native_video',
  'animated_image_video',
  'animated_image_autoplay',
  'share',
]);

/**
 * Escolhe a melhor URL de imagem disponível para um criativo Meta.
 * Cascata determinística (alta → baixa fidelidade).
 */
function pickBestCreativeImage(creative: any): {
  url?: string;
  source: string;
  mediaType: 'image' | 'video' | 'carousel';
  videoId?: string;
  imageHash?: string;
} {
  const story = creative?.object_story_spec || {};
  const feed = creative?.asset_feed_spec || {};

  // Detectar tipo de mídia primeiro
  let mediaType: 'image' | 'video' | 'carousel' = 'image';
  if (
    story.video_data ||
    creative?.video_id ||
    (Array.isArray(feed.videos) && feed.videos.length > 0)
  ) {
    mediaType = 'video';
  }
  if (Array.isArray(story.link_data?.child_attachments) && story.link_data.child_attachments.length > 1) {
    mediaType = 'carousel';
  }

  // Cascata de imagem
  if (Array.isArray(feed.images) && feed.images[0]?.url) {
    return { url: feed.images[0].url, source: 'asset_feed.images', mediaType, imageHash: feed.images[0].hash };
  }
  if (story.video_data?.image_url) {
    return { url: story.video_data.image_url, source: 'video_data.image_url', mediaType: 'video', videoId: story.video_data.video_id };
  }
  if (story.link_data?.picture) {
    return { url: story.link_data.picture, source: 'link_data.picture', mediaType, imageHash: story.link_data.image_hash };
  }
  if (Array.isArray(story.link_data?.child_attachments)) {
    const firstWithPic = story.link_data.child_attachments.find((c: any) => c?.picture);
    if (firstWithPic?.picture) {
      return { url: firstWithPic.picture, source: 'link_data.child_attachments[0].picture', mediaType: 'carousel' };
    }
  }
  if (story.photo_data?.url) {
    return { url: story.photo_data.url, source: 'photo_data.url', mediaType, imageHash: story.photo_data.image_hash };
  }
  if (Array.isArray(feed.videos) && feed.videos[0]?.thumbnail_url) {
    return { url: feed.videos[0].thumbnail_url, source: 'asset_feed.videos[0].thumbnail_url', mediaType: 'video', videoId: feed.videos[0].video_id };
  }
  if (creative?.image_url) {
    return { url: creative.image_url, source: 'creative.image_url', mediaType };
  }
  if (creative?.thumbnail_url) {
    return { url: creative.thumbnail_url, source: 'creative.thumbnail_url', mediaType };
  }

  // Sem URL direta — pode ser hash isolado
  const hash = creative?.image_hash || story.link_data?.image_hash || story.photo_data?.image_hash;
  return { url: undefined, source: 'none', mediaType, imageHash: hash, videoId: story.video_data?.video_id || creative?.video_id };
}

/**
 * Resolve hashes de imagem em URLs reais via /{act_id}/adimages.
 */
async function resolveImageHashes(
  accountId: string,
  accessToken: string,
  hashes: string[]
): Promise<Record<string, string>> {
  if (hashes.length === 0) return {};
  const unique = Array.from(new Set(hashes));
  const params = new URLSearchParams({
    access_token: accessToken,
    hashes: JSON.stringify(unique),
    fields: 'hash,url,permalink_url',
  });
  const url = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/adimages?${params}`;
  try {
    const r = await fetch(url);
    if (!r.ok) {
      console.warn(`[META-ADS] adimages lookup failed: ${r.status}`);
      return {};
    }
    const data = await r.json();
    const map: Record<string, string> = {};
    if (data?.data && typeof data.data === 'object') {
      // Meta retorna como objeto { hash: { url, permalink_url } } ou array
      if (Array.isArray(data.data)) {
        for (const img of data.data) {
          if (img?.hash && (img.url || img.permalink_url)) {
            map[img.hash] = img.url || img.permalink_url;
          }
        }
      } else {
        for (const [h, info] of Object.entries<any>(data.data)) {
          if (info?.url || info?.permalink_url) {
            map[h] = info.url || info.permalink_url;
          }
        }
      }
    }
    return map;
  } catch (e) {
    console.warn('[META-ADS] adimages error:', e);
    return {};
  }
}

/**
 * Resolve posts via object_story_id (page_id_post_id) para anúncios de "publicação existente".
 * Retorna mapa { postId -> { mediaType, videoId, thumbnail, permalink } }.
 */
async function resolveObjectStoryPosts(
  accessToken: string,
  postIds: string[]
): Promise<Record<string, { mediaType: 'image' | 'video' | 'carousel'; videoId?: string; photoId?: string; thumbnail?: string; permalink?: string }>> {
  if (postIds.length === 0) return {};
  const unique = Array.from(new Set(postIds));
  const out: Record<string, any> = {};

  const chunkSize = 40;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const params = new URLSearchParams({
      access_token: accessToken,
      ids: chunk.join(','),
      fields: [
        'full_picture',
        'picture',
        'permalink_url',
        'source',
        'type',
        'status_type',
        'object_id',
        'attachments{media_type,type,media,subattachments,target,url,unshimmed_url}',
      ].join(','),
    });
    const url = `https://graph.facebook.com/${META_API_VERSION}/?${params}`;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const txt = await r.text();
        console.warn(`[META-ADS] object_story_id lookup failed: ${r.status} ${txt.slice(0, 300)}`);
        continue;
      }
      const data = await r.json();
      for (const [postId, post] of Object.entries<any>(data)) {
        if (!post || typeof post !== 'object') continue;
        const att = post?.attachments?.data?.[0];
        const subs = att?.subattachments?.data;
        // Per docs: StoryAttachment.type é o identificador canônico (photo, video, album, multiple, ...).
        const attType = (att?.type || att?.media_type || '').toString().toLowerCase();
        const firstSubType = (Array.isArray(subs) ? (subs[0]?.type || subs[0]?.media_type) : '')?.toString().toLowerCase() || '';
        const postType = (post?.type || post?.status_type || '').toString().toLowerCase();

        const isVideo =
          VIDEO_MEDIA_TYPES.has(attType) ||
          attType.includes('video') ||
          postType.includes('video') ||
          !!att?.media?.source ||
          /\/videos\//.test(att?.url || '') ||
          /\/videos\//.test(att?.target?.url || '') ||
          /\/videos\//.test(att?.unshimmed_url || '');

        const isCarousel =
          !isVideo && (
            attType === 'album' ||
            attType === 'multiple' ||
            (Array.isArray(subs) && subs.length > 1)
          );

        const mediaType: 'image' | 'video' | 'carousel' = isVideo
          ? 'video'
          : isCarousel
          ? 'carousel'
          : 'image';

        // videoId só é confiável quando o tipo indica vídeo
        let videoId: string | undefined;
        if (mediaType === 'video') {
          const targetIdIfVideo = (attType.includes('video') || VIDEO_MEDIA_TYPES.has(attType)) ? att?.target?.id : undefined;
          const candidates = [
            targetIdIfVideo,
            att?.media?.id,
            (att?.url || '').match(/\/videos\/(\d+)/)?.[1],
            (att?.unshimmed_url || '').match(/\/videos\/(\d+)/)?.[1],
            (att?.target?.url || '').match(/\/videos\/(\d+)/)?.[1],
          ];
          videoId = candidates.find((v) => typeof v === 'string' && /^\d+$/.test(v));
        }

        // photoId só quando o tipo justifica (photo ou primeiro sub photo)
        let photoId: string | undefined;
        if (mediaType === 'image' && attType === 'photo') {
          photoId = typeof att?.target?.id === 'string' && /^\d+$/.test(att.target.id) ? att.target.id : undefined;
        } else if (mediaType === 'carousel' && firstSubType === 'photo') {
          const tid = subs?.[0]?.target?.id;
          photoId = typeof tid === 'string' && /^\d+$/.test(tid) ? tid : undefined;
        }

        // Cascateamento de thumbnail — sempre devolver alguma coisa (post.picture como último recurso).
        const thumbnail =
          post?.full_picture ||
          att?.media?.image?.src ||
          subs?.[0]?.media?.image?.src ||
          post?.picture ||
          undefined;

        out[postId] = {
          mediaType,
          videoId,
          photoId,
          thumbnail,
          permalink: post?.permalink_url,
        };
      }
    } catch (e) {
      console.warn('[META-ADS] object_story_id lookup error:', e);
    }
  }

  return out;
}

/**
 * Resolve fotos por ID buscando o array `images` e selecionando a maior versão.
 */
async function resolvePhotoImages(
  accessToken: string,
  photoIds: string[]
): Promise<Record<string, { url?: string; permalink?: string }>> {
  if (photoIds.length === 0) return {};
  const unique = Array.from(new Set(photoIds.filter((v) => /^\d+$/.test(v))));
  const out: Record<string, any> = {};
  const chunkSize = 40;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const params = new URLSearchParams({
      access_token: accessToken,
      ids: chunk.join(','),
      fields: 'images,permalink_url',
    });
    const url = `https://graph.facebook.com/${META_API_VERSION}/?${params}`;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const txt = await r.text();
        console.warn(`[META-ADS] photo images lookup failed: ${r.status} ${txt.slice(0, 200)}`);
        continue;
      }
      const data = await r.json();
      for (const [pid, info] of Object.entries<any>(data)) {
        if (!info || typeof info !== 'object') continue;
        const images = Array.isArray(info.images) ? [...info.images] : [];
        images.sort((a: any, b: any) => (b?.width || 0) - (a?.width || 0));
        const best = images[0]?.source;
        out[pid] = { url: best, permalink: info.permalink_url };
      }
    } catch (e) {
      console.warn('[META-ADS] photo images lookup error:', e);
    }
  }
  return out;
}

/**
 * Busca detalhes de vídeos (thumbnail HD, picture, permalink) por video_id em lote.
 */
async function resolveVideoDetails(
  accessToken: string,
  videoIds: string[]
): Promise<Record<string, { picture?: string; permalink?: string }>> {
  if (videoIds.length === 0) return {};
  const unique = Array.from(new Set(videoIds.filter((v) => /^\d+$/.test(v))));
  const out: Record<string, any> = {};
  const chunkSize = 40;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const params = new URLSearchParams({
      access_token: accessToken,
      ids: chunk.join(','),
      fields: 'picture,permalink_url',
    });
    const url = `https://graph.facebook.com/${META_API_VERSION}/?${params}`;
    try {
      const r = await fetch(url);
      if (!r.ok) {
        const txt = await r.text();
        console.warn(`[META-ADS] video details lookup failed: ${r.status} ${txt.slice(0, 200)}`);
        continue;
      }
      const data = await r.json();
      for (const [vid, info] of Object.entries<any>(data)) {
        if (!info || typeof info !== 'object') continue;
        out[vid] = { picture: info.picture, permalink: info.permalink_url };
      }
    } catch (e) {
      console.warn('[META-ADS] video details lookup error:', e);
    }
  }
  return out;
}

export async function fetchMetaTopAds(
  accountId: string,
  accessToken: string,
  since: string,
  until: string,
  limit: number = 10
): Promise<TopAd[]> {
  // Campos expandidos cobrindo todos os tipos de criativo
  const creativeFields = [
    'id',
    'name',
    'thumbnail_url',
    'image_url',
    'image_hash',
    'video_id',
    'object_type',
    'object_story_id',
    'effective_object_story_id',
    'object_story_spec{link_data{picture,image_hash,child_attachments{picture,image_hash}},video_data{image_url,video_id},photo_data{url,image_hash}}',
    'asset_feed_spec{images{url,hash},videos{thumbnail_url,video_id}}',
  ].join(',');

  const fields = [
    'id',
    'name',
    `creative{${creativeFields}}`,
    `insights.time_range({"since":"${since}","until":"${until}"}).fields(impressions,clicks,ctr,spend,actions,cost_per_action_type)`,
  ].join(',');

  const params = new URLSearchParams({
    access_token: accessToken,
    fields,
    limit: '100',
    effective_status: '["ACTIVE","PAUSED"]',
    // Força thumbnails em alta resolução (válido para creative.thumbnail_url)
    thumbnail_width: '600',
    thumbnail_height: '600',
  });

  const url = `https://graph.facebook.com/${META_API_VERSION}/${accountId}/ads?${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ [META-ADS] Error fetching ads: ${response.status} ${response.statusText} - ${text.slice(0, 500)}`);
      return [];
    }

    const data = await response.json();
    const ads: TopAd[] = [];
    const hashesToResolve: string[] = [];
    const pendingHashLookups: { ad: TopAd; hash: string }[] = [];

    if (data.data && Array.isArray(data.data)) {
      for (const ad of data.data) {
        if (!ad.insights?.data?.[0]) continue;

        const insight = ad.insights.data[0];
        const impressions = parseInt(insight.impressions || '0');
        const clicks = parseInt(insight.clicks || '0');
        const spend = parseFloat(insight.spend || '0');
        const ctr = parseFloat(insight.ctr || '0');

        // Extract conversions
        let conversions = 0;
        if (insight.actions && Array.isArray(insight.actions)) {
          const convActions = insight.actions.filter((action: any) =>
            action.action_type === 'lead' ||
            action.action_type === 'purchase' ||
            action.action_type === 'omni_purchase'
          );
          conversions = convActions.reduce((sum: number, action: any) =>
            sum + parseInt(action.value || '0'), 0
          );
        }

        const cpa = conversions > 0 ? spend / conversions : 0;
        const cpc = clicks > 0 ? spend / clicks : 0;

        const creative = ad.creative || {};
        const picked = pickBestCreativeImage(creative);

        const topAd: TopAd = {
          id: ad.id,
          name: ad.name || creative.name || 'Unnamed Ad',
          platform: 'meta',
          creative: {
            thumbnail: picked.url,
            title: creative.title,
            body: creative.body,
            type: creative.object_type?.toLowerCase(),
            mediaType: picked.mediaType,
            videoId: picked.videoId,
            thumbnailSource: picked.source,
          },
          metrics: { impressions, clicks, ctr, conversions, cpa, cpc, spend },
        };

        // Se não temos URL mas temos hash, agendar resolução
        if (!picked.url && picked.imageHash) {
          hashesToResolve.push(picked.imageHash);
          pendingHashLookups.push({ ad: topAd, hash: picked.imageHash });
        }

        // Anexar object_story_id para resolução posterior (ads de "publicação existente")
        const storyId = creative.object_story_id || creative.effective_object_story_id;
        if (storyId) {
          (topAd as any).__storyId = storyId;
        }

        ads.push(topAd);
      }
    }

    // Resolver hashes pendentes em uma única chamada batch
    if (hashesToResolve.length > 0) {
      const hashMap = await resolveImageHashes(accountId, accessToken, hashesToResolve);
      for (const { ad, hash } of pendingHashLookups) {
        if (hashMap[hash]) {
          ad.creative.thumbnail = hashMap[hash];
          ad.creative.thumbnailSource = 'adimages_hash_lookup';
        }
      }
    }

    // Resolver posts via object_story_id (ads de "publicação existente")
    // Necessário quando o video_id não veio no creative ou thumbnail está ausente/genérico.
    const storyLookups: { ad: TopAd; storyId: string }[] = [];
    for (const ad of ads) {
      const storyId = (ad as any).__storyId as string | undefined;
      if (!storyId) continue;
      const needsResolve =
        (ad.creative.mediaType === 'video' && !ad.creative.videoId) ||
        !ad.creative.thumbnail ||
        ad.creative.thumbnailSource === 'creative.thumbnail_url' ||
        ad.creative.thumbnailSource === 'none';
      if (needsResolve) storyLookups.push({ ad, storyId });
    }
    if (storyLookups.length > 0) {
      const postMap = await resolveObjectStoryPosts(
        accessToken,
        storyLookups.map((s) => s.storyId)
      );
      let resolved = 0;
      const photoLookups: { ad: TopAd; photoId: string }[] = [];
      for (const { ad, storyId } of storyLookups) {
        const post = postMap[storyId];
        if (!post) continue;
        if (post.mediaType) ad.creative.mediaType = post.mediaType;
        if (post.videoId && !ad.creative.videoId) ad.creative.videoId = post.videoId;
        if (post.thumbnail) {
          ad.creative.thumbnail = post.thumbnail;
          ad.creative.thumbnailSource = 'object_story_id_lookup';
        }
        if (post.permalink && !ad.creative.permalinkUrl) {
          ad.creative.permalinkUrl = post.permalink;
        }
        if (post.photoId && (post.mediaType === 'image' || post.mediaType === 'carousel')) {
          photoLookups.push({ ad, photoId: post.photoId });
        }
        resolved++;
      }
      console.log(`📎 [META-ADS] object_story_id resolved: ${resolved}/${storyLookups.length}`);

      // Resolver versão HD da foto via /{photo_id}?fields=images
      if (photoLookups.length > 0) {
        const photoMap = await resolvePhotoImages(
          accessToken,
          photoLookups.map((p) => p.photoId)
        );
        let upgraded = 0;
        for (const { ad, photoId } of photoLookups) {
          const info = photoMap[photoId];
          if (!info?.url) continue;
          ad.creative.thumbnail = info.url;
          ad.creative.thumbnailSource = 'photo_images_lookup';
          if (info.permalink && !ad.creative.permalinkUrl) {
            ad.creative.permalinkUrl = info.permalink;
          }
          upgraded++;
        }
        console.log(`🖼️ [META-ADS] photo images upgraded: ${upgraded}/${photoLookups.length}`);
      }
    }

    // Enriquecer vídeos com picture/permalink HD via /{video_id}
    const videoIdsToEnrich = ads
      .filter((a) => a.creative.mediaType === 'video' && a.creative.videoId)
      .map((a) => a.creative.videoId!) as string[];
    if (videoIdsToEnrich.length > 0) {
      const videoMap = await resolveVideoDetails(accessToken, videoIdsToEnrich);
      let enriched = 0;
      for (const ad of ads) {
        const vid = ad.creative.videoId;
        if (!vid) continue;
        const info = videoMap[vid];
        if (!info) continue;
        if (info.picture && (!ad.creative.thumbnail || ad.creative.thumbnailSource === 'creative.thumbnail_url' || ad.creative.thumbnailSource === 'none')) {
          ad.creative.thumbnail = info.picture;
          ad.creative.thumbnailSource = 'video_details_lookup';
        }
        if (info.permalink && !ad.creative.permalinkUrl) {
          ad.creative.permalinkUrl = info.permalink;
        }
        enriched++;
      }
      console.log(`🎬 [META-ADS] video details enriched: ${enriched}/${videoIdsToEnrich.length}`);
    }

    for (const ad of ads) delete (ad as any).__storyId;

    // Último recurso: tentar upscale de URLs da CDN da Meta que vieram como thumbnail pequena
    for (const ad of ads) {
      const t = ad.creative.thumbnail;
      if (!t) continue;
      const upscaled = upscaleMetaCdnUrl(t);
      if (upscaled && upscaled !== t) {
        ad.creative.thumbnail = upscaled;
        ad.creative.thumbnailSource = (ad.creative.thumbnailSource || 'unknown') + '+upscaled';
      }
    }

    // Log telemetria de fontes
    const sourceStats: Record<string, number> = {};
    for (const a of ads) {
      const s = a.creative.thumbnailSource || 'unknown';
      sourceStats[s] = (sourceStats[s] || 0) + 1;
    }
    console.log(`📸 [META-ADS] ${ads.length} ads — thumbnail sources:`, sourceStats);

    return ads.sort((a, b) => b.metrics.impressions - a.metrics.impressions).slice(0, limit);
  } catch (error) {
    console.error(`❌ [META-ADS] Error:`, error);
    return [];
  }
}


export async function fetchGoogleTopAds(
  customerId: string,
  accessToken: string,
  developerToken: string,
  managerId: string | null,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopAd[]> {
  const query = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.responsive_display_ad.marketing_images,
      ad_group_ad.ad.image_ad.image_url,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.average_cpc,
      metrics.cost_micros
    FROM ad_group_ad
    WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    AND ad_group_ad.status IN ('ENABLED', 'PAUSED')
    AND metrics.impressions > 0
    ORDER BY metrics.impressions DESC
    LIMIT ${limit}
  `;

  const url = `https://googleads.googleapis.com/v21/customers/${customerId}/googleAds:search`;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': developerToken,
    'Content-Type': 'application/json'
  };

  if (managerId) {
    headers['login-customer-id'] = managerId.replace(/-/g, '');
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      console.error(`❌ [GOOGLE-ADS] Error fetching ads:`, response.statusText);
      return [];
    }

    const results = await response.json();
    const ads: TopAd[] = [];

    if (results?.results && Array.isArray(results.results)) {
      for (const row of results.results) {
        const ad = row.adGroupAd?.ad;
        const metrics = row.metrics;

        if (!ad || !metrics) continue;

        const impressions = parseInt(metrics.impressions || '0');
        const clicks = parseInt(metrics.clicks || '0');
        const spend = parseFloat(metrics.costMicros || '0') / 1000000;
        const conversions = parseFloat(metrics.conversions || '0');
        const ctr = parseFloat(metrics.ctr || '0') * 100;
        const cpa = parseFloat(metrics.costPerConversion || '0') / 1000000;
        const cpc = parseFloat(metrics.averageCpc || '0') / 1000000;

        // Extract thumbnail
        let thumbnail: string | undefined;
        if (ad.responsiveDisplayAd?.marketingImages?.[0]?.asset) {
          thumbnail = ad.responsiveDisplayAd.marketingImages[0].asset;
        } else if (ad.imageAd?.imageUrl) {
          thumbnail = ad.imageAd.imageUrl;
        }

        ads.push({
          id: ad.id?.toString() || 'unknown',
          name: ad.name || 'Unnamed Ad',
          platform: 'google',
          creative: {
            thumbnail,
            type: ad.type?.toLowerCase()
          },
          metrics: {
            impressions,
            clicks,
            ctr,
            conversions,
            cpa,
            cpc,
            spend
          }
        });
      }
    }

    return ads;
  } catch (error) {
    console.error(`❌ [GOOGLE-ADS] Error:`, error);
    return [];
  }
}

export function mergeTopAds(metaAds: TopAd[], googleAds: TopAd[], limit: number = 10): TopAd[] {
  const combined = [...metaAds, ...googleAds];
  return combined.sort((a, b) => b.metrics.impressions - a.metrics.impressions).slice(0, limit);
}

/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://flix.1anime.app';

const languageMap: Record<string, string> = {
  'chinese - hong kong': 'zh',
  'chinese - traditional': 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  'english - sdh': 'en',
  finnish: 'fi',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hungarian: 'hu',
  italian: 'it',
  korean: 'ko',
  norwegian: 'no',
  polish: 'pl',
  portuguese: 'pt',
  'portuguese - brazilian': 'pt',
  romanian: 'ro',
  'spanish - european': 'es',
  'spanish - latin american': 'es',
  swedish: 'sv',
  turkish: 'tr',
  اَلْعَرَبِيَّةُ: 'ar',
  বাংলা: 'bn',
  filipino: 'tl',
  indonesia: 'id',
  اردو: 'ur',
};

function createProxyUrl(originalUrl: string, referer?: string): string {
  const encodedUrl = encodeURIComponent(originalUrl);
  const encodedHeaders = encodeURIComponent(
    JSON.stringify({
      referer,
    }),
  );

  return `https://proxy.fifthwit.net/m3u8-proxy?url=${encodedUrl}&headers=${encodedHeaders}`;
}

function processProxiedURL(url: string): string {
  // Handle orbitproxy URLs
  if (url.includes('orbitproxy')) {
    try {
      const urlParts = url.split(/orbitproxy\.[^/]+\//);
      if (urlParts.length >= 2) {
        const encryptedPart = urlParts[1].split('.m3u8')[0];
        try {
          const decodedData =
            typeof window !== 'undefined'
              ? atob(encryptedPart)
              : Buffer.from(encryptedPart, 'base64').toString('utf-8');

          const jsonData = JSON.parse(decodedData);
          const originalUrl = jsonData.u;
          const referer = jsonData.r || '';

          return createProxyUrl(originalUrl, referer);
        } catch (jsonError) {
          console.error('Error decoding/parsing orbitproxy data:', jsonError);
        }
      }
    } catch (error) {
      console.error('Error processing orbitproxy URL:', error);
    }
  }

  // Handle other proxied URLs
  if (url.includes('/m3u8-proxy?url=')) {
    return url.replace(/https:\/\/[^/]+\/m3u8-proxy/, 'https://proxy.fifthwit.net/m3u8-proxy');
  }

  return createProxyUrl(url);
}

function isOnionflixerUrl(url: string): boolean {
  return url.includes('onionflixer');
}

function processSubtitles(subtitles: any[] | undefined): any[] {
  const captions = [];

  if (subtitles && Array.isArray(subtitles)) {
    for (const sub of subtitles) {
      const url = sub.url || sub.file;
      const lang = sub.lang || sub.label || 'unknown';

      if (url) {
        captions.push({
          type: sub.type || 'vtt',
          url,
          language: languageMap[lang.toLowerCase()] || lang.toLowerCase() || 'unknown',
        });
      }
    }
  }

  return captions;
}

function processApiResponse(response: any, ctx: any): EmbedOutput {
  if (!response) {
    throw new NotFoundError('No response received');
  }

  if (response.error) {
    throw new NotFoundError(`${response.error}${response.hint ? ` - ${response.hint}` : ''}`);
  }

  // Handle array responses (multiple provider options)
  if (Array.isArray(response)) {
    for (const item of response) {
      // Handle format with headers and sources array
      if (item.headers && item.sources && Array.isArray(item.sources)) {
        const bestSource = item.sources.find((s: any) => s.isM3U8);
        if (bestSource && bestSource.url) {
          const playlistUrl = processProxiedURL(bestSource.url);
          const captions = processSubtitles(item.subtitles);

          return {
            stream: [
              {
                id: 'primary',
                type: 'hls',
                playlist: playlistUrl,
                flags: [flags.CORS_ALLOWED],
                captions,
              },
            ],
          };
        }
      }

      // Handle format with source.provider and source.files
      if (item.source && item.source.files && Array.isArray(item.source.files)) {
        const bestFile = item.source.files.find((f: any) => f.type === 'hls' || f.file.includes('.m3u8'));
        if (bestFile && bestFile.file) {
          const playlistUrl = processProxiedURL(bestFile.file);
          const captions = processSubtitles(item.source.subtitles);

          return {
            stream: [
              {
                id: 'primary',
                type: 'hls',
                playlist: playlistUrl,
                flags: [flags.CORS_ALLOWED],
                captions,
              },
            ],
          };
        }
      }
    }
  }

  // Handle original format with sources object
  const sourcesObj = response.sources;
  if (sourcesObj) {
    let bestSource = null;

    // Look through all providers in the sources object
    for (const provider in sourcesObj) {
      if (Object.prototype.hasOwnProperty.call(sourcesObj, provider)) {
        const providerSources = sourcesObj[provider];
        if (providerSources && providerSources.length > 0) {
          // Find the highest quality non-onionflixer source
          for (const source of providerSources) {
            if (source.url && source.isM3U8 && !isOnionflixerUrl(source.url)) {
              bestSource = source;
              break;
            }
          }
          // If we found a good source, no need to check other providers
          if (bestSource) break;
        }
      }
    }

    // If no non-onionflixer source was found, use the first available one
    if (!bestSource) {
      for (const provider in sourcesObj) {
        if (Object.prototype.hasOwnProperty.call(sourcesObj, provider)) {
          const providerSources = sourcesObj[provider];
          if (providerSources && providerSources.length > 0) {
            bestSource = providerSources[0];
            break;
          }
        }
      }
    }

    if (bestSource && bestSource.url) {
      const playlistUrl = processProxiedURL(bestSource.url);
      const captions = processSubtitles(response.subtitles);

      ctx.progress(100);

      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: createProxyUrl(playlistUrl, ctx.referer),
            flags: [flags.CORS_ALLOWED],
            captions,
          },
        ],
      };
    }
  }

  throw new NotFoundError('No valid stream URL found in response');
}

/* MOVIE & TV PROVIDERS */
const movieTvProviders = [
  { id: 'autoembed', name: 'Autoembed', rank: 165 },
  { id: 'vidsrcsu', name: 'vidsrc.su', rank: 164, disabled: true },
  { id: 'primebox', name: 'Primebox', rank: 162, disabled: true },
  { id: 'foxstream', name: 'Foxstream', rank: 161, disabled: true },
  { id: 'flixhq', name: 'FlixHQ', rank: 166 },
  { id: 'goku', name: 'Goku', rank: 163, disabled: true },
];

const createMovieTvEmbed = (provider: { id: string; name: string; rank: number; disabled?: boolean }) =>
  makeEmbed({
    id: `oneserver-${provider.id}`,
    name: provider.name,
    rank: provider.rank,
    disabled: provider.disabled,
    async scrape(ctx) {
      const query = JSON.parse(ctx.url);
      const apiUrl =
        query.type === 'movie'
          ? `${baseUrl}/movie/${provider.id}/${query.tmdbId}`
          : `${baseUrl}/tv/${provider.id}/${query.tmdbId}/${query.season}/${query.episode}`;

      try {
        const response = await ctx.fetcher(apiUrl);
        ctx.progress(50);
        return processApiResponse(response, ctx);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw new NotFoundError(`Failed to fetch from ${provider.id}: ${error}`);
      }
    },
  });

export const [
  oneServerAutoembedEmbed,
  oneServerVidsrcsuEmbed,
  oneServerPrimeboxEmbed,
  oneServerFoxstreamEmbed,
  oneServerFlixhqEmbed,
  oneServerGokuEmbed,
] = movieTvProviders.map(createMovieTvEmbed);

/* ANIME PROVIDERS */
const animeProviders = [
  { id: 'hianime', name: 'Hianime', rank: 269 },
  { id: 'animepahe', name: 'Animepahe', rank: 268 },
  { id: 'anizone', name: 'Anizone', rank: 267 },
];

const createAnimeEmbed = (provider: { id: string; name: string; rank: number }) =>
  makeEmbed({
    id: `oneserver-${provider.id}`,
    name: provider.name,
    rank: provider.rank,
    async scrape(ctx) {
      const query = JSON.parse(ctx.url);
      const apiUrl = `${baseUrl}/anime/${provider.id}/${query.anilistId}${query.episode ? `/${query.episode}` : ''}`;

      try {
        const response = await ctx.fetcher(apiUrl);
        return processApiResponse(response, ctx);
      } catch (error) {
        if (error instanceof NotFoundError) throw error;
        throw new NotFoundError(`Failed to fetch from ${provider.id}: ${error}`);
      }
    },
  });

export const [oneServerHianimeEmbed, oneServerAnimepaheEmbed, oneServerAnizoneEmbed] =
  animeProviders.map(createAnimeEmbed);

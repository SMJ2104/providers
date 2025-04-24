/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { Caption } from '../captions';

// Thanks Nemo for this API!
const BASE_URL = 'https://fed-api.pstream.org';
const CACHE_URL = 'https://fed-api.pstream.org/cache';

const getShareConsent = (): string | null => {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem('share-token') : null;
  } catch (e) {
    console.warn('Unable to access localStorage:', e);
    return null;
  }
};

// Language mapping for subtitles
const languageMap: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Portuguese: 'pt',
  Arabic: 'ar',
  Russian: 'ru',
  Japanese: 'ja',
  Korean: 'ko',
  Chinese: 'zh',
  Hindi: 'hi',
  Turkish: 'tr',
  Dutch: 'nl',
  Polish: 'pl',
  Swedish: 'sv',
  Indonesian: 'id',
  Thai: 'th',
  Vietnamese: 'vi',
};

interface StreamData {
  streams: Record<string, string>;
  subtitles: Record<string, any>;
  error?: string;
  name?: string;
  size?: string;
}

const providers = [
  {
    id: 'fedapi-private',
    rank: 303,
    name: 'FED API (Private)',
    useToken: true,
    useCacheUrl: false,
    disabled: true,
  },
  {
    id: 'feddb',
    rank: 302,
    name: 'Database',
    useToken: false,
    useCacheUrl: true,
  },
  {
    id: 'fedapi-shared',
    rank: 301,
    name: 'FED API (Shared)',
    useToken: false,
    useCacheUrl: false,
    disabled: true,
  },
];

function embed(provider: {
  id: string;
  rank: number;
  name: string;
  useToken: boolean;
  useCacheUrl: boolean;
  disabled?: boolean;
}) {
  return makeEmbed({
    id: provider.id,
    name: provider.name,
    rank: provider.rank,
    disabled: provider.disabled,
    async scrape(ctx): Promise<EmbedOutput> {
      // Parse the query parameters from the URL
      const query = JSON.parse(ctx.url);

      // Build the API URL based on the provider configuration and media type
      let apiUrl: string;

      if (provider.useCacheUrl) {
        // Cache URL format
        apiUrl =
          query.type === 'movie'
            ? `${CACHE_URL}/${query.imdbId}`
            : `${CACHE_URL}/${query.imdbId}/${query.season}/${query.episode}`;
      } else {
        // Standard API URL format
        apiUrl =
          query.type === 'movie'
            ? `${BASE_URL}/movie/${query.imdbId}`
            : `${BASE_URL}/tv/${query.tmdbId}/${query.season}/${query.episode}`;
      }

      // Prepare request headers
      const headers: Record<string, string> = {};
      if (provider.useToken && query.token) {
        headers['ui-token'] = query.token;
      }

      // Add share-token header if it's set to "true" in localStorage
      const shareToken = getShareConsent();
      if (shareToken === 'true') {
        headers['share-token'] = 'true';
      }

      // Fetch data from the API
      const data = await ctx.fetcher<StreamData>(apiUrl, {
        headers: Object.keys(headers).length > 0 ? headers : undefined,
      });

      if (data?.error && data.error.startsWith('No results found in MovieBox search')) {
        throw new NotFoundError('No stream found');
      }
      if (data?.error === 'No cached data found for this episode') {
        throw new NotFoundError('No stream found');
      }
      if (data?.error === 'No cached data found for this ID') {
        throw new NotFoundError('No stream found');
      }
      if (!data) throw new NotFoundError('No response from API');

      ctx.progress(50);

      // Process streams data
      const streams = Object.entries(data.streams).reduce((acc: Record<string, string>, [quality, url]) => {
        let qualityKey: number;
        if (quality === '4K') {
          qualityKey = 2160;
        } else if (quality === 'ORG') {
          return acc;
        } else {
          qualityKey = parseInt(quality.replace('P', ''), 10);
        }
        if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
        acc[qualityKey] = url;
        return acc;
      }, {});

      // Process captions data
      const captions: Caption[] = [];
      if (data.subtitles) {
        for (const [langKey, subtitleData] of Object.entries(data.subtitles)) {
          // Extract language name from key
          const languageKeyPart = langKey.split('_')[0];
          const languageName = languageKeyPart.charAt(0).toUpperCase() + languageKeyPart.slice(1);
          const languageCode = languageMap[languageName]?.toLowerCase() ?? 'unknown';

          // Check if the subtitle data is in the new format (has subtitle_link)
          if (subtitleData.subtitle_link) {
            const url = subtitleData.subtitle_link;
            const isVtt = url.toLowerCase().endsWith('.vtt');
            captions.push({
              type: isVtt ? 'vtt' : 'srt',
              id: url,
              url,
              language: languageCode,
              hasCorsRestrictions: false,
            });
          }
        }
      }

      ctx.progress(90);

      return {
        stream: [
          {
            id: 'primary',
            captions,
            qualities: {
              ...(streams[2160] && {
                '4k': {
                  type: 'mp4',
                  url: streams[2160],
                },
              }),
              ...(streams[1080] && {
                1080: {
                  type: 'mp4',
                  url: streams[1080],
                },
              }),
              ...(streams[720] && {
                720: {
                  type: 'mp4',
                  url: streams[720],
                },
              }),
              ...(streams[480] && {
                480: {
                  type: 'mp4',
                  url: streams[480],
                },
              }),
              ...(streams[360] && {
                360: {
                  type: 'mp4',
                  url: streams[360],
                },
              }),
            },
            type: 'file',
            flags: [flags.CORS_ALLOWED],
          },
        ],
      };
    },
  });
}

export const [FedAPIPrivateScraper, FedAPISharedScraper, FedDBScraper] = providers.map(embed);
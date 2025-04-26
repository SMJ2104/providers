/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

import { Caption } from '../captions';

interface StreamData {
  headers: {
    Referer: string;
    Origin?: string;
  };
  intro: {
    start: number;
    end: number;
  };
  outro: {
    start: number;
    end: number;
  };
  sources: Array<{
    url: string;
    isM3U8: boolean;
    type: string;
  }>;
  subtitles: Array<{
    url: string;
    lang: string;
  }>;
}

const providers = [
  {
    id: 'consumet-vidcloud',
    rank: 405,
    name: 'VidCloud',
    server: 'vidcloud',
  },
  {
    id: 'consumet-streamsb',
    rank: 404,
    name: 'StreamSB',
    server: 'streamsb',
    disabled: true,
  },
  {
    id: 'consumet-vidstreaming',
    rank: 403,
    name: 'VidStreaming',
    server: 'vidstreaming',
    disabled: true,
  },
  {
    id: 'consumet-streamtape',
    rank: 402,
    name: 'StreamTape',
    server: 'streamtape',
    disabled: true,
  },
];

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

function embed(provider: { id: string; rank: number; name: string; server: string; disabled?: boolean }) {
  return makeEmbed({
    id: provider.id,
    name: provider.name,
    rank: provider.rank,
    disabled: provider.disabled,
    async scrape(ctx): Promise<EmbedOutput> {
      const query = JSON.parse(ctx.url);
      const apiUrl = `https://cors.samj.app/?destination=https://consumet.pstream.org/anime/zoro/watch?episodeId=${query.episodeId}&server=${provider.server}`;

      const data = await ctx.fetcher<StreamData>(apiUrl);

      if (!data?.sources?.length) {
        throw new NotFoundError('No stream found');
      }

      ctx.progress(50);

      const captions: Caption[] = data.subtitles
        .filter((sub) => sub.lang !== 'thumbnails')
        .map((sub) => ({
          type: 'vtt',
          id: sub.url,
          url: sub.url,
          language: languageMap[sub.lang] || 'unknown',
          hasCorsRestrictions: false,
        }));

      const streams = data.sources.reduce(
        (acc, source) => {
          if (source.isM3U8) {
            acc.unknown = source.url;
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      const thumbnailTrack = data.subtitles.find((sub) => sub.lang === 'thumbnails');

      ctx.progress(90);

      return {
        stream: [
          {
            id: 'primary',
            captions,
            playlist: `https://proxy.fifthwit.net/m3u8-proxy?url=${encodeURIComponent(streams.unknown)}&headers=${encodeURIComponent(JSON.stringify({ ...(data.headers.Referer && { referer: data.headers.Referer }), ...(data.headers.Origin && { origin: data.headers.Origin }) }))}`,
            type: 'hls',
            flags: [flags.CORS_ALLOWED],
            ...(thumbnailTrack && {
              thumbnailTrack: {
                type: 'vtt',
                url: thumbnailTrack.url,
              },
            }),
          },
        ],
      };
    },
  });
}

export const [
  ConsumetVidCloudScraper,
  ConsumetStreamSBScraper,
  ConsumetVidStreamingScraper,
  ConsumetStreamTapeScraper,
] = providers.map(embed);

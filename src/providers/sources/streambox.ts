/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const streamboxBase = 'https://vidjoy.pro/embed/api/fastfetch';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const apiRes = await ctx.proxiedFetcher(
    ctx.media.type === 'movie'
      ? `${streamboxBase}/${ctx.media.tmdbId}?sr=0`
      : `${streamboxBase}/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}?sr=0`,
  );

  if (!apiRes) {
    throw new NotFoundError('Failed to fetch StreamBox data');
  }

  const data = await apiRes;

  if (data.provider !== 'MovieBox') {
    throw new NotFoundError('Not a MovieBox provider response');
  }

  if (!data.url || data.url.length === 0) {
    throw new NotFoundError('No MovieBox streams found');
  }

  const streams: Record<string, string> = {};
  data.url.forEach((stream: any) => {
    streams[stream.resulation] = stream.link;
  });

  const captions = data.tracks.map((track: any) => ({
    id: track.lang,
    url: track.url,
    language: track.code,
    type: 'srt',
  }));

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions,
        qualities: {
          ...(streams['1080'] && {
            1080: {
              type: 'mp4',
              url: streams['1080'],
            },
          }),
          ...(streams['720'] && {
            720: {
              type: 'mp4',
              url: streams['720'],
            },
          }),
          ...(streams['480'] && {
            480: {
              type: 'mp4',
              url: streams['480'],
            },
          }),
          ...(streams['360'] && {
            360: {
              type: 'mp4',
              url: streams['360'],
            },
          }),
        },
        type: 'file',
        flags: [flags.CORS_ALLOWED],
        ...(data.proxy && {
          preferredHeaders: {
            Referer: 'https://h5.aoneroom.com',
          },
          proxyDepth: 1,
        }),
      },
    ],
  };
}

export const streamboxScraper = makeSourcerer({
  id: 'streambox',
  name: 'MovieBox 🐔',
  rank: 89,
  disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

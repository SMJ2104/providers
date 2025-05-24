import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    title: ctx.media.title,
    tmdbId: ctx.media.tmdbId,
    imdbId: ctx.media.imdbId,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
    releaseYear: ctx.media.releaseYear,
  };

  const embeds = [
    {
      embedId: 'xprime-apollo',
      url: JSON.stringify(query),
    },
    {
      embedId: 'xprime-streambox',
      url: JSON.stringify(query),
    },
    {
      embedId: 'xprime-primenet',
      url: JSON.stringify(query),
    },
    {
      embedId: 'xprime-phoenix',
      url: JSON.stringify(query),
    },
    {
      embedId: 'xprime-fox',
      url: JSON.stringify(query),
    },
    {
      embedId: 'xprime-marant',
      url: JSON.stringify(query),
    },
    {
      embedId: 'xprime-volkswagen',
      url: JSON.stringify(query),
    },
  ];

  return { embeds };
}

export const xprimeScraper = makeSourcerer({
  id: 'xprimetv',
  name: 'XPrime 💣',
  rank: 250,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

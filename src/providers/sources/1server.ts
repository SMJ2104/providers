import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    title: ctx.media.title,
    tmdbId: ctx.media.tmdbId.toString(),
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
  };

  const embeds = [
    {
      embedId: 'oneserver-autoembed',
      url: JSON.stringify(query),
    },
    {
      embedId: 'oneserver-vidsrcsu',
      url: JSON.stringify(query),
    },
    {
      embedId: 'oneserver-primebox',
      url: JSON.stringify(query),
    },
    {
      embedId: 'oneserver-foxstream',
      url: JSON.stringify(query),
    },
    {
      embedId: 'oneserver-flixhq',
      url: JSON.stringify(query),
    },
    {
      embedId: 'oneserver-goku',
      url: JSON.stringify(query),
    },
    // {
    //   embedId: 'oneserver-hianime',
    //   url: JSON.stringify(query),
    // },
    // {
    //   embedId: 'oneserver-animepahe',
    //   url: JSON.stringify(query),
    // },
    // {
    //   embedId: 'oneserver-anizone',
    //   url: JSON.stringify(query),
    // },
  ];

  return { embeds };
}

export const oneServerScraper = makeSourcerer({
  id: '1server',
  name: '1Server 🤝',
  rank: 180,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

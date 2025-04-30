import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const getUserToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const authData = window.localStorage.getItem('__MW::auth');
    if (!authData) return null;
    const parsedAuth = JSON.parse(authData);
    return parsedAuth?.state?.febboxToken || null;
  } catch (e) {
    console.warn('Unable to access localStorage or parse auth data:', e);
    return null;
  }
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    imdbId: ctx.media.imdbId,
    tmdbId: ctx.media.tmdbId,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
  };

  const userToken = getUserToken();
  const embeds = [];

  if (userToken) {
    embeds.push({
      embedId: 'fedapi-private',
      url: `${JSON.stringify({ ...query, token: userToken })}`,
    });
  }

  if (!userToken) {
    embeds.push({
      embedId: 'feddb',
      url: `${JSON.stringify(query)}`,
    });
  }

  return {
    embeds,
  };
}

export const FedAPIScraper = makeSourcerer({
  id: 'fedapi',
  name: 'Febbox ⭐️',
  rank: 260,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

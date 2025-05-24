/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const apiBase = 'https://ws-m3u8.moonpic.qzz.io:3006';

async function searchAnimeFlvAPI(title: string): Promise<string> {
  const res = await fetch(`${apiBase}/search?title=${encodeURIComponent(title)}`);
  if (!res.ok) throw new NotFoundError('Anime not found in API');
  const data = await res.json();
  if (!data.url) throw new NotFoundError('Anime not found in API');
  return data.url;
}

async function getEpisodesAPI(animeUrl: string): Promise<{ number: number; url: string }[]> {
  const res = await fetch(`${apiBase}/episodes?url=${encodeURIComponent(animeUrl)}`);
  if (!res.ok) throw new NotFoundError('Episodes not found in API');
  const data = await res.json();
  if (!data.episodes) throw new NotFoundError('Episodes not found in API');
  return data.episodes;
}

async function getEmbedsAPI(episodeUrl: string): Promise<Record<string, string>> {
  const res = await fetch(`${apiBase}/embeds?episodeUrl=${encodeURIComponent(episodeUrl)}`);
  if (!res.ok) throw new NotFoundError('No embed found for this content');
  const data = await res.json();
  return data;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const title = ctx.media.title;
  if (!title) throw new NotFoundError('Missing title');

  // Search anime/movie by title using the API
  const animeUrl = await searchAnimeFlvAPI(title);

  // Get episodes using the API
  const episodes = await getEpisodesAPI(animeUrl);

  let episodeUrl = animeUrl;

  if (ctx.media.type === 'show') {
    const episode = ctx.media.episode?.number;
    if (!episode) throw new NotFoundError('Missing episode data');
    const ep = episodes.find((e) => e.number === episode);
    if (!ep) throw new NotFoundError('Episode not found');
    episodeUrl = ep.url;
  } else if (ctx.media.type === 'movie') {
    // For movies, use the first episode (by convention)
    const ep = episodes.find((e) => e.number === 1) || episodes[0];
    if (!ep) throw new NotFoundError('Movie episode not found');
    episodeUrl = ep.url;
  }

  // Get all embeds using the API
  const embedsData = await getEmbedsAPI(episodeUrl);

  const embeds = [];
  if (embedsData['streamwish-japanese']) {
    embeds.push({
      embedId: 'streamwish-japanese',
      url: embedsData['streamwish-japanese'],
    });
  }
  if (embedsData['streamtape-latino']) {
    embeds.push({
      embedId: 'streamtape-latino',
      url: embedsData['streamtape-latino'],
    });
  }

  if (embeds.length === 0) throw new NotFoundError('No valid embed found for this content');

  return { embeds };
}

export const animeflvScraper = makeSourcerer({
  id: 'animeflv',
  name: 'AnimeFLV 🏯',
  rank: 92,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: comboScraper,
  scrapeMovie: comboScraper,
});

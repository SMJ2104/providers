/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

interface HianimeSearchResult {
  success: boolean;
  data: {
    animes: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface HianimeEpisodeResult {
  success: boolean;
  data: {
    episodes: Array<{
      number: number;
      title: string;
      episodeId: string;
    }>;
  };
}

async function searchAnime(title: string): Promise<string> {
  const response = await fetch(`https://cors.samj.app/?destination=https://hianime.pstream.org/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
  if (!response.ok) throw new Error('Failed to search anime');
  const data: HianimeSearchResult = await response.json();

  if (!data.success || !data.data.animes.length) {
    throw new Error('Anime not found');
  }

  // Try to find exact match (case-insensitive)
  const match = data.data.animes.find((anime) => anime.name.toLowerCase() === title.toLowerCase());

  // Return the matched ID or fallback to the first result
  return match?.id ?? data.data.animes[0].id;
}

async function fetchTmdbSeasonEpisodes(tmdbShowId: string, seasonNumber: number): Promise<any[]> {
  const apiKey = '5b9790d9305dca8713b9a0afad42ea8d'; // plz dont abuse
  const response = await fetch(
    `https://api.themoviedb.org/3/tv/${tmdbShowId}/season/${seasonNumber}?api_key=${apiKey}`,
  );
  if (!response.ok) throw new NotFoundError('Failed to fetch season data from TMDB');
  const data = await response.json();
  return data.episodes; // each item has 'episode_number' and 'season_number'
}

async function calculateAbsoluteEpisodeNumber(
  tmdbShowId: string,
  seasonNumber: number,
  episodeNumber: number,
): Promise<number> {
  const previousSeasons = await Promise.all(
    Array.from({ length: seasonNumber - 1 }, (_, i) => fetchTmdbSeasonEpisodes(tmdbShowId, i + 1)),
  );

  const episodesBefore = previousSeasons.reduce((sum, seasonEpisodes) => sum + seasonEpisodes.length, 0);

  return episodesBefore + episodeNumber;
}

async function fetchEpisodeData(animeId: string): Promise<HianimeEpisodeResult> {
  const response = await fetch(`https://cors.samj.app/?destination=https://hianime.pstream.org/api/v2/hianime/anime/${animeId}/episodes`);
  if (!response.ok) throw new NotFoundError('Failed to fetch episode data');
  return response.json();
}

async function comboScraper(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const animeId = await searchAnime(ctx.media.title);
  // console.log(animeId);

  const absoluteEp = await calculateAbsoluteEpisodeNumber(
    ctx.media.tmdbId,
    ctx.media.season.number,
    ctx.media.episode.number,
  );

  // console.log(absoluteEp);

  const episodeData = await fetchEpisodeData(animeId);
  // console.log(episodeData);
  const episode = episodeData.data.episodes.find((ep) => ep.number === absoluteEp);
  if (!episode) throw new NotFoundError('Episode not found');

  const embeds = [
    {
      embedId: 'hianime-hd1-dub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
    {
      embedId: 'hianime-hd2-dub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
    {
      embedId: 'hianime-hd1-sub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
    {
      embedId: 'hianime-hd2-sub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
  ];

  return { embeds };
}

export const hianimeScraper = makeSourcerer({
  id: 'hianime',
  name: 'Zoro (Anime)',
  rank: 7,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: comboScraper,
});

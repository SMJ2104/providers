import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const { tmdbId, type } = ctx.media;

  if (!tmdbId) {
    throw new NotFoundError('TMDB ID is required');
  }

  // Definir baseUrl
  const baseUrl = `https://ws-m3u8.moonpic.qzz.io:3008/tmdb`;

  let url = '';
  if (type === 'movie') {
    url = `${baseUrl}/movie/${tmdbId}`;
  } else if (type === 'show') {
    const showMedia = ctx.media as Extract<typeof ctx.media, { type: 'show' }>;
    if (showMedia.season?.number != null && showMedia.episode?.number != null) {
      url = `${baseUrl}/tv/${tmdbId}/season/${showMedia.season.number}/episode/${showMedia.episode.number}`;
    } else {
      throw new NotFoundError('Missing parameters for TV episode');
    }
  } else {
    throw new NotFoundError('Missing parameters for TV episode');
  }

  // Realiza la solicitud
  const response = await fetch(url);
  if (!response.ok) {
    throw new NotFoundError(`Failed to fetch data from local server: ${response.statusText}`);
  }

  const data = await response.json();

  // Validar que vengan embeds válidos
  if (!data.embeds || !Array.isArray(data.embeds) || data.embeds.length === 0) {
    throw new NotFoundError('No valid streams found');
  }

  return { embeds: data.embeds };
}

export const cuevana3Scraper = makeSourcerer({
  id: 'cuevana3',
  name: 'Cuevana3',
  rank: 80,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

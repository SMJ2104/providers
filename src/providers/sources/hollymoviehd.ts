import CryptoJS from 'crypto-js';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { convertPlaylistsToDataUrls } from '@/utils/playlist';

const VRF_SECRET_KEY = atob('c3VwZXJzZWNyZXRrZXk=');
const apiBase = 'https://reyna.bludclart.com/api/source/hollymoviehd';

function generateVrf(tmdbId: string | number, season: string | number = '', episode: string | number = ''): string {
  const msg = `${tmdbId}:${season}:${episode}`;
  const hash = CryptoJS.HmacSHA256(msg, VRF_SECRET_KEY);
  return hash.toString(CryptoJS.enc.Hex);
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  let url = `${apiBase}/${ctx.media.tmdbId}`;
  let season = '';
  let episode = '';
  if (ctx.media.type === 'show') {
    season = ctx.media.season.number.toString();
    episode = ctx.media.episode.number.toString();
    url += `/${season}/${episode}`;
  }
  const vrf = generateVrf(ctx.media.tmdbId, season, episode);
  url += `?vrf=${vrf}`;

  const data = await ctx.proxiedFetcher(url);
  const firstUrl = data?.sources?.[0]?.file;
  if (!firstUrl) throw new NotFoundError('Sources not found.');
  ctx.progress(50);

  ctx.progress(90);
  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: await convertPlaylistsToDataUrls(ctx.proxiedFetcher, firstUrl),
        proxyDepth: 2,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const hollymoviehdScraper = makeSourcerer({
  id: 'hollymoviehd',
  name: 'HollyMovieHD 🥂',
  rank: 179,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

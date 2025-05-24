import CryptoJS from 'crypto-js';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { Qualities } from '@/providers/streams';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const VRF_SECRET_KEY = atob('c3VwZXJzZWNyZXRrZXk=');
const apiBase = 'https://reyna.bludclart.com/api/source/oneroom';

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
  const sources = data?.sources;
  if (!sources || sources.length === 0) throw new NotFoundError('Sources not found.');
  ctx.progress(50);

  // Build qualities object for mp4 sources
  const qualities: Partial<Record<Qualities, { type: 'mp4'; url: string }>> = {};
  for (const source of sources) {
    // Try to extract quality from label (e.g., '720p')
    const match = /([0-9]{3,4})p/.exec(source.label);
    const quality = match ? match[1] : 'unknown';
    qualities[quality as Qualities] = {
      type: 'mp4',
      url: source.file,
    };
  }

  ctx.progress(90);
  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        qualities,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const oneroomScraper = makeSourcerer({
  id: 'oneroom',
  name: 'OneRoom 🦭',
  rank: 179,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

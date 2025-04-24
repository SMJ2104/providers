import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

import { categorizeStreams, constructProxyUrl, getMagnetUrl, getTopStreamsBySeeders } from './common';
import { Response } from './types';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const search =
    ctx.media.type === 'movie'
      ? `movie/${ctx.media.imdbId}.json`
      : `series/${ctx.media.imdbId}:${ctx.media.season.number}:${ctx.media.episode.number}.json`;

  const response: Response = await ctx
    .fetcher(
      `https://torrentio.strem.fun/providers=yts,eztv,rarbg,1337x,thepiratebay,kickasstorrents,torrentgalaxy,magnetdl,horriblesubs,nyaasi,tokyotosho,anidex/stream/${search}`,
    )
    .then((res) => (typeof res === 'string' ? JSON.parse(res) : res));

  ctx.progress(50);

  const categories = categorizeStreams(response.streams);
  const embeds: { embedId: string; url: string }[] = [];

  const qualityResults = await Promise.all(
    Object.entries(categories).map(async ([category, streams]) => {
      const [topStream] = getTopStreamsBySeeders(streams, 1);
      if (!topStream) return null;

      try {
        const magnet = getMagnetUrl(topStream.infoHash, topStream.name);
        const apiUrl = constructProxyUrl(magnet);

        const apiResponse = await ctx.fetcher(apiUrl);
        const responseData = typeof apiResponse === 'string' ? JSON.parse(apiResponse) : apiResponse;
        if (!responseData?.m3u8Link) throw new Error('No m3u8 link in response');

        return {
          quality: category,
          url: responseData.m3u8Link,
        };
      } catch (error) {
        console.error(`Failed to fetch ${category}:`, error);
        return null;
      }
    }),
  );

  qualityResults.forEach((result) => {
    if (result?.url) {
      embeds.push({
        embedId: `webtor-${result.quality.replace('p', '')}`,
        url: result.url,
      });
    }
  });
  ctx.progress(90);

  return { embeds };
}

export const webtorScraper = makeSourcerer({
  id: 'webtor',
  name: 'Webtor 🦥',
  rank: 2,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

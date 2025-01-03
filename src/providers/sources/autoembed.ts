import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://autoembed.cc/';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const playerPage = await ctx.proxiedFetcher(`/embed/player.php`, {
    baseUrl,
    query: {
      id: ctx.media.tmdbId,
      ...(ctx.media.type === 'show' && {
        s: ctx.media.season.number.toString(),
        e: ctx.media.episode.number.toString(),
      }),
    },
  });

  const fileDataMatch = playerPage.match(/"file": (\[.*?\])/s);
  if (!fileDataMatch[1]) throw new NotFoundError('No data found');

  const fileData: { title: string; file: string }[] = JSON.parse(fileDataMatch[1].replace(/,\s*\]$/, ']'));

  const embeds: SourcererEmbed[] = [];

  for (const stream of fileData) {
    const url = stream.file;
    if (!url) continue;
    const lang = stream.title.toLowerCase().trim();
    // only return english
    if (lang.includes('english') && url) {
      embeds.push({ embedId: `autoembed-${lang}`, url });
    }
  }

  return {
    embeds,
  };
}

export const autoembedScraper = makeSourcerer({
  id: 'autoembed',
  name: 'Autoembed',
  rank: 100,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

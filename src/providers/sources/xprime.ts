import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://xprime.tv/foxtemp';

const languageMap: Record<string, string> = {
  'chinese - hong kong': 'zh',
  'chinese - traditional': 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  'english - sdh': 'en',
  finnish: 'fi',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hungarian: 'hu',
  italian: 'it',
  korean: 'ko',
  norwegian: 'no',
  polish: 'pl',
  portuguese: 'pt',
  'portuguese - brazilian': 'pt',
  romanian: 'ro',
  'spanish - european': 'es',
  'spanish - latin american': 'es',
  swedish: 'sv',
  turkish: 'tr',
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const params = new URLSearchParams({
    name: ctx.media.title,
    pstream: 'true',
  });

  if (ctx.media.type === 'show') {
    params.append('season', ctx.media.season.number.toString());
    params.append('episode', ctx.media.episode.number.toString());
  }

  const apiRes = await ctx.fetcher(`${baseUrl}?${params.toString()}`);
  if (!apiRes) throw new NotFoundError('No response received');
  const data = await JSON.parse(apiRes);
  if (!data.url) throw new NotFoundError('No stream URL found in response');

  const captions =
    data.subtitles?.map((sub: { file: string; label: string }) => ({
      type: 'vtt',
      url: sub.file,
      language: languageMap[sub.label.toLowerCase()] || 'unknown',
    })) || [];

  ctx.progress(90);

  return {
    stream: [
      {
        type: 'hls',
        id: 'primary',
        playlist: `https://oca.kendrickl-3amar.site/?v=${encodeURIComponent(data.url)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://megacloud.store/', origin: 'https://megacloud.store' }))}`,
        flags: [flags.CORS_ALLOWED],
        captions,
      },
    ],
    embeds: [],
  };
}

export const xprimeScraper = makeSourcerer({
  id: 'xprimetv',
  name: 'xprime.tv',
  rank: 240,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});

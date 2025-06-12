/* eslint-disable no-console */
import { ScrapeMedia } from '@/entrypoint/utils/media';
import { Caption, labelToLanguageCode, removeDuplicatedLanguages } from '@/providers/captions';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

import { addWyzieCaptions } from './wyziesubs';

type CaptionOptions = (ProviderRunnerOptions | IndividualEmbedRunnerOptions) & {
  media?: ScrapeMedia;
};

const timeout = (ms: number, source: string) =>
  new Promise<null>((resolve) => {
    setTimeout(() => {
      console.error(`${source} captions request timed out after ${ms}ms`);
      resolve(null);
    }, ms);
  });

export async function addOpenSubtitlesCaptions(
  captions: Caption[],
  ops: CaptionOptions,
  media: string,
): Promise<Caption[]> {
  try {
    const [imdbId, season, episode] = atob(media)
      .split('.')
      .map((x, i) => (i === 0 ? x : Number(x) || null));
    if (!imdbId) return captions;

    // Try Wyzie subs first. 2 second timeout
    try {
      const wyziePromise = addWyzieCaptions(
        [],
        ops.media?.tmdbId?.toString() || '',
        imdbId.toString(),
        typeof season === 'number' ? season : undefined,
        typeof episode === 'number' ? episode : undefined,
      );

      const wyzieCaptions = await Promise.race([wyziePromise, timeout(2000, 'Wyzie')]);

      // If we found Wyzie subs, return them as OpenSubtitles captions
      if (wyzieCaptions && wyzieCaptions.length > 0) {
        return [
          ...captions,
          ...wyzieCaptions.map((caption) => ({
            ...caption,
            opensubtitles: true,
          })),
        ];
      }
    } catch (error) {
      // Wyzie failed for a reason other than timeout
      console.error('Wyzie subtitles fetch failed:', error);
    }

    // Fall back to OpenSubtitles with a 5 second timeout
    try {
      const openSubsPromise = ops.proxiedFetcher(
        `https://rest.opensubtitles.org/search/${
          season && episode ? `episode-${episode}/` : ''
        }imdbid-${(imdbId as string).slice(2)}${season && episode ? `/season-${season}` : ''}`,
        {
          headers: {
            'X-User-Agent': 'VLSub 0.10.2',
          },
        },
      );

      const Res: {
        LanguageName: string;
        SubDownloadLink: string;
        SubFormat: 'srt' | 'vtt';
      }[] = await Promise.race([openSubsPromise, timeout(5000, 'OpenSubtitles')]);

      if (!Res) return captions; // Timeout occurred

      const openSubtilesCaptions: Caption[] = [];
      for (const caption of Res) {
        const url = caption.SubDownloadLink.replace('.gz', '').replace('download/', 'download/subencoding-utf8/');
        const language = labelToLanguageCode(caption.LanguageName);
        if (!url || !language) continue;
        else
          openSubtilesCaptions.push({
            id: url,
            opensubtitles: true,
            url,
            type: caption.SubFormat || 'srt',
            hasCorsRestrictions: false,
            language,
          });
      }
      return [...captions, ...removeDuplicatedLanguages(openSubtilesCaptions)];
    } catch (error) {
      // OpenSubtitles failed for a reason other than timeout
      console.error('OpenSubtitles fetch failed:', error);
      return captions;
    }
  } catch (error) {
    console.error('Error in addOpenSubtitlesCaptions:', error);
    return captions;
  }
}

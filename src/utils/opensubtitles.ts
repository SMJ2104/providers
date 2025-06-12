import { ScrapeMedia } from '@/entrypoint/utils/media';
import { Caption, labelToLanguageCode, removeDuplicatedLanguages } from '@/providers/captions';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

import { addWyzieCaptions } from './wyziesubs';

type CaptionOptions = (ProviderRunnerOptions | IndividualEmbedRunnerOptions) & {
  media?: ScrapeMedia;
};

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

    // First try Wyzie subs
    const wyzieCaptions = await addWyzieCaptions(
      [],
      ops.media?.tmdbId?.toString() || '',
      imdbId.toString(),
      typeof season === 'number' ? season : undefined,
      typeof episode === 'number' ? episode : undefined,
    );

    // If we found Wyzie subs, return them as OpenSubtitles captions
    if (wyzieCaptions.length > 0) {
      return [
        ...captions,
        ...wyzieCaptions.map((caption) => ({
          ...caption,
          opensubtitles: true,
        })),
      ];
    }

    // Fall back to OpenSubtitles if no Wyzie subs found
    const Res: {
      LanguageName: string;
      SubDownloadLink: string;
      SubFormat: 'srt' | 'vtt';
    }[] = await ops.proxiedFetcher(
      `https://rest.opensubtitles.org/search/${
        season && episode ? `episode-${episode}/` : ''
      }imdbid-${(imdbId as string).slice(2)}${season && episode ? `/season-${season}` : ''}`,
      {
        headers: {
          'X-User-Agent': 'VLSub 0.10.2',
        },
      },
    );

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
  } catch {
    return captions;
  }
}

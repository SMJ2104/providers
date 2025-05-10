/* eslint-disable no-console */
import { type SubtitleData, searchSubtitles } from 'wyzie-lib';

import { Caption } from '@/providers/captions';

// function isSubdlUrl(url: string) {
//   return url.endsWith('.subdl');
// }

// export function filterSubtitles(list: Caption[]) {
//   const selected: Record<string, Caption> = {};

//   for (const sub of list) {
//     const existing = selected[sub.language];

//     if (!existing) {
//       selected[sub.language] = sub;
//       continue;
//     }

//     const existingIsSubdl = isSubdlUrl(existing.url);
//     const currentIsSubdl = isSubdlUrl(sub.url);

//     if (existingIsSubdl && !currentIsSubdl) {
//       selected[sub.language] = sub;
//     }
//   }

//   return Object.values(selected);
// }

export async function addWyzieCaptions(
  captions: Caption[],
  tmdbId: string | number,
  imdbId: string,
  season?: number,
  episode?: number,
): Promise<Caption[]> {
  try {
    const searchParams: any = {
      encoding: 'utf-8',
      source: ['subdl', 'opensubtitles'],
    };

    if (tmdbId && imdbId) {
      searchParams.imdb_id = imdbId;
    } else if (tmdbId && !imdbId) {
      searchParams.tmdb_id = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
    }

    if (season && episode) {
      searchParams.season = season;
      searchParams.episode = episode;
    }

    console.log('Searching Wyzie subtitles with params:', searchParams);
    const wyzieSubtitles: SubtitleData[] = await searchSubtitles(searchParams);
    console.log('Found Wyzie subtitles:', wyzieSubtitles);

    const wyzieCaptions: Caption[] = wyzieSubtitles.map((subtitle) => ({
      id: subtitle.id,
      url: subtitle.url,
      type: subtitle.format === 'srt' || subtitle.format === 'vtt' ? subtitle.format : 'srt',
      hasCorsRestrictions: false,
      language: subtitle.language,
    }));

    return [...captions, ...wyzieCaptions];
  } catch (error) {
    console.error('Error fetching Wyzie subtitles:', error);
    return captions;
  }
}

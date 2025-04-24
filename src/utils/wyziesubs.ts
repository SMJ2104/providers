/* eslint-disable no-console */
import { type SubtitleData, searchSubtitles } from 'wyzie-lib';

import { Caption } from '@/providers/captions';

export async function addWyzieCaptions(
  captions: Caption[],
  tmdbId: string | number,
  imdbId: string,
  season?: number,
  episode?: number,
): Promise<Caption[]> {
  try {
    const searchParams: any = {
      format: 'srt',
    };

    // Prefer TMDB ID if available, otherwise use IMDB ID
    if (tmdbId) {
      // Convert TMDB ID to number if it's a string
      searchParams.tmdb_id = typeof tmdbId === 'string' ? parseInt(tmdbId, 10) : tmdbId;
    } else if (imdbId) {
      // Remove 'tt' prefix from IMDB ID if present
      searchParams.imdb_id = imdbId.replace(/^tt/, '');
    }

    // Add season and episode if provided (for TV shows)
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
      type: subtitle.format as 'srt' | 'vtt',
      hasCorsRestrictions: false,
      language: subtitle.language,
    }));

    return [...captions, ...wyzieCaptions];
  } catch (error) {
    console.error('Error fetching Wyzie subtitles:', error);
    return captions;
  }
}

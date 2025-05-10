/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const providers = [
  {
    id: 'streamwish-latino',
    name: 'StreamWish (Latino)',
    rank: 170,
  },
  {
    id: 'streamwish-spanish',
    name: 'StreamWish (Castellano)',
    rank: 169,
  },
  {
    id: 'streamwish-english',
    name: 'StreamWish (English)',
    rank: 168,
  },
];

function embed(provider: { id: string; name: string; rank: number }) {
  return makeEmbed({
    id: provider.id,
    name: provider.name,
    rank: provider.rank,
    async scrape(ctx) {
      console.log('Starting scrape for StreamWish with URL:', ctx.url);

      const encodedUrl = encodeURIComponent(ctx.url);
      const apiUrl = `https://ws-m3u8.moonpic.qzz.io/m3u8/${encodedUrl}`;

      const response = await ctx.proxiedFetcher<{ m3u8: string }>(apiUrl, {
        headers: {
          Accept: 'application/json',
          // 'ngrok-skip-browser-warning': 'true', // this header bypass ngrok warning
        },
      });

      const videoUrl = response.m3u8;
      if (!videoUrl) throw new NotFoundError('No video URL found');

      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: videoUrl,
            flags: [],
            captions: [],
            headers: {
              Referer: 'https://streamwish.to/',
              Origin: 'https://streamwish.to',
            },
          },
        ],
      };
    },
  });
}

export const [streamwishLatinoScraper, streamwishSpanishScraper, streamwishEnglishScraper] = providers.map(embed);

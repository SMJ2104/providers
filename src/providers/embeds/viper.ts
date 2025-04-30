import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

export const viperScraper = makeEmbed({
  id: 'viper',
  name: 'Viper',
  rank: 182,
  async scrape(ctx) {
    const apiResponse = await ctx.proxiedFetcher.full<{
      source: string;
    }>(ctx.url, {
      headers: {
        Accept: 'application/json',
        Referer: 'https://embed.su/',
      },
    });

    if (!apiResponse.body.source) {
      throw new NotFoundError('No source found');
    }
    const playlistUrl = apiResponse.body.source.replace(/^.*\/viper\//, 'https://');

    // You need to set a proxy for flixhq CDN streams. Set up your own from this repo: https://github.com/Pasithea0/M3U8-Proxy
    const proxiedPlaylist = `https://proxy.fifthwit.net/m3u8-proxy?url=${encodeURIComponent(playlistUrl)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://megacloud.store/', origin: 'https://megacloud.store' }))}`;

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: proxiedPlaylist,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});

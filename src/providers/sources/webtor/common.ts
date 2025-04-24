import { Stream } from './types';

const trackers = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://explodie.org:6969/announce',
  'udp://tracker.qu.ax:6969/announce',
  'udp://tracker.ololosh.space:6969/announce',
  'udp://tracker.dump.cl:6969/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://tracker.bittor.pw:1337/announce',
  'udp://tracker-udp.gbitt.info:80/announce',
  'udp://opentracker.io:6969/announce',
  'udp://open.free-tracker.ga:6969/announce',
  'udp://ns-1.x-fins.com:6969/announce',
  'udp://leet-tracker.moe:1337/announce',
  'udp://isk.richardsw.club:6969/announce',
  'udp://discord.heihachi.pw:6969/announce',
  'http://www.torrentsnipe.info:2701/announce',
  'http://www.genesis-sp.org:2710/announce',
];

export function getMagnetUrl(infoHash: string, name: string): string {
  const encodedName = encodeURIComponent(name);
  const trackerParams = trackers.map((tracker) => `&tr=${encodeURIComponent(tracker)}`).join('');
  return `magnet:?xt=urn:btih:${infoHash}&dn=${encodedName}${trackerParams}`;
}

export function constructProxyUrl(magnetUrl: string): string {
  const encodedMagnet = encodeURIComponent(magnetUrl);
  return `https://savingshub.online/api/fetchHls?magnet=${encodedMagnet}`; // Thanks to Custom and DebateMyRoomba for this API
}

export function categorizeStreams(streams: Stream[]): Record<string, Stream[]> {
  const categories: Record<string, Stream[]> = {
    '4k': [],
    '1080p': [],
    '720p': [],
    '480p': [],
  };

  streams.forEach((stream) => {
    const name = stream.name.toLowerCase();
    if (name.includes('4k')) {
      categories['4k'].push(stream);
    } else if (name.includes('1080p')) {
      categories['1080p'].push(stream);
    } else if (name.includes('720p')) {
      categories['720p'].push(stream);
    } else if (name.includes('480p')) {
      categories['480p'].push(stream);
    }
  });

  return categories;
}

export function getTopStreamsBySeeders(categoryStreams: Stream[], limit: number): Stream[] {
  return categoryStreams
    .sort((a, b) => {
      const seedersA = parseInt(a.title.match(/👤 (\d+) /)?.[1] || '0', 10);
      const seedersB = parseInt(b.title.match(/👤 (\d+) /)?.[1] || '0', 10);
      return seedersB - seedersA;
    })
    .slice(0, limit);
}

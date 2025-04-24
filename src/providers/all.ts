import { Embed, Sourcerer } from '@/providers/base';
import { doodScraper } from '@/providers/embeds/dood';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import {
  riveAsiacloudScraper,
  riveEe3Scraper,
  riveFastxScraper,
  riveFilmechoScraper,
  riveG1Scraper,
  riveG2Scraper,
  riveGhostScraper,
  riveGuruScraper,
  riveHydraxScraper,
  riveKageScraper,
  riveNovaScraper,
  rivePutafilmeScraper,
} from '@/providers/embeds/rive';
import { turbovidScraper } from '@/providers/embeds/turbovid';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { autoembedScraper } from '@/providers/sources/autoembed';
import { catflixScraper } from '@/providers/sources/catflix';
import { ee3Scraper } from '@/providers/sources/ee3';
import { fsharetvScraper } from '@/providers/sources/fsharetv';
import { insertunitScraper } from '@/providers/sources/insertunit';
import { mp4hydraScraper } from '@/providers/sources/mp4hydra';
import { riveScraper } from '@/providers/sources/rive';
import { tugaflixScraper } from '@/providers/sources/tugaflix';
import { vidsrcsuScraper } from '@/providers/sources/vidsrcsu';

import {
  autoembedBengaliScraper,
  autoembedEnglishScraper,
  autoembedHindiScraper,
  autoembedTamilScraper,
  autoembedTeluguScraper,
} from './embeds/autoembed';
import { closeLoadScraper } from './embeds/closeload';
import { FedAPIPrivateScraper, FedDBScraper } from './embeds/fedapi';
import { mp4hydraServer1Scraper, mp4hydraServer2Scraper } from './embeds/mp4hydra';
import { ridooScraper } from './embeds/ridoo';
import { streamtapeScraper } from './embeds/streamtape';
import { streamvidScraper } from './embeds/streamvid';
import { vidCloudScraper } from './embeds/vidcloud';
import {
  VidsrcsuServer10Scraper,
  VidsrcsuServer11Scraper,
  VidsrcsuServer12Scraper,
  VidsrcsuServer1Scraper,
  VidsrcsuServer20Scraper,
  VidsrcsuServer2Scraper,
  VidsrcsuServer3Scraper,
  VidsrcsuServer4Scraper,
  VidsrcsuServer5Scraper,
  VidsrcsuServer6Scraper,
  VidsrcsuServer7Scraper,
  VidsrcsuServer8Scraper,
  VidsrcsuServer9Scraper,
} from './embeds/vidsrcsu';
import { viperScraper } from './embeds/viper';
import { warezcdnembedHlsScraper } from './embeds/warezcdn/hls';
import { warezcdnembedMp4Scraper } from './embeds/warezcdn/mp4';
import { warezPlayerScraper } from './embeds/warezcdn/warezplayer';
import { webtor1080Scraper, webtor480Scraper, webtor4kScraper, webtor720Scraper } from './embeds/webtor';
import { EightStreamScraper } from './sources/8stream';
import { coitusScraper } from './sources/coitus';
import { embedsuScraper } from './sources/embedsu';
import { FedAPIScraper } from './sources/fedapi';
import { hdRezkaScraper } from './sources/hdrezka';
import { iosmirrorScraper } from './sources/iosmirror';
import { iosmirrorPVScraper } from './sources/iosmirrorpv';
import { nunflixScraper } from './sources/nunflix';
import { ridooMoviesScraper } from './sources/ridomovies';
import { slidemoviesScraper } from './sources/slidemovies';
import { soaperTvScraper } from './sources/soapertv';
import { streamboxScraper } from './sources/streambox';
import { uiraliveScraper } from './sources/uiralive';
import { vidapiClickScraper } from './sources/vidapiclick';
import { warezcdnScraper } from './sources/warezcdn';
import { webtorScraper } from './sources/webtor';
import { xprimeScraper } from './sources/xprime';

export function gatherAllSources(): Array<Sourcerer> {
  // all sources are gathered here
  return [
    catflixScraper,
    ridooMoviesScraper,
    hdRezkaScraper,
    warezcdnScraper,
    insertunitScraper,
    soaperTvScraper,
    autoembedScraper,
    tugaflixScraper,
    ee3Scraper,
    fsharetvScraper,
    vidsrcsuScraper,
    mp4hydraScraper,
    webtorScraper,
    embedsuScraper,
    FedAPIScraper,
    slidemoviesScraper,
    iosmirrorScraper,
    iosmirrorPVScraper,
    uiraliveScraper,
    vidapiClickScraper,
    coitusScraper,
    streamboxScraper,
    nunflixScraper,
    riveScraper,
    EightStreamScraper,
    xprimeScraper,
  ];
}

export function gatherAllEmbeds(): Array<Embed> {
  // all embeds are gathered here
  return [
    upcloudScraper,
    vidCloudScraper,
    mixdropScraper,
    ridooScraper,
    closeLoadScraper,
    doodScraper,
    streamvidScraper,
    streamtapeScraper,
    warezcdnembedHlsScraper,
    warezcdnembedMp4Scraper,
    warezPlayerScraper,
    autoembedEnglishScraper,
    autoembedHindiScraper,
    autoembedBengaliScraper,
    autoembedTamilScraper,
    autoembedTeluguScraper,
    turbovidScraper,
    mp4hydraServer1Scraper,
    mp4hydraServer2Scraper,
    VidsrcsuServer1Scraper,
    VidsrcsuServer2Scraper,
    VidsrcsuServer3Scraper,
    VidsrcsuServer4Scraper,
    VidsrcsuServer5Scraper,
    VidsrcsuServer6Scraper,
    VidsrcsuServer7Scraper,
    VidsrcsuServer8Scraper,
    VidsrcsuServer9Scraper,
    VidsrcsuServer10Scraper,
    VidsrcsuServer11Scraper,
    VidsrcsuServer12Scraper,
    VidsrcsuServer20Scraper,
    webtor4kScraper,
    webtor1080Scraper,
    webtor720Scraper,
    webtor480Scraper,
    viperScraper,
    FedAPIPrivateScraper,
    FedDBScraper,
    riveAsiacloudScraper,
    riveEe3Scraper,
    riveFastxScraper,
    riveFilmechoScraper,
    riveG1Scraper,
    riveG2Scraper,
    riveGhostScraper,
    riveGuruScraper,
    riveHydraxScraper,
    riveKageScraper,
    riveNovaScraper,
    rivePutafilmeScraper,
  ];
}

export interface Stream {
  name: string;
  title: string;
  infoHash: string;
  fileIdx: number;
  behaviorHints: {
    bingeGroup: string;
    filename: string;
  };
}

export interface Response {
  streams: Stream[];
  cacheMaxAge: number;
  staleRevalidate: number;
  staleError: number;
}

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  showDuration: boolean;
  date: string;
  imgUrl?: string;
  isLive: boolean;
  liveText?: string;
  sourceUrl?: string;
  videoUrl?: string;
  repostsCount?: number;
  isReposted?: boolean;
}

export interface VideoFeed {
  trending: VideoItem[];
  live: VideoItem[];
}

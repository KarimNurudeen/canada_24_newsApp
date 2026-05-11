import type { Article } from '../context/AppContext';
import type { VideoItem } from '../types/video';

export type RootStackParamList = {
  Launch: undefined;
  AuthEmail: undefined;
  AuthOTP: { email: string };
  Splash: undefined;
  RegionSelection: undefined;
  AlertSetup: undefined;
  Main: undefined;
  ManageRegions: undefined;
  Settings: undefined;
  ArticleDetail: { article: Article };
  VideoPlayer: { item: VideoItem };
  Search: undefined;
  SectionDetail: { section: string };
  CreatePost: undefined;
};

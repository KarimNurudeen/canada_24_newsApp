/** Standalone PNG icons (Phosphor duotone, rendered in the accent colour at 1x/2x/3x). */
export const ICONS = {
  lightning: require('../../assets/icons/lightning.png'),
  star: require('../../assets/icons/star.png'),
  mapPin: require('../../assets/icons/map-pin.png'),
  chartLineUp: require('../../assets/icons/chart-line-up.png'),
  heartbeat: require('../../assets/icons/heartbeat.png'),
  filmSlate: require('../../assets/icons/film-slate.png'),
  bank: require('../../assets/icons/bank.png'),
  soccerBall: require('../../assets/icons/soccer-ball.png'),
  cpu: require('../../assets/icons/cpu.png'),
  globe: require('../../assets/icons/globe-hemisphere-west.png'),
  bookmark: require('../../assets/icons/bookmark-simple.png'),
  bell: require('../../assets/icons/bell.png'),
  signIn: require('../../assets/icons/sign-in.png'),
  signOut: require('../../assets/icons/sign-out.png'),
  info: require('../../assets/icons/info.png'),
  chat: require('../../assets/icons/chat-circle-text.png'),
  shield: require('../../assets/icons/shield-check.png'),
  document: require('../../assets/icons/file-text.png'),
  user: require('../../assets/icons/user-circle.png'),
} as const;

/** Alert label → icon, for the notification sheet. */
export const ALERT_ICONS: Record<string, (typeof ICONS)[keyof typeof ICONS]> = {
  'Breaking News': ICONS.lightning,
  'Top Stories': ICONS.star,
  'Local News': ICONS.mapPin,
  Business: ICONS.chartLineUp,
  Health: ICONS.heartbeat,
  Entertainment: ICONS.filmSlate,
  Politics: ICONS.bank,
  Sports: ICONS.soccerBall,
  Technology: ICONS.cpu,
  World: ICONS.globe,
};

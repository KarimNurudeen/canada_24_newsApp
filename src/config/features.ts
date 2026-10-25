// Temporary feature switches for parked functionality.
export const ENABLE_MANAGE_REGIONS = false; // parked: /regions/me/ answers 404 on the VPS — see docs/BACKEND_DEPENDENCIES.md
// Parked, matching the web app (which also has posting off): reader-submitted stories, the "+" tab,
// the Posts tab/count on Profile and the Community filter on Home.
export const ENABLE_USER_POST_CREATION = false;

// ── Parked until the matching backend change is live on the VPS ─────────────
// See docs/BACKEND_DEPENDENCIES.md for what each one needs and how to turn it on.

/** Comment author pictures/profile links, the "Liked by" row and public profiles.
 *  Needs: GET /auth/users/<id>/, GET /interactions/articles/<id>/likers/, and
 *  author_id + author_avatar on comments. */
export const ENABLE_SOCIAL_PROFILES = false;

/** Live "new story" push over WebSocket. Needs the VPS proxy to forward
 *  wss://<host>/ws/news/ (it currently answers 404). */
export const ENABLE_LIVE_NEWS_SOCKET = false;

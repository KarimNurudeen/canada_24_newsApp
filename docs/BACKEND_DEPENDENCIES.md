# Mobile features parked until the VPS backend catches up

Last verified against `https://ca.niveel.com` on 2026-10-25 with plain `curl`.
Everything below is switched off with a flag in `src/config/features.ts`; the
code is still in place, so turning a feature on is a one-line change once its
backend piece is live.

## 1. Parked features (flags are `false`)

| Flag | What it controls | What the VPS must provide | Verified |
|---|---|---|---|
| `ENABLE_SOCIAL_PROFILES` | Comment author pictures, tapping a commenter to open their profile, the "Liked by" row + likers sheet, the Public Profile screen | `GET /auth/users/<id>/`, `GET /interactions/articles/<id>/likers/`, and `author_id` + `author_avatar` on each comment | both endpoints return **404** today |
| `ENABLE_LIVE_NEWS_SOCKET` | "New story" live updates + in-app notification while the app is open | The proxy must forward WebSocket upgrades on `/ws/` to the ASGI app | `wss://ca.niveel.com/ws/news/` returns **404** |
| `ENABLE_MANAGE_REGIONS` | "My regions" in Settings, ⭐ on Explore locations, saving regions to the account | Server env `ENABLE_MANAGE_REGIONS=true` (route `/regions/me/` only exists when set) | `/regions/me/` returns **404** |

### Backend code already written (web repo, not committed/deployed)
In `Canada24_web/backend`:

- `apps/interactions/serializers.py` — comments gain `author_id`, `author_avatar`; new `LikerSerializer`.
- `apps/interactions/views.py` + `urls.py` — `ArticleLikersView` → `GET /interactions/articles/<id>/likers/` (`{count, results:[{id, display_name, avatar}]}`, newest first, max 30).
- `apps/accounts/views.py` + `urls.py` — `PublicProfileView` → `GET /auth/users/<id>/` (no email; includes counts and the 10 latest comments).
- `apps/interactions/tests.py` — three tests covering the above (`manage.py test apps.interactions.tests apps.accounts.tests` passes).
- No migrations, no new tables.

### Deploy checklist (VPS)
1. Pull the backend code and restart the app server (gunicorn/daphne + workers).
2. Verify:
   ```bash
   curl -i https://ca.niveel.com/api/v1/auth/users/1/                    # 200, no "email" key
   curl -i https://ca.niveel.com/api/v1/interactions/articles/1/likers/  # 200
   curl -s https://ca.niveel.com/api/v1/interactions/articles/1/comments/ | grep author_avatar
   ```
3. Set `ENABLE_SOCIAL_PROFILES = true`, rebuild/update the app.

### WebSocket proxy (nginx example)
```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8000;   # the ASGI server (daphne/uvicorn), not gunicorn-sync
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 3600s;
}
```
Verify with the handshake request (expect `101`, not `404`):
```bash
curl -i -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" https://ca.niveel.com/ws/news/
```
Then set `ENABLE_LIVE_NEWS_SOCKET = true`. The web app's socket helper is unused, so only the mobile app depends on this.

### Regions
Set `ENABLE_MANAGE_REGIONS=true` in the server environment, confirm `/api/v1/regions/me/` returns `401` (not `404`) without a token, then set the mobile flag `true`.

### Also parked (not backend-dependent)
| Flag | Why |
|---|---|
| `ENABLE_USER_POST_CREATION = false` | Matches the web app, where posting is off. Hides the "+" tab, "Post news" on Profile, the Posts tab/count and the Community filter on Home. The code and the `/news/posts/` API are untouched. |

## 2. Not built yet (needs backend work first)
- **Likes, dislikes and comments on videos.** The API only supports reposting videos (`/interactions/videos/<id>/repost/`). Needs new models (video reaction, video comment), migrations and endpoints — then the Watch tab's right-hand rail can mirror the article page.
- **Likes on comments** (TikTok-style hearts on each comment) and **replies** — new `CommentLike` model / `parent` field.
- **A real sub-topic field.** Topic dropdowns filter by keyword on the client. A `topic` tag/filter would be accurate and pagination-safe.
- **A Settlement section.** It doesn't exist server-side, so Settlement is assembled from searches for "settlement", "newcomers" and "settling in canada". (Housing *does* exist on the VPS — `HOUSING` — it is just missing from the repo's `constants.py`, another sign the repo is behind the server.)

## 3. Production is ahead of the backend repo
The VPS serves things the repository's `backend/` does not contain, so the repo should be synced from the server before further backend work:

| Seen on the VPS | In the repo? |
|---|---|
| `GET /news/breaking/` (200) | no |
| `GET /news/immigration-stats/` (200) | no |
| `GET /notifications/web-push/vapid-public-key/` (200) | no |
| Article fields `is_breaking`, `read_time_minutes`, `related_coverage`, `related_coverage_status`, `audio_url`, `audio_status` | no |

The web app and, as of 2026-10-25, the mobile app both use these: breaking bar (`/news/breaking/`), Immigration by Province map (`/news/immigration-stats/`), related-coverage cards, read time and server-generated listen audio (`audio_url`). Web push (`/notifications/web-push/*`) stays browser-only.

## 4. Things that work today but are approximations
- Settlement and topic filtering (above).
- Release builds always use `https://ca.niveel.com/api/v1` (set in `eas.json` per profile, and as the non-dev fallback in `src/services/api.ts`).
- Across Canada region tabs are built from `/regions/` + `/news/articles/?regions__slug=<slug>`; a region tab appears only when it has stories.

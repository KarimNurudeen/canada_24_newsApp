# Play Store release: progress and reference

Last updated: 2026-10-29

## Current status

| Item | Value |
|---|---|
| App | Canada247 (`com.canada247.app`) |
| Release | 2.0.0, versionCode 3 |
| Track | Production, full rollout |
| State | In Google review (submitted 2026-10-29) |
| Previous live release | 1.0.0, versionCode 1 (published 2026-08-14) |
| EAS build | `3983ade0-524e-445e-9ba0-49064b1f2de4` |
| EAS submission | `4a45be6a-a42d-4cb0-af94-2f7ac3edab5a` |
| Managed publishing | Off, so the release goes live automatically once approved |

Track progress in Play Console: Test and release, then Publishing overview, then Submission activity.
To pull the release back before approval, use "Remove changes" on the Changes in review panel.

## Signing keys

- **Upload key** (the key EAS signs the AAB with, stored remotely in EAS):
  SHA-256 `6A:DD:C0:5A:73:80:C3:AF:D6:F2:BD:A7:69:FA:CD:AC:09:7B:D3:AA:BB:B8:45:96:8D:69:30:E8:0E:C9:7E:74`
  (CN=Canada247, valid until 2053). Verified to match Play Console before the build,
  and again on the built AAB with `keytool -printcert -jarfile app.aab`.
- **App signing key** (held by Google, what users receive):
  SHA-256 `49:26:2B:79:EA:18:4C:1C:A5:CB:AF:BF:E9:F3:A4:11:52:B2:AA:28:C1:FC:04:80:5B:C7:34:22:B8:1F:BD:FB`.
- In the current Play Console, App signing lives at
  `https://play.google.com/console/u/0/developers/8316114926775017780/app/4973393862686221553/keymanagement`.
  It is not under App integrity any more. The "Download certificates" button gives the app
  signing certs, so read the upload key fingerprint from the Upload key section instead.

## Automated submit setup (done)

1. Google Cloud project `canada247-play`, with the Google Play Android Developer API enabled.
2. Service account `eas-submit@canada247-play.iam.gserviceaccount.com`.
3. JSON key saved as `play-service-account.json` in the repo root. It is gitignored
   (`.gitignore` line 54). Never commit it or paste its contents anywhere.
4. The service account was invited in Play Console (Users and permissions), for Canada247
   only, with: View app information, Release apps to testing tracks, and
   Release to production.
5. The Google Cloud organization `kadoma47-org` enforces
   `iam.disableServiceAccountKeyCreation`. It was overridden to Not enforced on the
   `canada247-play` project only, to create the key. Re-enforce it afterwards by setting
   the policy to "Inherit parent's policy" at
   `https://console.cloud.google.com/iam-admin/orgpolicies/iam-disableServiceAccountKeyCreation/edit?project=canada247-play`.
   (Status: pending, see to-do below.)

## Over-the-air fix: blank tabs (2026-10-30)

- **Symptom:** in the released 2.0.0 app, every tab except Home showed a blank white screen.
- **Cause:** `ConcaveTabBar` combined a JS-driven `translateX` with a native-driven `scale` in
  one transform. React Native threw "JS driven animation on animated node ... moved to native",
  which took down the navigator. Fixed in `d84be37` by nesting the scale on its own view.
- **Shipped as an OTA update** (JS only, no Play review): branch `production`, runtime `2.0.0`,
  update group `6e038776-4bf0-448d-844e-cb998d262eb1`. Users get it on the second app launch
  after it downloads. Still to confirm on a device.
- **Publish an OTA update** (always pass the API URL: without it the bundle falls back to localhost):
  `EXPO_PUBLIC_API_BASE_URL=https://ca.niveel.com/api/v1 npx eas-cli update --channel production --platform android --message "<what changed>"`
  OTA only works for JavaScript changes and only for the same `version` (runtime 2.0.0).
  Native changes (new packages, app.json, permissions) need a new store build.
- `develop` and `master` were fast-forwarded to the same commit after the update.

## How to release the next version

1. Bump `version` and `android.versionCode` in `app.json`. versionCode must be higher than
   the last uploaded one (currently 3).
2. Commit the change.
3. Build the bundle: `npx eas-cli build -p android --profile production`.
4. Verify the signature on the downloaded `.aab`: `keytool -printcert -jarfile app.aab`.
   The SHA-256 must match the upload key above.
5. Submit: `npx eas-cli submit -p android --profile production --latest`.
   The `production` submit profile in `eas.json` targets the `production` track with
   release status `completed`. For a safer test first, switch it to track `internal` and
   release status `draft`, then promote in Play Console.

If submit fails with a permission error right after inviting the service account, wait up
to an hour for the invite to activate and retry.

## To do

- [ ] Re-enforce the Cloud organization policy on `canada247-play` (see above).
- [ ] Confirm the tab fix on a device after the OTA update arrives (open the app twice, then switch tabs).
- [ ] Decide whether `ENABLE_MANAGE_REGIONS` should match the backend (see
      `BACKEND_DEPENDENCIES.md`).
- [ ] iOS release needs an Apple developer account.

## Useful links

- Play Console app: `https://play.google.com/console/u/0/developers/8316114926775017780/app/4973393862686221553`
- Users and permissions: `https://play.google.com/console/u/0/developers/8316114926775017780/users-and-permissions`
- EAS project: `https://expo.dev/accounts/litcodes-team/projects/canada247`

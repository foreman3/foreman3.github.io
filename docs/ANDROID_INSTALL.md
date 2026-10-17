# Install VibeCade on Android

1. Open the published HTTPS arcade website in Chrome on your Android phone.
2. Tap **Install VibeCade** on the arcade menu and accept Chrome's install prompt.
3. If Chrome hasn't offered the prompt yet, open its **⋮** menu and choose **Add to home screen → Install** (some browsers label this **Install app**).
4. Launch **VibeCade** from its home screen or app drawer icon.

The installed app requests fullscreen at launch, including when navigating to games under the arcade's URL scope. Opening a regular browser tab still uses the existing gesture-based fullscreen behavior. Android may temporarily reveal system controls when you swipe from an edge. Browser support determines whether fullscreen is honored; the manifest's standard fallback is standalone mode.

On the first visit, keep the arcade open until it reports **games ready offline**. It saves all games hosted in this repository, shared controls, artwork, and the Block Balance physics library. They can then load and play without internet, even if you have never opened a particular game. Audio Assault is hosted on a separate website and still needs internet. Optional Google Fonts fall back to system fonts offline.

The browser can reclaim website storage under storage pressure, and clearing site data removes downloads. Reopening online downloads missing releases again. Installation itself needs internet.

## Implementation and verification

- `manifest.webmanifest` uses a stable ID, start URL, and scope relative to the deployment directory. It supports both root hosting and subdirectory hosting.
- `pwa.js` connects the manifest and service worker, shows download progress and retry state, handles the optional browser install prompt, and provides manual install instructions. The arcade loads it directly; game pages load it through the shared mobile helper.
- `mobile-fullscreen.js` recognizes manifest fullscreen separately from the Fullscreen API, avoiding a redundant fullscreen request in the installed app. Instructions still gate gameplay.
- The app includes 192px and 512px PNG icons plus a maskable Android icon, generated from `images/app/icon.svg`. The cabinet fits within the maskable safe zone.
- Serve over HTTPS in production. Localhost can be used for development. See [Chrome's manifest installation requirements](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest).
- Validate installation and launch on a physical Android phone after deployment; desktop browser emulation cannot verify Android system bars or WebAPK installation.

## Updating offline releases

After changing any game or shared runtime file, run `node scripts/build-offline.cjs`. Commit the generated `offline-assets.js` with the changes. Use `node scripts/build-offline.cjs --check` to detect a stale inventory. The inventory derives games from `Games.md`, includes their runtime assets, and hashes their contents into a release version.

The worker saves a complete version in a separate cache. Failed updates leave the previous version active. Downloaded updates activate after all old VibeCade windows close, keeping an active game on one consistent release. Reopen online periodically to get updates. No forced reload interrupts play.

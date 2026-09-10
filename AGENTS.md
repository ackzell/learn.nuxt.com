# Agent Instructions for amoxtli-vue-2

## Project overview

Nuxt 4 app for learning Vue. Runs interactive code playgrounds via almostnode (local WebContainer fork at `../oss/almostnode`).

## Key architecture

- WebContainer boots in `stores/playground.ts`, mounts files, runs Vite dev server inside the container
- Preview rendered in iframe via `PanelPreviewClient.client.vue`
- Service worker (`public/__sw__.js`) proxies HTTP from iframe to container virtual servers
- Communication via birpc over postMessage (color mode, console, RPC)
- Templates in `templates/` define base project files (vue, html, vue-sass)

## Debugging container issues

Set `window.__almostnodeDebug = true` in browser console before mount.
See `docs/preview-system.md` -> "Debugging the Container" section for full probe list.

For the challenge validation flow, set `window.__challengeDebug = true` in the browser
console to enable the `[challenge-debug]` logs. See `docs/preview-system.md` ->
"Debugging the challenge flow".

## Commands

- `pnpm dev` -- start dev server
- `npm run lint` -- eslint
- `npm run typecheck` -- nuxt typecheck (has pre-existing errors in shiki/vite types, ignore those)

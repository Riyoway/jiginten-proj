# AGENTS.md

This file is the single source of project instructions for every coding agent working in this
repository (Claude Code reads it through `CLAUDE.md`, Codex reads it directly). Edit only this file.

## Project

Streamly — a frontend for a live-streaming service (HLS playback, realtime chat, gifts, danmaku).
The backend is fixed and cannot be changed; see "Fixed backend API" below before proposing any new
API shape.

## Commands

```powershell
pnpm install
pnpm dev            # dev server (port 5173)
pnpm build          # tsc -b + vite build (typecheck errors fail the build)
pnpm preview         # preview production build (port 4173)
pnpm typecheck       # tsc -b only
pnpm lint            # biome check . — 0 findings is the normal state; a red run means your diff
pnpm lint:fix        # biome check --write .
pnpm test            # vitest run (unit + component)
pnpm test:watch      # vitest watch mode
pnpm test:e2e        # playwright (builds + previews first, see webServer in playwright.config.ts)
```

Single test file: `pnpm vitest run tests/unit/messages.test.ts` (or any path). Single Playwright spec:
`pnpm playwright test tests/e2e/home.spec.ts`.

All four endpoint variables (`VITE_CHANNELS_URL`, `VITE_COMMENTS_URL`, `VITE_MESSAGES_URL`,
`VITE_GIFTS_URL`) are required in `.env` or the hosting environment. Missing,
blank, relative, or non-HTTP(S) values fail before the dev server/build starts.

## Development workflow

- **Code changes** use the Ponytail approach: check the existing architecture/components/utilities
  before writing anything new, reuse them, keep diffs minimal, don't add abstractions or dependencies
  for speculative future needs, and don't swap an existing stack piece for another library without a
  clear technical reason.
- **Browser verification** with a browser-automation tool (Claude in Chrome / Codex in Chrome) is
  required after any change to UI, layout, responsive behavior, navigation, forms,
  Modal/Popover/Dropdown/Tooltip, animation, or loading/empty/error states —
  don't assume it works from reading the code alone. Check: the feature behaves as expected; no layout
  breakage or overflow; click/input/keyboard interaction works; Modal/Popover positioning is correct;
  loading/empty/error states render appropriately; no new console errors; check both a desktop-width and
  a mobile-width viewport. Fix and re-verify in the browser if anything is off.
- **Tests**: add or update tests for any meaningful behavior change, favoring user-visible behavior over
  internals. Priority order: business logic → user interactions → state transitions → error handling →
  edge cases → regression coverage for bug fixes → impact on existing features. Don't add tests purely to
  inflate coverage.
- **Definition of done**: a task isn't finished until `pnpm test`, `pnpm typecheck`, `pnpm lint`, and
  `pnpm build` all pass, and — for anything covered by the browser-verification bullet above — the change
  has actually been checked in Chrome on both viewport sizes with no new console errors. A clean compile
  is not "done".

## Fixed backend API — read before touching `src/lib/api` or adding endpoints

The backend cannot be extended beyond what's documented in `Docs/API-INTEGRATION.md` and
`Docs/HLS-SERVER.md` (see `Docs/reference/legacy.main.js` for the pre-multi-channel reference
implementation):

```
GET  /channels.json          -> HLS channel catalog (id/title/category/playlist/default) — source of truth
GET  /stream.m3u8            -> backend compatibility endpoint; the frontend does not use it
GET  /ch/<id>/stream.m3u8    -> per-channel HLS playlist
GET  /ch/<id>/segments/{n}.ts
GET  /events                 -> SSE comments
POST /messages                -> comment / gift / gift+message
GET  /items                   -> gift catalog
```

Do not invent additional endpoints or fields. There is no user id, username, avatar, auth, channel
profile, follow state, viewer count, or ranking API. Consequences enforced throughout the codebase:

- Never hardcode the channel list — always go through `fetchChannels()` (`src/lib/api/channels.ts`) via
  the `useChannels()` store hook (`src/store/channels.ts`). Selected channel lives in the URL
  (`/watch?channel=<id>`, `src/app/router.tsx`'s `validateSearch`), not in the store — resolve it with
  `resolveSelectedChannel(channels, requestedId)` (URL id → `default: true` → `channels[0]`).
- `/events`, `/messages`, `/items` have no `channelId`. Chat and gifts stay a single feed shared across
  every channel — never fake a per-channel chat split on the frontend alone.
- Chat avatars are a random pick from `public/avatars/*.png` per message (`src/lib/avatars.ts`), display
  name is always `Guest`. Never derive identity from `payload.id` or message text.
- A single channel can only air one live at a time, so N simultaneous entries in `/channels.json` means N
  distinct channels (currently 3) — not "one Streamly channel with several lives". `channel.title` is
  that channel's current content/video title, not the channel's own identity — there's no
  channel-owner/account API giving a real channel name. Fine to show `channel.title` as-is where it's
  clearly content (`StreamCard`, the watch page `<h1>`, `AppShell`'s sidebar heading "おすすめチャンネル").
  Where a channel's *identity* is shown paired with an avatar (sidebar channel rows, the watch page's
  channel-identity row under the `<h1>`), use `getStreamlyUserName(id, channelIds)`
  (`src/lib/streamlyUsers.ts`) instead — same reasoning as chat's `Guest`, don't let a content title pose
  as an identity. It takes **the full channel id list** and numbers the sorted ids, so no two channels
  ever share a label: the old version picked from a fixed pool of 10 by hashing the id, which produced
  duplicate names once `/channels.json` grew past 10 entries (it is at 13). Every call site must pass the
  same full list (all three already have `channels` from `useChannels()`) or the same channel would get
  different names on different screens.
- The sidebar's "おすすめチャンネル" shows a **random 5** of the live channels (`pickRandom`,
  `src/lib/pickRandom.ts`, memoized on `channels` so it settles once per load). Listing all 13 overflowed
  the sidebar; the list also shrinks and scrolls internally on short viewports so the nav, install button
  and profile card stay reachable. Don't reintroduce a full listing here — Home's grid is the complete one.
- There's no in-page channel switcher on the watch page (the earlier `ChannelSelector` tabs were removed
  per explicit request) — switching channels happens by navigating to `/watch?channel=<id>` from the Home
  grid or the sidebar, not from a control inside `WatchPage` itself. Don't re-add one without being asked.
- Follow, Favorite and watch history are real, working local state — `src/store/follows.ts` /
  `favorites.ts` (`createIdSetStore` — Zustand + `persist`) and `history.ts` (same Zustand + `persist`
  pattern, but an ordered newest-first list capped at 30, recorded by `WatchPage` on mount). All three
  are localStorage only: genuinely interactive, unlike the `ComingSoonPanel` sections, but with no
  server sync — don't wire them to any API, and the follow/favorite buttons carry a `title` hint saying
  so. All three have real listing surfaces: Home's "フォロー中のライブ" panel
  (`src/features/home/FollowedChannelsPanel.tsx`) plus the `/favorites`, `/follows` and `/history` pages,
  which are one shared component with different copy (`src/features/collections/CollectionPages.tsx`) —
  add a fourth "saved ids ∩ live" surface there rather than copying the page. Each renders the real
  intersection of stored ids and currently-live channels, with distinct empty states for "nothing saved
  yet" vs "saved channels are offline". Offline entries are reported as a **count only** — never invent a
  name for an id that `/channels.json` no longer lists. Only the sidebar's "人気" item stays disabled
  (no ranking API).
- Home categories use each channel's `category` from `/channels.json`; counts are derived from the live
  catalog, category buttons filter the live grid, and zero-count categories stay visible but disabled.
  Sections with no real data source (such as top gifters) render through
  `src/components/ui/ComingSoonPanel.tsx` with abstract placeholder text only. The live-stream grid is
  one `StreamCard` per matching `/channels.json` entry — don't pad it with fake placeholder cards.
- SSE is the single source of truth for chat: after `POST /messages` succeeds, do not optimistically
  append the message locally — wait for it to arrive via the EventSource stream.
- Only one `EventSource` connection exists for `/events`, shared by both `ChatPanel` and `DanmakuLayer`
  through `useCommentStream` / `useCommentStore` — never open a second connection for danmaku.
- Gift catalog (`GET /items`) is lazy-fetched on first open of the gift picker, then cached in memory for
  the session — not fetched on page load. Items carry `cost` / `group` / `animationUrl` and all three are
  in use: cost on the picker cards, `group` driving the picker's HeroUI `Tabs` (**derived from the data,
  never a hardcoded list of the current 4 groups**), and `animationUrl` driving the animation. Never infer
  "has an animation" from `cost === 1000` — check `animationUrl` directly.
- Gift **credits** are local-only (`src/store/credits.ts`, initial 3000, `streamly-credits`). There is no
  balance API (`Docs/LIMITATIONS.md` lists `gift point balance` as unavailable), so the UI says
  "サーバーの残高ではありません" — not just "device-local". Deduction happens when `POST /messages`
  resolves 2xx (a `202 Accepted`), which is where the server has accepted the send; there is no reason to
  wait for the SSE echo and waiting would just risk never deducting. No top-up/reset.
  `POST /messages` does return `{id, timestamp}` and **that `id` matches the SSE event's `id`** (verified),
  so a send *can* be correlated to its own echo if a feature ever needs it — `sendMessage` simply doesn't
  read the body today because nothing needs it. Don't repeat the old claim that correlation is impossible.
- Animated gifts: `animations/*.webp` are **infinite-loop** animated WebPs and `<img>` has no
  `play()`/`pause()`, so the only play/stop lever is swapping `src` between `iconUrl` and `animationUrl`.
  That lives in one place — `src/features/gifts/GiftImage.tsx` (which also does the
  animation → icon → Lucide fallback chain). Default state is the static icon; the exceptions that
  animate are picker hover/focus, the 5s `GiftOverlay` on the player, and the chat gift box. `base.css`'s
  `prefers-reduced-motion` block only affects CSS animations, so reduced motion is handled in JS
  (`src/lib/reducedMotion.ts`) by keeping the static icon.
- New-message detection goes through `useFreshMessages` (`src/store/comments.ts`), not a
  `messages.length` diff — the store caps at 300, so a count diff silently stops firing forever once the
  cap is hit (this was a real bug that killed danmaku). `DanmakuLayer` and `GiftOverlay` both use it.
- Comment store caps at 300 messages (`src/store/comments.ts`) to bound DOM growth; raise this only with
  virtualization in place.

Endpoint URLs come only from the four required `VITE_*_URL` variables and are validated by
`src/lib/api/endpointConfig.ts`; feature components call through
`src/lib/api/{channels,comments,messages,gifts}.ts` and never construct request URLs themselves.

## Architecture

Feature-first layout — player, chat, gifts, and danmaku change independently and are kept in separate
feature folders rather than by technical layer:

```
src/app/router.tsx        code-based TanStack Router ("/", "/watch", "/favorites", "/follows",
                           "/history" — migrate to file-based routing only once routes actually grow
                           well beyond this)
src/components/layout/    AppShell
src/components/ui/        shared UI (e.g. ComingSoonPanel)
src/features/home/        HomePage, StreamCard (one real card per channel + loading skeleton),
                           FollowedChannelsPanel (followed ∩ live, from store/follows.ts)
src/features/watch/       WatchPage (resolves the selected channel, passes source to StreamPlayer)
src/features/collections/ CollectionPages: FavoritesPage / FollowsPage / HistoryPage over one shared
                           "stored ids ∩ live" page component; reuses home's StreamCard
src/features/player/      StreamPlayer (source prop), useHlsPlayer (HLS via hls.js, native HLS on
                           Safari/iOS)
src/features/chat/        ChatPanel, ChatComposer, ChatMessageView, useCommentStream
src/features/danmaku/     DanmakuLayer (consumes the same comment stream as chat)
src/features/gifts/       GiftPicker, useGiftCatalog
src/lib/api/              endpoint URLs + typed request/response contracts — the only layer allowed to
                           know about the fixed backend shape. channels.ts: fetchChannels,
                           resolvePlaylistUrl, resolveSelectedChannel
src/store/                Zustand: comments.ts (realtime, capped at 300), preferences.ts (mute, volume,
                           danmaku on/off + opacity, chat visibility), channels.ts (fetch-once channel
                           catalog cache; selected id is NOT here, it lives in the URL),
                           follows.ts / favorites.ts (local-only id-set toggles via createIdSetStore.ts),
                           history.ts (local-only, ordered newest-first, capped at 30)
src/styles.css            Tailwind/HeroUI imports + `@import` list only — no rules here
src/styles/               one CSS file per feature/component (base, app-shell, ui, home, watch,
                           collections, player, danmaku, chat, gifts), mirroring src/features/* and
                           src/components/*
```

New CSS goes in `src/styles/<name>.css` (matching the feature/component it styles), imported from
`src/styles.css` — never add rules directly to `src/styles.css` or grow it into one big stylesheet.

Server-derived state (HLS media, comments, gift catalog) and local UI preference state (mute, volume,
danmaku settings, chat visibility) are kept in separate stores/hooks — don't mix them into one Zustand
slice.

No TanStack Query: current data access patterns are long-lived connections (HLS, SSE) or single-shot
fetches, not `GET → cache → invalidate → refetch`. Reconsider only if list/profile/search-style server
state is added.

### Component boundaries

- `StreamPlayer` — video/HLS/fullscreen, player overlay, danmaku container.
- `ChatPanel` — SSE lifecycle, comment list, composer.
- `GiftPicker` — lazy catalog load, gift selection.
- `ChatComposer` — text + gift payload, send state, preserves input on failure.

Keep raw `fetch`/`EventSource` calls out of feature components — route them through `src/lib/api`.

### Layout / responsive

Orientation is detected after `loadedmetadata` by comparing `video.videoWidth`/`videoHeight`, not by
viewport size. Landscape and portrait streams get different desktop layouts (see `Docs/FRONTEND-UX.md`
for the ASCII layouts); mobile always stacks video → metadata → chat. Video uses `object-fit: contain`,
never crop.

## Stack notes (why, not just what)

Full rationale in `Docs/STACK.md`; skim it before swapping a dependency. Short version:

- Pure CSR (no Next.js) — the fixed backend means SSR/RSC wouldn't add any capability.
- HeroUI v3 is the standard UI library — fixed, not a preference. For any generic UI (Button, Input,
  Textarea, Select, Checkbox, Radio, Switch, Tabs, Modal/Dialog, Popover, Tooltip, Dropdown, Card, Form,
  Navigation, Pagination, …), check whether HeroUI v3 already covers it, then whether existing HeroUI
  components can be composed to cover it, and only build a custom component when both fail. Don't reach
  for HeroUI to build the video player itself — that stays Tailwind/native. Don't add another general
  component kit (shadcn/ui, MUI, Chakra, Ant Design, Mantine, other Radix-based sets) alongside it; a
  second general UI system is not a "clear technical reason." A specialized library (charts, rich text
  editor, drag-and-drop, virtualized list, date utilities, code editor — media playback is already
  hls.js) is fine for functionality HeroUI doesn't attempt, scoped to that one need.
- Icons are lucide-react, already a dependency — no emoji or Unicode symbols as UI icons, no hand-rolled
  SVG for an icon Lucide already has, no second icon set. Keep size/stroke-width consistent across the UI.
- Tailwind for everything player/layout/danmaku/gift-card/responsive specific.
- Native `EventSource`/`fetch` — no axios/query library added for four simple, mostly long-lived
  connections.
- Zustand only, no Redux — state surface is intentionally small.
- PWA caches the app shell only; `NetworkOnly` is set for the HLS and comment-server origins in
  `vite.config.ts` — do not change `.m3u8`, SSE, `/messages`, or `/items` to a caching strategy.

## UI quality and animation

`Docs/reference/ui/home-concept.png` and `Docs/reference/ui/watch-concept.png` (see
`Docs/reference/README.md`) are the visual targets for the home and watch screens — check new/changed UI
against them for layout, visual hierarchy, and styling. They are references for look and information
hierarchy only: never implement the numbers/users/rankings they depict as if backed by real data (see
"Fixed backend API" above) — placeholder-only sections still go through `ComingSoonPanel`.

Concrete lesson from an actual drift incident: neither reference screen has a small purple all-caps
English micro-label ("CATEGORIES", "AVAILABLE NOW", "LIVE STREAM", …) above section headings — only the
Home hero's Japanese caption ("ようこそ Streamly へ") exists in the reference. Don't add that eyebrow
pattern to a new section on a hunch that it looks nice; if the reference doesn't show it, leave it out.
When in doubt, open the reference image again rather than pattern-matching from other sections already in
the codebase (they can drift too).

Working ≠ done for frontend changes. Also hold the line on: visual hierarchy, consistent spacing and
component sizing, readable typography, proper responsive behavior, accessible interaction, real
hover/focus/active states, and balanced information density.

Avoid template AI-generated UI, in particular: gradients, glassmorphism, and shadows used without a
reason; walls of cards; wrapping everything in a rounded container; meaningless badges; decoration-only
animation; oversized hero sections; filler marketing copy. When in doubt, improve typography, spacing,
alignment, and hierarchy before adding decoration.

Animation should clarify a state change or the result of an action, not decorate — don't animate things
that don't need to move. Use these skills when available:

- `animate` — building a new animation from scratch.
- `improve-animations` — auditing/improving existing motion across the codebase.
- `find-animation-opportunities` — deciding where motion should be added.
- `emil-design-eng` — general polish/animation-decision philosophy.

## Docs

`Docs/` holds the design rationale, read in order: `STACK.md` → `API-INTEGRATION.md` →
`HLS-SERVER.md` (multi-channel HLS spec) → `ARCHITECTURE.md` → `FRONTEND-UX.md` → `LIMITATIONS.md` →
`DEVELOPMENT.md`. Consult these before proposing architectural changes — most "obvious" additions
(TanStack Query, Redux, real usernames, channel-scoped chat) have already been deliberately deferred
and the reasoning is recorded there.

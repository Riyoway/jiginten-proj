import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AppShell } from "../components/layout/AppShell";
import { FavoritesPage, FollowsPage, HistoryPage } from "../features/collections/CollectionPages";
import { HomePage } from "../features/home/HomePage";
import { WatchPage } from "../features/watch/WatchPage";

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

export const watchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/watch",
  // channel未指定時はdefaultチャンネル(resolveSelectedChannelが解決)にフォールバックする。
  validateSearch: (search: Record<string, unknown>): { channel?: string } => ({
    channel: typeof search.channel === "string" ? search.channel : undefined,
  }),
  component: WatchPage,
});

const favoritesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/favorites",
  component: FavoritesPage,
});

const followsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/follows",
  component: FollowsPage,
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: HistoryPage,
});

const routeTree = rootRoute.addChildren([homeRoute, watchRoute, favoritesRoute, followsRoute, historyRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

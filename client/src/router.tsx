import { createBrowserRouter, Navigate } from 'react-router';
import { lazy, Suspense, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { GuestRoute, LoginPage, NotFoundPage, ProtectedRoute, RegisterPage } from './features/auth';
import { AppShell } from './features/app';

const pageFallback = <div className="grid min-h-56 place-items-center bg-kanbot-page text-sm text-kanbot-muted" role="status">Loading page…</div>;
function lazyPage<T extends ComponentType>(load: () => Promise<{ default: T }>, fallback: ReactNode = pageFallback) {
  const Page = lazy(load) as unknown as LazyExoticComponent<ComponentType<Record<string, never>>>;
  return <Suspense fallback={fallback}><Page /></Suspense>;
}

export const router = createBrowserRouter([
  { element: <GuestRoute />, children: [{ path: '/login', element: <LoginPage /> }, { path: '/register', element: <RegisterPage /> }] },
  { element: <ProtectedRoute />, children: [{ element: <><AppShell />{lazyPage(() => import('./features/ai/components/AiOverlays').then((module) => ({ default: module.AiOverlays })), null)}</>, children: [
    { path: '/', element: <Navigate to="/projects" replace /> },
    { path: '/projects', element: lazyPage(() => import('./features/projects/pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage }))) },
    { path: '/projects/:projectId/backlog', element: lazyPage(() => import('./features/backlog/pages/BacklogPage').then((module) => ({ default: module.BacklogPage }))) },
    { path: '/projects/:projectId/board', element: lazyPage(() => import('./features/board/pages/BoardPage').then((module) => ({ default: module.BoardPage }))) },
    { path: '/projects/:projectId/sprints', element: lazyPage(() => import('./features/sprints/pages/SprintsPage').then((module) => ({ default: module.SprintsPage }))) },
    { path: '/projects/:projectId/settings', element: lazyPage(() => import('./features/account/pages/AccountSettingsPage').then((module) => ({ default: module.AccountSettingsPage }))) },
    { path: '/settings', element: lazyPage(() => import('./features/account/pages/AccountSettingsPage').then((module) => ({ default: module.AccountSettingsPage }))) },
  ] }] },
  { path: '*', element: <NotFoundPage /> },
]);

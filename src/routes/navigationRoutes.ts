export const STACK_ROUTE_PREFIXES = [
  '/reply',
  '/reply-detail',
  '/mypage-edit',
  '/blocked-users',
  '/not-assigned',
  '/signup/ai-consent',
  '/signup/role',
  '/signup/birth',
  '/signup/image',
  '/signup/family',
];

export const TAB_ROOT_ROUTES = ['/home', '/history', '/notification', '/mypage'];
export const EXIT_ROUTES = ['/', ...TAB_ROOT_ROUTES];

export const isStackRoute = (pathname: string) =>
  STACK_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

export const isExitRoute = (pathname: string) => EXIT_ROUTES.includes(pathname);

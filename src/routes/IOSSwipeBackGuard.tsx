import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useModalStore } from '@/features/modal/modalStore';

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        onsikkuSwipeBack?: {
          postMessage: (message: { enabled: boolean }) => void;
        };
      };
    };
  }
}

const STACK_ROUTE_PREFIXES = [
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

const isStackRoute = (pathname: string) =>
  STACK_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

const hasBlockingOverlay = () =>
  Boolean(document.querySelector('[data-route-modal="true"]'));

const setNativeSwipeBackEnabled = (enabled: boolean) => {
  window.webkit?.messageHandlers?.onsikkuSwipeBack?.postMessage({ enabled });
};

export default function IOSSwipeBackGuard() {
  const location = useLocation();
  const isGlobalModalOpen = useModalStore((state) => state.isOpen);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    const syncNativeSwipeBack = () => {
      setNativeSwipeBackEnabled(
        isStackRoute(location.pathname) &&
          !isGlobalModalOpen &&
          !hasBlockingOverlay(),
      );
    };

    syncNativeSwipeBack();

    const observer = new MutationObserver(syncNativeSwipeBack);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-route-modal'],
    });

    return () => {
      observer.disconnect();
      setNativeSwipeBackEnabled(false);
    };
  }, [isGlobalModalOpen, location.pathname]);

  return null;
}

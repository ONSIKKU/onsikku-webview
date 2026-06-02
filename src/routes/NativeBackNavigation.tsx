import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModalStore } from '@/features/modal/modalStore';
import { isExitRoute, isStackRoute } from '@/routes/navigationRoutes';

const EDGE_SWIPE_START_X = 24;
const EDGE_SWIPE_TRIGGER_X = 72;
const EDGE_SWIPE_MAX_Y = 90;

const hasBlockingOverlay = () =>
  Boolean(document.querySelector('[data-route-modal="true"]'));

const isInteractiveElement = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [role="button"], [contenteditable="true"]',
    ),
  );
};

export default function NativeBackNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGlobalModalOpen = useModalStore((state) => state.isOpen);
  const closeModal = useModalStore((state) => state.closeModal);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    let disposed = false;
    let listener: PluginListenerHandle | null = null;

    void CapacitorApp.addListener('backButton', (event) => {
      if (isGlobalModalOpen) {
        closeModal();
        return;
      }

      if (hasBlockingOverlay()) return;

      if (!isExitRoute(location.pathname) && event.canGoBack) {
        navigate(-1);
        return;
      }

      if (!isExitRoute(location.pathname) && isStackRoute(location.pathname)) {
        navigate(-1);
        return;
      }

      void CapacitorApp.exitApp();
    }).then((handle) => {
      if (disposed) {
        void handle.remove();
        return;
      }

      listener = handle;
    });

    return () => {
      disposed = true;
      void listener?.remove();
    };
  }, [closeModal, isGlobalModalOpen, location.pathname, navigate]);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    const gesture = {
      active: false,
      tracking: false,
      startX: 0,
      startY: 0,
    };

    const canSwipeBack = () =>
      isStackRoute(location.pathname) &&
      !isGlobalModalOpen &&
      !hasBlockingOverlay() &&
      window.history.length > 1;

    const resetGesture = () => {
      gesture.active = false;
      gesture.tracking = false;
      gesture.startX = 0;
      gesture.startY = 0;
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      if (!canSwipeBack()) return;
      if (isInteractiveElement(event.target)) return;

      const touch = event.touches[0];
      if (!touch || touch.clientX > EDGE_SWIPE_START_X) return;

      gesture.active = true;
      gesture.tracking = false;
      gesture.startX = touch.clientX;
      gesture.startY = touch.clientY;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!gesture.active) return;

      const touch = event.touches[0];
      if (!touch) {
        resetGesture();
        return;
      }

      const deltaX = touch.clientX - gesture.startX;
      const deltaY = Math.abs(touch.clientY - gesture.startY);

      if (deltaX < 0 || deltaY > EDGE_SWIPE_MAX_Y) {
        resetGesture();
        return;
      }

      if (deltaX > 12 && deltaX > deltaY * 1.2) {
        gesture.tracking = true;
        event.preventDefault();
      }
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!gesture.active) return;

      const touch = event.changedTouches[0];
      const deltaX = touch ? touch.clientX - gesture.startX : 0;
      const deltaY = touch ? Math.abs(touch.clientY - gesture.startY) : 0;
      const shouldNavigateBack =
        gesture.tracking &&
        deltaX >= EDGE_SWIPE_TRIGGER_X &&
        deltaY <= EDGE_SWIPE_MAX_Y;

      resetGesture();

      if (!shouldNavigateBack) return;

      event.preventDefault();
      navigate(-1);
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });
    document.addEventListener('touchend', handleTouchEnd, {
      passive: false,
    });
    document.addEventListener('touchcancel', resetGesture);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', resetGesture);
    };
  }, [isGlobalModalOpen, location.pathname, navigate]);

  return null;
}

import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useModalStore } from '@/features/modal/modalStore';

const EDGE_START_PX = 24;
const MIN_SWIPE_X = 72;
const MAX_SWIPE_Y = 64;
const MAX_DRAG_RATIO = 0.42;

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

export default function IOSSwipeBackGuard() {
  const location = useLocation();
  const navigate = useNavigate();
  const isGlobalModalOpen = useModalStore((state) => state.isOpen);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'ios') return;

    let tracking = false;
    let didPrevent = false;
    let startX = 0;
    let startY = 0;
    let latestX = 0;
    let latestY = 0;
    let navigateTimer: number | undefined;
    let cleanupTimer: number | undefined;

    const getSwipeTarget = () => document.getElementById('root');

    const clearSwipeTargetStyles = () => {
      const target = getSwipeTarget();
      if (!target) return;

      target.style.transition = '';
      target.style.transform = '';
      target.style.boxShadow = '';
      target.style.borderTopLeftRadius = '';
      target.style.borderBottomLeftRadius = '';
      target.style.overflow = '';
    };

    const scheduleStyleCleanup = (delay = 220) => {
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      cleanupTimer = window.setTimeout(() => {
        clearSwipeTargetStyles();
        cleanupTimer = undefined;
      }, delay);
    };

    const resetSwipeTarget = () => {
      const target = getSwipeTarget();
      if (!target) return;

      target.style.transition = 'transform 180ms ease-out, box-shadow 180ms ease-out';
      target.style.transform = 'translate3d(0, 0, 0)';
      target.style.boxShadow = 'none';
      target.style.borderTopLeftRadius = '';
      target.style.borderBottomLeftRadius = '';
      scheduleStyleCleanup();
    };

    const applySwipeProgress = (deltaX: number) => {
      const target = getSwipeTarget();
      if (!target) return;

      const width = Math.max(window.innerWidth, 1);
      const capped = Math.min(deltaX, width * MAX_DRAG_RATIO);
      const eased = capped * 0.86;
      const progress = Math.min(1, capped / MIN_SWIPE_X);
      const radius = Math.round(progress * 18);

      target.style.transition = 'none';
      target.style.transform = `translate3d(${eased}px, 0, 0)`;
      target.style.boxShadow = `-18px 0 42px rgba(15, 23, 42, ${0.1 * progress})`;
      target.style.borderTopLeftRadius = `${radius}px`;
      target.style.borderBottomLeftRadius = `${radius}px`;
      target.style.overflow = 'hidden';
    };

    const completeSwipeBack = () => {
      const target = getSwipeTarget();
      if (target) {
        target.style.transition = 'transform 150ms ease-out, box-shadow 150ms ease-out';
        target.style.transform = `translate3d(${window.innerWidth}px, 0, 0)`;
        target.style.boxShadow = '-24px 0 50px rgba(15, 23, 42, 0.12)';
      }

      if (navigateTimer) window.clearTimeout(navigateTimer);
      navigateTimer = window.setTimeout(() => {
        navigate(-1);
        clearSwipeTargetStyles();
        navigateTimer = undefined;
      }, 110);
    };

    const canUseSwipeBack = () =>
      isStackRoute(location.pathname) &&
      !isGlobalModalOpen &&
      !hasBlockingOverlay();

    const onTouchStart = (event: TouchEvent) => {
      if (!canUseSwipeBack() || event.touches.length !== 1) {
        tracking = false;
        return;
      }

      const touch = event.touches[0];
      if (touch.clientX > EDGE_START_PX) {
        tracking = false;
        return;
      }

      tracking = true;
      didPrevent = false;
      startX = touch.clientX;
      startY = touch.clientY;
      latestX = touch.clientX;
      latestY = touch.clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!tracking || event.touches.length !== 1) return;

      const touch = event.touches[0];
      latestX = touch.clientX;
      latestY = touch.clientY;

      const deltaX = latestX - startX;
      const deltaY = Math.abs(latestY - startY);

      if (deltaX > 12 && deltaY < MAX_SWIPE_Y) {
        event.preventDefault();
        didPrevent = true;
        applySwipeProgress(deltaX);
      }
    };

    const onTouchEnd = () => {
      if (!tracking) return;

      const deltaX = latestX - startX;
      const deltaY = Math.abs(latestY - startY);
      tracking = false;

      if (deltaX >= MIN_SWIPE_X && deltaY <= MAX_SWIPE_Y && canUseSwipeBack()) {
        completeSwipeBack();
        return;
      }

      if (didPrevent) {
        resetSwipeTarget();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      if (navigateTimer) window.clearTimeout(navigateTimer);
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      clearSwipeTargetStyles();
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isGlobalModalOpen, location.pathname, navigate]);

  return null;
}

import { Capacitor } from '@capacitor/core';
import {
  AndroidAnimation,
  AndroidViewStyle,
  DefaultSystemBrowserOptions,
  DismissStyle,
  InAppBrowser,
  iOSAnimation,
  iOSViewStyle,
} from '@capacitor/inappbrowser';

const SYSTEM_BROWSER_OPTIONS = {
  ...DefaultSystemBrowserOptions,
  iOS: {
    ...DefaultSystemBrowserOptions.iOS,
    closeButtonText: DismissStyle.CLOSE,
    viewStyle: iOSViewStyle.PAGE_SHEET,
    animationEffect: iOSAnimation.COVER_VERTICAL,
  },
  android: {
    ...DefaultSystemBrowserOptions.android,
    viewStyle: AndroidViewStyle.BOTTOM_SHEET,
    bottomSheetOptions: {
      height: 720,
      isFixed: false,
    },
    startAnimation: AndroidAnimation.FADE_IN,
    exitAnimation: AndroidAnimation.FADE_OUT,
  },
} as const;

export async function openSystemBrowser(url: string) {
  if (!Capacitor.isNativePlatform()) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  await InAppBrowser.openInSystemBrowser({
    url,
    options: SYSTEM_BROWSER_OPTIONS,
  });
}

export async function closeSystemBrowser() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await InAppBrowser.close();
  } catch {
    // Ignore close failures when there is no active browser.
  }
}

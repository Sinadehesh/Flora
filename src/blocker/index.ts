/**
 * Bridge between the flower challenge (JS) and the OS-level app blocker.
 *
 *  - Android: the native `app-blocker` module (modules/app-blocker). A foreground
 *    service watches the app in front and opens `floralock://challenge?source=…&package=…`
 *    over any blocked app that isn't inside an unlock window.
 *  - iOS and web: not available yet (iOS needs the Screen Time API, a Mac to build and
 *    Apple's approval; see docs/PLATFORM_INTEGRATION.md). A simulated blocker keeps the
 *    challenge flow usable there via "Preview the lock screen".
 */
import AppBlocker, { type LaunchableApp } from '../../modules/app-blocker';

export type { LaunchableApp };

export interface BlockerPermissions {
  /** Android "Usage access": lets FloraLock see which app is in front. */
  usageAccess: boolean;
  /** Android "Display over other apps": lets FloraLock open the challenge on top. */
  overlay: boolean;
}

export interface AppBlocker {
  readonly available: boolean;
  permissions(): BlockerPermissions;
  openUsageAccessSettings(): void;
  openOverlaySettings(): void;
  getLaunchableApps(): Promise<LaunchableApp[]>;
  getBlockedApps(): string[];
  setBlockedApps(packageNames: string[]): void;
  isEnabled(): boolean;
  setEnabled(enabled: boolean): void;
  /** Let `packageName` (or every blocked app) open freely for `minutes`. */
  grantTemporaryAccess(packageName: string | undefined, minutes: number): void;
  /** Bring the app the user was trying to open back to the front. */
  returnToApp(packageName: string): boolean;
  goHome(): void;
}

const CHALLENGE_URL = 'floralock://challenge';

function androidBlocker(native: NonNullable<typeof AppBlocker>): AppBlocker {
  return {
    available: true,
    permissions: () => ({ usageAccess: native.hasUsageAccess(), overlay: native.canDrawOverlays() }),
    openUsageAccessSettings: () => native.openUsageAccessSettings(),
    openOverlaySettings: () => native.openOverlaySettings(),
    getLaunchableApps: () => native.getLaunchableApps(),
    getBlockedApps: () => native.getBlockedApps(),
    setBlockedApps: (packageNames) => native.setBlockedApps(packageNames),
    isEnabled: () => native.isEnabled(),
    setEnabled: (enabled) => {
      if (enabled) native.requestNotificationPermission();
      native.setEnabled(enabled, CHALLENGE_URL);
    },
    grantTemporaryAccess: (packageName, minutes) => native.grantTemporaryAccess(packageName ?? null, minutes),
    returnToApp: (packageName) => native.openApp(packageName),
    goHome: () => native.goHome(),
  };
}

const simulatedBlocker: AppBlocker = {
  available: false,
  permissions: () => ({ usageAccess: false, overlay: false }),
  openUsageAccessSettings: () => {},
  openOverlaySettings: () => {},
  getLaunchableApps: async () => [],
  getBlockedApps: () => [],
  setBlockedApps: () => {},
  isEnabled: () => false,
  setEnabled: () => {},
  grantTemporaryAccess: () => {},
  returnToApp: () => false,
  goHome: () => {},
};

export const blocker: AppBlocker = AppBlocker ? androidBlocker(AppBlocker) : simulatedBlocker;

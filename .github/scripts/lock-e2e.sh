#!/usr/bin/env bash
# Runs inside reactivecircus/android-emulator-runner: installs the APK, grants the lock's
# permissions the way a user would in system settings, then drives the app with Maestro.
# On failure it prints what's needed to diagnose it straight into the job log.
set -uxo pipefail

PKG=com.floralock.app
APK=$(ls apk/*.apk | head -n 1)
OUT=e2e-output
mkdir -p "$OUT"

adb install -r "$APK" || exit 1

# Usage access and "Display over other apps" are app-ops the user toggles in Settings.
adb shell appops set "$PKG" GET_USAGE_STATS allow
adb shell appops set "$PKG" SYSTEM_ALERT_WINDOW allow
# Android 13+ notification permission (the lock works without it; avoids a dialog in the flow).
adb shell pm grant "$PKG" android.permission.POST_NOTIFICATIONS 2>/dev/null || true
adb logcat -c 2>/dev/null || true
# CI emulators sometimes flag their own System UI as "not responding" just after a cold boot,
# and that system dialog covers whatever app is in front. Hide system error dialogs and close
# any that is already showing (this changes the emulator only, not FloraLock).
adb shell settings put global hide_error_dialogs 1 || true
adb shell am broadcast -a android.intent.action.CLOSE_SYSTEM_DIALOGS >/dev/null 2>&1 || true

status=0
maestro test e2e/lock.yaml --format junit --output "$OUT/report.xml" --debug-output "$OUT/debug" || status=$?

adb logcat -d -v time > "$OUT/logcat.txt" 2>/dev/null || true

if [ "$status" -ne 0 ]; then
  set +x
  echo "::group::Maestro steps"
  python3 - "$OUT/debug" <<'PY' || true
import json, pathlib, sys
for f in sorted(pathlib.Path(sys.argv[1]).rglob('commands-*.json')):
    for c in json.load(open(f)):
        cmd = {k: v for k, v in c.get('command', {}).items() if v}
        meta = c.get('metadata', {})
        err = (meta.get('error') or {}).get('message', '')
        print(f"{meta.get('status', '?'):10} {json.dumps(cmd)[:160]} {err[:200]}")
PY
  echo "::endgroup::"
  echo "::group::Text on screen at failure"
  adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1 && adb shell cat /sdcard/ui.xml \
    | grep -oE '(text|content-desc|resource-id)="[^"]+"' | head -80 || true
  echo "::endgroup::"
  echo "::group::Crashes and app errors (logcat)"
  grep -E "FATAL EXCEPTION|AndroidRuntime|ReactNativeJS|FloraLockBlocker|$PKG" "$OUT/logcat.txt" | tail -80 || true
  echo "::endgroup::"
  echo "::group::Lock service"
  adb shell dumpsys activity services "$PKG" | head -30 || true
  echo "::endgroup::"
fi
exit "$status"

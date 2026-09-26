#!/usr/bin/env bash
# Runs inside reactivecircus/android-emulator-runner: installs the APK, grants the lock's
# permissions the way a user would in system settings, then drives the app with Maestro.
set -euxo pipefail

PKG=com.floralock.app
APK=$(ls apk/*.apk | head -n 1)
mkdir -p e2e-output

adb install -r "$APK"

# Usage access and "Display over other apps" are app-ops the user toggles in Settings.
adb shell appops set "$PKG" GET_USAGE_STATS allow
adb shell appops set "$PKG" SYSTEM_ALERT_WINDOW allow
# Android 13+ notification permission (the lock works without it; avoids a dialog in the flow).
adb shell pm grant "$PKG" android.permission.POST_NOTIFICATIONS || true

adb logcat -c
adb logcat -v time > e2e-output/logcat.txt 2>&1 &
LOGCAT_PID=$!

status=0
maestro test e2e/lock.yaml --format junit --output e2e-output/report.xml \
  --debug-output e2e-output/debug || status=$?

kill "$LOGCAT_PID" || true
adb shell dumpsys activity services "$PKG" > e2e-output/services.txt || true
exit "$status"

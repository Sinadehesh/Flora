package expo.modules.appblocker

import android.Manifest
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AppBlockerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("AppBlocker")

    // --- Permissions -------------------------------------------------------

    Function("hasUsageAccess") {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        appOps.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      } else {
        @Suppress("DEPRECATION")
        appOps.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
      }
      mode == AppOpsManager.MODE_ALLOWED
    }

    Function("canDrawOverlays") {
      Settings.canDrawOverlays(context)
    }

    Function("openUsageAccessSettings") {
      openSettings(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }

    Function("openOverlaySettings") {
      openSettings(
        Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
      )
    }

    /** Android 13+: lets the "FloraLock is on" notification show. The lock works without it. */
    Function("requestNotificationPermission") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        appContext.currentActivity?.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4711)
      }
    }

    // --- Apps ----------------------------------------------------------------

    /** Every app with a launcher icon except FloraLock itself, sorted by name. */
    AsyncFunction("getLaunchableApps") {
      val pm = context.packageManager
      val launcher = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
      pm.queryIntentActivities(launcher, 0)
        .map { it.activityInfo.packageName }
        .distinct()
        .filter { it != context.packageName }
        .map { mapOf("packageName" to it, "label" to appLabel(context, it)) }
        .sortedBy { it["label"]?.lowercase() }
    }

    Function("getBlockedApps") {
      BlockerStore(context).blockedPackages.toList()
    }

    Function("setBlockedApps") { packageNames: List<String> ->
      BlockerStore(context).blockedPackages = packageNames.toSet()
    }

    // --- Lock on/off -----------------------------------------------------------

    Function("isEnabled") {
      BlockerStore(context).enabled
    }

    Function("setEnabled") { enabled: Boolean, challengeUrl: String ->
      val store = BlockerStore(context)
      store.challengeUrl = challengeUrl
      store.enabled = enabled
      if (enabled) BlockerService.start(context) else BlockerService.stop(context)
    }

    /** Let `packageName` (or every blocked app, when null) open freely for `minutes`. */
    Function("grantTemporaryAccess") { packageName: String?, minutes: Int ->
      val store = BlockerStore(context)
      val targets = if (packageName != null) listOf(packageName) else store.blockedPackages
      store.grant(targets, System.currentTimeMillis() + minutes * 60_000L)
    }

    // --- Leaving the challenge -------------------------------------------------

    Function("openApp") { packageName: String ->
      val intent = context.packageManager.getLaunchIntentForPackage(packageName)
      if (intent != null) context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      intent != null
    }

    Function("goHome") {
      val home = Intent(Intent.ACTION_MAIN)
        .addCategory(Intent.CATEGORY_HOME)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(home)
    }
  }

  private fun openSettings(intent: Intent) {
    context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }
}

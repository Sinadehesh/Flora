package expo.modules.appblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

/**
 * Foreground service that polls UsageStatsManager for the app in front. When it's a
 * blocked app without an active unlock window, it opens the challenge deep link on top.
 *
 * Opening an activity from the background is allowed because the user has granted
 * "Display over other apps" (SYSTEM_ALERT_WINDOW).
 */
class BlockerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private lateinit var store: BlockerStore
  private var foregroundPackage: String? = null
  private var lastQueryAt = 0L
  private var lastLaunchPackage: String? = null
  private var lastLaunchAt = 0L

  private val tick = object : Runnable {
    override fun run() {
      try {
        check()
      } catch (e: Exception) {
        Log.w(TAG, "Foreground check failed", e)
      }
      handler.postDelayed(this, POLL_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    store = BlockerStore(this)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    startInForeground()
    if (!store.enabled) {
      stopSelf()
      return START_NOT_STICKY
    }
    handler.removeCallbacks(tick)
    handler.post(tick)
    return START_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun check() {
    val power = getSystemService(Context.POWER_SERVICE) as PowerManager
    if (!power.isInteractive) return

    val pkg = currentForegroundPackage() ?: return
    if (pkg == packageName || pkg !in store.blockedPackages) return

    val now = System.currentTimeMillis()
    if (store.isUnlocked(pkg, now)) return
    // Give the challenge time to appear before firing again for the same app.
    if (pkg == lastLaunchPackage && now - lastLaunchAt < RELAUNCH_GAP_MS) return

    lastLaunchPackage = pkg
    lastLaunchAt = now
    openChallenge(pkg)
  }

  /** Latest app to come to the foreground; events only arrive on change, so remember it between polls. */
  private fun currentForegroundPackage(): String? {
    val usage = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val from = if (lastQueryAt == 0L) now - INITIAL_LOOKBACK_MS else lastQueryAt
    val events = usage.queryEvents(from, now)
    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      // ACTIVITY_RESUMED (API 29+) has the same value as the older MOVE_TO_FOREGROUND.
      if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
        foregroundPackage = event.packageName
      }
    }
    lastQueryAt = now
    return foregroundPackage
  }

  private fun openChallenge(pkg: String) {
    val uri = Uri.parse(store.challengeUrl).buildUpon()
      .appendQueryParameter("source", appLabel(this, pkg))
      .appendQueryParameter("package", pkg)
      .build()
    val intent = Intent(Intent.ACTION_VIEW, uri)
      .setPackage(packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    try {
      startActivity(intent)
    } catch (e: Exception) {
      Log.w(TAG, "Could not open the challenge over $pkg", e)
    }
  }

  private fun startInForeground() {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "App lock", NotificationManager.IMPORTANCE_MIN).apply {
          setShowBadge(false)
        }
      )
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this).setPriority(Notification.PRIORITY_MIN)
    }
    val openApp = packageManager.getLaunchIntentForPackage(packageName) ?: Intent()
    val contentIntent = PendingIntent.getActivity(
      this, 0, openApp, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    val notification = builder
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .setContentTitle("FloraLock is on")
      .setContentText("Locked apps open after you name a plant.")
      .setContentIntent(contentIntent)
      .setOngoing(true)
      .build()
    // The two-argument form uses the foregroundServiceType declared in the manifest (specialUse).
    startForeground(NOTIFICATION_ID, notification)
  }

  companion object {
    private const val TAG = "FloraLockBlocker"
    private const val CHANNEL_ID = "floralock_blocker"
    private const val NOTIFICATION_ID = 4711
    private const val POLL_MS = 600L
    private const val RELAUNCH_GAP_MS = 2500L
    private const val INITIAL_LOOKBACK_MS = 60_000L

    fun start(context: Context) {
      val intent = Intent(context, BlockerService::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, BlockerService::class.java))
    }
  }
}

internal fun appLabel(context: Context, pkg: String): String = try {
  val pm = context.packageManager
  pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
} catch (e: Exception) {
  pkg
}

package expo.modules.framerate

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Adaptive refresh rate keeps a non-touch animation at about 60 Hz unless the
 * window asks for more. This sets the window's preferred refresh rate in Hz
 * (0 clears it).
 */
class FrameRateModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FrameRate")

    Function("request") { hz: Float ->
      appContext.currentActivity?.let { activity ->
        activity.runOnUiThread {
          val window = activity.window
          val params = window.attributes

          params.preferredRefreshRate = hz
          window.attributes = params
        }
      }
    }
  }
}

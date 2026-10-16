/**
 * Web Haptic Feedback Engine
 * Provides tactile sensory pulses on mobile/tablet/stylus devices via navigator.vibrate
 */

export type HapticType =
  | 'light'      // 10ms - subtle UI click, tick, slider scrub
  | 'medium'     // 20ms - tool switch, page flip
  | 'heavy'      // 35ms - delete, clear page
  | 'selection'  // [15, 30, 15] - lasso selection, circle-to-lasso
  | 'snap'       // 14ms - ruler snap, geometric shape snap
  | 'success';   // [12, 35, 22] - quiz correct, export ready

export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return;
  }

  if (typeof navigator.vibrate !== 'function') {
    return;
  }

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(35);
        break;
      case 'snap':
        navigator.vibrate(14);
        break;
      case 'selection':
        navigator.vibrate([15, 30, 15]);
        break;
      case 'success':
        navigator.vibrate([12, 35, 22]);
        break;
      default:
        navigator.vibrate(12);
        break;
    }
  } catch {
    // Graceful fallback on restricted permissions
  }
}

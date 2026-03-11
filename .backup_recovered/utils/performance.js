// utils/performance.js — Simplified performance tracker
import { logEvent } from '../analytics';

class PerformanceMonitor {
  constructor() {
    this.timers = {};
    this.interactions = [];
  }

  startTimer(label) {
    this.timers[label] = Date.now();
  }

  endTimer(label) {
    if (this.timers[label]) {
      const duration = Date.now() - this.timers[label];
      logEvent('performance_timer', { label, duration_ms: duration });
      delete this.timers[label];
      return duration;
    }
    return 0;
  }

  trackUserInteraction(action, element, duration = 0) {
    logEvent('user_interaction', { action, element, duration_ms: duration });
  }

  trackError(error, context = {}) {
    logEvent('app_error', {
      error_message: error.message || String(error),
      ...context,
    });
  }

  sendPerformanceReport() {
    // Now handled by Firebase automatically
  }
}

const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;
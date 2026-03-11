import { logEvent } from '../analytics';

export class PerformanceMonitor {
  constructor() {
    this.timers = {};
  }

  async startMonitoring() {
    logEvent('performance_monitor_started');
  }

  startTimer(label) {
    this.timers[label] = Date.now();
  }

  endTimer(label) {
    if (!this.timers[label]) return 0;

    const duration = Date.now() - this.timers[label];
    delete this.timers[label];
    logEvent('performance_timer', { label, duration_ms: duration });
    return duration;
  }

  trackUserInteraction(action, element, duration = 0) {
    logEvent('user_interaction', { action, element, duration_ms: duration });
  }

  trackError(error, context = {}) {
    logEvent('app_error', {
      error_message: error?.message || String(error),
      ...context,
    });
  }

  sendPerformanceReport() {
    logEvent('performance_report_requested');
  }
}

const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

import type {Metric} from 'web-vitals';
import {onCLS, onFCP, onFID, onLCP, onTTFB} from 'web-vitals';

export interface WebVitalsOptions {
  readonly debug?: boolean;
}

declare global {
  interface Navigator {
    readonly connection?: NetworkInformation;
  }

  interface NetworkInformation extends EventTarget {
    readonly effectiveType?: string;
  }
}

export function reportWebVitals(options: WebVitalsOptions = {}): void {
  try {
    onFID((metric) => sendToAnalytics(metric, options));
    onTTFB((metric) => sendToAnalytics(metric, options));
    onLCP((metric) => sendToAnalytics(metric, options));
    onCLS((metric) => sendToAnalytics(metric, options));
    onFCP((metric) => sendToAnalytics(metric, options));
  } catch (err) {
    console.error(`[Vercel Analytics]`, err);
  }
}

const analyticsId = process.env.VERCEL_ANALYTICS_ID || ``;

function sendToAnalytics(metric: Metric, options: WebVitalsOptions): void {
  const url = new URL(location.href);

  const body: Record<string, string> = {
    dsn: analyticsId,
    id: metric.id,
    page: url.pathname,
    href: url.href,
    event_name: metric.name,
    value: metric.value.toString(),
    speed: navigator.connection?.effectiveType || ``,
  };

  if (options.debug) {
    console.log(
      `%c[Vercel Analytics]%c`,
      `color: rgb(120, 120, 120)`,
      `color: inherit`,
      metric.name,
      body,
    );
  }

  if (!analyticsId) {
    return;
  }

  const blob = new Blob([new URLSearchParams(body).toString()], {
    type: `application/x-www-form-urlencoded`,
  });

  navigator.sendBeacon(`/_vercel/insights/vitals`, blob);
}

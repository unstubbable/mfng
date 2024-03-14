import {Ratelimit} from '@upstash/ratelimit';
import {Redis} from '@upstash/redis';
import type {MiddlewareHandler} from 'hono';

let ratelimit: Ratelimit | undefined;

try {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, `10 m`),
    analytics: true,
    ephemeralCache: new Map(),
  });
} catch {
  console.warn(`Unable to create Redis instance, no rate limits are applied.`);
}

export const ratelimitMiddleware: MiddlewareHandler = async (context, next) => {
  if (ratelimit && context.req.method === `POST`) {
    const ip = context.req.header(`cloudfront-viewer-address`);

    if (ip) {
      const {success, reset} = await ratelimit.limit(ip);

      if (!success) {
        console.debug(`Rate limit reached for ${ip}`);

        return context.text(`Too Many Requests`, 429, {
          'Retry-After': ((reset - Date.now()) / 1000).toFixed(),
        });
      }
    } else {
      console.warn(`cloudfront-viewer-address not provided`);
    }
  }

  return next();
};

// @ts-ignore
import handler from '../.vercel/output/functions/index.func/index.js';

if (self.fetchEventListener) {
  removeEventListener(`fetch`, self.fetchEventListener);
}

self.fetchEventListener = function myHandler(event) {
  event.respondWith(handler(event.request));
};

addEventListener(`fetch`, self.fetchEventListener);

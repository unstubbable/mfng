// @ts-ignore
import handler from '../.vercel/output/functions/index.func/index.js';

// // @ts-ignore
// console.log(`self.__listeners`, self.__listeners);

// if (self.fetchEventListener) {
//   console.log(`removing fetch event listener`);
//   removeEventListener(`fetch`, self.fetchEventListener);
//   // @ts-ignore
//   console.log(`self.__listeners`, self.__listeners);
// }

// self.fetchEventListener = function myHandler(event) {
//   event.respondWith(handler(event.request));
// };

// console.log(`adding fetch event listener`);
// addEventListener(`fetch`, self.fetchEventListener);
// // @ts-ignore
// console.log(`self.__listeners`, self.__listeners);

addEventListener(`fetch`, (event) => {
  event.respondWith(handler(event.request));
});

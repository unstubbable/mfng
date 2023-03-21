const socket = new WebSocket(
  `wss://7v8m6140m5.execute-api.eu-central-1.amazonaws.com`,
);

socket.addEventListener(`open`, () => {
  socket.send(JSON.stringify({action: `foo`}));
});

socket.addEventListener(`message`, (event) => {
  console.log(event.data);
});

socket.addEventListener(`close`, (event) => {
  console.log(event.reason);
});

socket.addEventListener(`error`, (event) => {
  console.error(event);
});

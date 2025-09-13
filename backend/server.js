const Fastify = require("fastify");
const fastifyWebsocket = require("@fastify/websocket");
const WebSocketHandler = require('./WebSocketHandler');

// Initialize Fastify server
const fastify = Fastify();
fastify.register(fastifyWebsocket);

// Setup WebSocket handling
const wsHandler = new WebSocketHandler(fastify);
wsHandler.setupWebSocket();

// Start the game update loop
wsHandler.startGameUpdateLoop();

fastify.listen({ port: 3001, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server running at ${address}`);
});
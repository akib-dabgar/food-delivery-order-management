import { createApp } from "./app.js";
import { config } from "./config.js";
import { stopAllStatusProgressions } from "./services/statusSimulator.js";

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
  console.log(`Status step interval: ${config.statusStepMs}ms`);
});

function shutdown(signal: string): void {
  console.log(`Received ${signal}, shutting down`);
  stopAllStatusProgressions();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

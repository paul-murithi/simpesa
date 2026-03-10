import "dotenv/config";
import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "test" ? "silent" : "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
});

export { logger };

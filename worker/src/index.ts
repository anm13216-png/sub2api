import { Hono } from "hono";
import { cors } from "hono/cors";
import v1 from "./routes/v1";
import auth from "./routes/auth";
import { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization", "x-api-key"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// 健康检查
app.get("/", (c) => c.text("Sub2API Cloudflare Worker Gateway is Running!"));

// API 路由挂载 (兼容前端各种 /api/v1/auth 和 /v1/auth)
app.route("/api/v1/auth", auth);
app.route("/v1/auth", auth);
app.route("/auth", auth);

app.route("/api/v1", v1);
app.route("/v1", v1);

export default app;

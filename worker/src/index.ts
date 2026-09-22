import { Hono } from "hono";
import { cors } from "hono/cors";
import v1 from "./routes/v1";
import auth from "./routes/auth";
import { Env } from "./types";

const app = new Hono<{ Bindings: Env }>();

// 开启全局 CORS，支持 OPTIONS 预检请求与所有 Headers
app.use("*", cors({
  origin: (origin) => origin || "*",
  allowHeaders: ["Content-Type", "Authorization", "x-api-key", "X-Admin-UI-Request", "X-User-UI-Request", "Accept-Language"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
  credentials: true,
}));

// 处理所有 OPTIONS 预检请求
app.options("*", (c) => c.text("OK", 200));

// 健康检查
app.get("/", (c) => c.text("Sub2API Cloudflare Worker Gateway is Running!"));

// API 路由挂载
app.route("/api/v1/auth", auth);
app.route("/v1/auth", auth);
app.route("/auth", auth);

app.route("/api/v1", v1);
app.route("/v1", v1);

export default app;

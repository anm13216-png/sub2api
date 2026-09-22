import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { Env } from "../types";

const auth = new Hono<{ Bindings: Env }>();

// 默认固定的管理员账号密码
const DEFAULT_ADMIN_EMAIL = "admin@sub2api.local";
const DEFAULT_ADMIN_PASSWORD = "password";

// SHA-256 哈希辅助函数
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 确保默认管理员账号存在
async function ensureDefaultAdmin(env: Env) {
  const db = drizzle(env.DB);
  const existingAdmins = await db.select().from(users).where(eq(users.role, "admin")).limit(1);

  if (existingAdmins.length === 0) {
    const passHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    await db.insert(users).values({
      id: crypto.randomUUID(),
      username: DEFAULT_ADMIN_EMAIL,
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: passHash,
      role: "admin",
      status: "active",
      createdAt: new Date(),
    }).run();
  }
}

// 登录接口
auth.post("/login", async (c) => {
  await ensureDefaultAdmin(c.env);

  const body = await c.req.json().catch(() => ({}));
  const account = body.email || body.username || body.account;
  const password = body.password;

  if (!account || !password) {
    return c.json({ error: { message: "账号和密码不能为空", type: "invalid_request_error" } }, 400);
  }

  const db = drizzle(c.env.DB);
  const passHash = await hashPassword(password);

  // 查询用户
  const foundUsers = await db.select().from(users).where(eq(users.username, account)).limit(1);
  const user = foundUsers[0];

  if (!user || user.passwordHash !== passHash) {
    return c.json({ error: { message: "账号或密码错误", type: "invalid_credentials" } }, 401);
  }

  const token = "sk-" + user.role + "-" + crypto.randomUUID();
  await c.env.CACHE_KV.put("token:" + token, JSON.stringify({ userId: user.id, role: user.role, username: user.username }));

  return c.json({
    code: 0,
    message: "登录成功",
    data: {
      access_token: token,
      token_type: "Bearer",
      user: { id: user.id, username: user.username, role: user.role }
    }
  });
});

// 账号密码修改逻辑
auth.put("/change-password", async (c) => {
  const authHeader = c.req.header("Authorization");
  const token = authHeader ? authHeader.replace("Bearer ", "") : "";
  if (!token) return c.json({ error: { message: "未登录", type: "unauthorized" } }, 401);

  const sessionData = await c.env.CACHE_KV.get("token:" + token);
  if (!sessionData) return c.json({ error: { message: "会话已过期", type: "unauthorized" } }, 401);

  const session = JSON.parse(sessionData);
  const { old_password, new_password } = await c.req.json().catch(() => ({}));

  if (!old_password || !new_password) {
    return c.json({ error: { message: "旧密码与新密码不能为空" } }, 400);
  }

  const db = drizzle(c.env.DB);
  const userList = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  const user = userList[0];

  const oldHash = await hashPassword(old_password);
  if (user.passwordHash !== oldHash) {
    return c.json({ error: { message: "旧密码错误" } }, 400);
  }

  const newHash = await hashPassword(new_password);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, session.userId)).run();

  return c.json({ message: "密码修改成功" });
});

export default auth;

import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "../db/schema";
import { Env } from "../types";

const auth = new Hono<{ Bindings: Env }>();

// 辅助 SHA-256 哈希函数
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// 任意账号/密码首次登入自动设为管理员
auth.post("/login", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const account = body.email || body.username || body.account;
  const password = body.password;

  if (!account || !password) {
    return c.json({ error: { message: "账号和密码不能为空", type: "invalid_request_error" } }, 400);
  }

  const db = drizzle(c.env.DB);
  
  // 1. 检查数据库中是否存在管理员账号
  const existingAdmins = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  const passHash = await hashPassword(password);

  if (existingAdmins.length === 0) {
    // 首次登入：自动将当前输入的任意账号和密码注册并设定为管理员
    const newAdminId = crypto.randomUUID();
    const now = new Date();

    await db.insert(users).values({
      id: newAdminId,
      username: account,
      email: account,
      passwordHash: passHash,
      role: "admin",
      status: "active",
      createdAt: now,
    }).run();

    const token = "sk-admin-" + crypto.randomUUID();
    await c.env.CACHE_KV.put("token:" + token, JSON.stringify({ userId: newAdminId, role: "admin", username: account }));

    return c.json({
      access_token: token,
      token_type: "Bearer",
      user: { id: newAdminId, username: account, role: "admin" },
      message: "首次登录成功，已自动将此账号密码初始化为管理员"
    });
  }

  // 2. 非首次登录：正常校验账号与密码
  const foundUsers = await db.select().from(users).where(eq(users.username, account)).limit(1);
  const user = foundUsers[0];

  if (!user || user.passwordHash !== passHash) {
    return c.json({ error: { message: "账号或密码错误", type: "invalid_credentials" } }, 401);
  }

  const token = "sk-" + user.role + "-" + crypto.randomUUID();
  await c.env.CACHE_KV.put("token:" + token, JSON.stringify({ userId: user.id, role: user.role, username: user.username }));

  return c.json({
    access_token: token,
    token_type: "Bearer",
    user: { id: user.id, username: user.username, role: user.role }
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

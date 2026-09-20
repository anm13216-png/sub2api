import { drizzle } from 'drizzle-orm/d1';
import { eq, and, notInArray, SQL } from 'drizzle-orm';
import { accounts } from '../db/schema';
import { Env } from '../types';

export async function pickAvailableAccount(env: Env, platform: string) {
  const db = drizzle(env.DB);

  const cooldownKeys = await env.CACHE_KV.list({ prefix: 'cooldown:' });
  const coolingAccountIds = cooldownKeys.keys.map(k => k.name.replace('cooldown:', ''));

  const conditions: SQL[] = [
    eq(accounts.platform, platform),
    eq(accounts.status, 'active')
  ];

  if (coolingAccountIds.length > 0) {
    conditions.push(notInArray(accounts.id, coolingAccountIds));
  }

  const result = await db.select()
    .from(accounts)
    .where(and(...conditions))
    .orderBy(accounts.lastUsedAt)
    .limit(1);

  const selectedAccount = result[0] || null;

  if (selectedAccount) {
    env.DB.prepare('UPDATE accounts SET last_used_at = ? WHERE id = ?')
      .bind(Math.floor(Date.now() / 1000), selectedAccount.id)
      .run();
  }

  return selectedAccount;
}

export async function markAccountCooldown(env: Env, accountId: string, ttlSeconds = 60) {
  await env.CACHE_KV.put('cooldown:' + accountId, 'true', { expirationTtl: ttlSeconds });
}
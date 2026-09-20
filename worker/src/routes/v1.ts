import { Hono } from 'hono';
import { pickAvailableAccount, markAccountCooldown } from '../services/account';
import { Env, AccountCredentials } from '../types';

const v1 = new Hono<{ Bindings: Env }>();

// 1. OpenAI Chat Completions 兼容接口
v1.post('/chat/completions', async (c) => {
  const authHeader = c.req.header('Authorization');
  const apiKey = authHeader ? authHeader.replace('Bearer ', '') : '';
  if (!apiKey) return c.json({ error: { message: 'Unauthorized', type: 'invalid_request_error' } }, 401);

  const account = await pickAvailableAccount(c.env, 'openai');
  if (!account) {
    return c.json({ error: { message: 'No available upstream OpenAI accounts', type: 'api_error' } }, 503);
  }

  const credentials: AccountCredentials = JSON.parse(account.credentialsJson);
  const targetUrl = (credentials.baseUrl || 'https://api.openai.com') + '/v1/chat/completions';

  const upstreamResponse = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer ' + (credentials.apiKey || credentials.accessToken || ''),
    },
    body: await c.req.raw.text(),
  });

  if (upstreamResponse.status === 429) {
    await markAccountCooldown(c.env, account.id, 60);
    return c.json({ error: { message: 'Upstream rate limited', type: 'rate_limit_error' } }, 429);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      'content-type': upstreamResponse.headers.get('content-type') || 'application/json',
      'cache-control': 'no-cache',
    },
  });
});

// 2. Anthropic Claude Messages 兼容接口
v1.post('/messages', async (c) => {
  const authHeader = c.req.header('Authorization');
  const apiKey = (authHeader ? authHeader.replace('Bearer ', '') : '') || c.req.header('x-api-key');
  if (!apiKey) return c.json({ error: { message: 'Unauthorized', type: 'authentication_error' } }, 401);

  const account = await pickAvailableAccount(c.env, 'claude');
  if (!account) {
    return c.json({ error: { message: 'No available upstream Claude accounts', type: 'api_error' } }, 503);
  }

  const credentials: AccountCredentials = JSON.parse(account.credentialsJson);
  const targetUrl = (credentials.baseUrl || 'https://api.anthropic.com') + '/v1/messages';

  const upstreamResponse = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': credentials.apiKey || credentials.accessToken || '',
      'anthropic-version': c.req.header('anthropic-version') || '2023-06-01',
    },
    body: await c.req.raw.text(),
  });

  if (upstreamResponse.status === 429) {
    await markAccountCooldown(c.env, account.id, 60);
    return c.json({ error: { message: 'Upstream rate limited', type: 'rate_limit_error' } }, 429);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: {
      'content-type': upstreamResponse.headers.get('content-type') || 'text/event-stream',
      'cache-control': 'no-cache',
    },
  });
});

export default v1;
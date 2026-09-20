export interface Env {
  DB: D1Database;
  CACHE_KV: KVNamespace;
}

export interface AccountCredentials {
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
}

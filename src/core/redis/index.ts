// Redis es opcional — si no hay credenciales, usa un mock en memoria
// En producción con Upstash configurado, se activa automáticamente

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Mock en memoria para desarrollo/hackathon sin Redis
const memoryStore = new Map<string, { value: unknown; expiresAt?: number }>();

const mockRedis = {
  get: async <T>(key: string): Promise<T | null> => {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value as T;
  },
  set: async (key: string, value: unknown) => {
    memoryStore.set(key, { value });
    return "OK";
  },
  setex: async (key: string, ttl: number, value: unknown) => {
    memoryStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    return "OK";
  },
  del: async (...keys: string[]) => {
    keys.forEach((k) => memoryStore.delete(k));
    return keys.length;
  },
  keys: async (pattern: string) => {
    const regex = new RegExp(pattern.replace("*", ".*"));
    return Array.from(memoryStore.keys()).filter((k) => regex.test(k));
  },
};

async function getRedis() {
  if (!hasRedis) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

// Instancia lazy del Redis real
let _redis: Awaited<ReturnType<typeof getRedis>> = null;
async function getClient() {
  if (!hasRedis) return mockRedis;
  if (!_redis) _redis = await getRedis();
  return _redis ?? mockRedis;
}

export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const client = await getClient();
    return client.get<T>(key);
  },
  set: async (key: string, value: unknown, ttlSeconds?: number) => {
    const client = await getClient();
    if (ttlSeconds) return client.setex(key, ttlSeconds, value);
    return client.set(key, value);
  },
  del: async (key: string) => {
    const client = await getClient();
    return client.del(key);
  },
  invalidatePattern: async (pattern: string) => {
    const client = await getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) await client.del(...keys);
  },
};

// Rate limiters — no-op si no hay Redis (aceptable para hackathon)
export const authRatelimit = {
  limit: async (_id: string) => ({ success: true, remaining: 99 }),
};
export const quizRatelimit = {
  limit: async (_id: string) => ({ success: true, remaining: 99 }),
};
export const apiRatelimit = {
  limit: async (_id: string) => ({ success: true, remaining: 99 }),
};

export const CACHE_KEYS = {
  courseRanking: (categorySlug?: string) =>
    `course:ranking:${categorySlug ?? "all"}`,
  courseDetail: (slug: string) => `course:detail:${slug}`,
  userProfile: (username: string) => `user:profile:${username}`,
} as const;

export const CACHE_TTL = {
  courseRanking: 600,
  courseDetail: 300,
  userProfile: 120,
} as const;

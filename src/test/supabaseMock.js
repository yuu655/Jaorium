import { vi } from "vitest";

/**
 * Builds a chainable Supabase query-builder mock.
 * Every non-terminal method returns the chain itself; `.single()` /
 * `.maybeSingle()` resolve `result`, and the chain itself is awaitable
 * (mirrors the real PostgrestBuilder being thenable) so callers that
 * skip `.single()` (e.g. `.update().eq()`) still get `result` back.
 */
export function createChain(result = { data: null, error: null }) {
  const chainMethods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "in",
    "is",
    "order",
    "limit",
    "range",
    "match",
    "filter",
    "or",
    "not",
  ];
  const chain = {};
  chainMethods.forEach((name) => {
    chain[name] = vi.fn(() => chain);
  });
  chain.single = vi.fn(async () => result);
  chain.maybeSingle = vi.fn(async () => result);
  chain.select = vi.fn(() => chain);
  chain.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return chain;
}

/**
 * Builds a fake Supabase client. `from` maps table name -> either a chain
 * object (via createChain) or a factory function () => chain, so a test can
 * return different results across repeated calls to the same table.
 */
export function createSupabaseMock({ from = {}, auth = {}, rpc } = {}) {
  return {
    from: vi.fn((table) => {
      const entry = from[table];
      if (typeof entry === "function") return entry();
      return entry ?? createChain();
    }),
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: null })),
      signUp: vi.fn(async () => ({ data: { user: null }, error: null })),
      signInWithOtp: vi.fn(async () => ({ data: {}, error: null })),
      updateUser: vi.fn(async () => ({ data: {}, error: null })),
      admin: {
        deleteUser: vi.fn(async () => ({ error: null })),
        getUserById: vi.fn(async () => ({ data: { user: null }, error: null })),
      },
      ...auth,
    },
    rpc: rpc ?? vi.fn(async () => ({ data: null, error: null })),
  };
}

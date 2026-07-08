import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ mocked: true })) }));

import { createClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "./admin";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_SECRET_KEY", "service-role-key");
});

describe("createAdminSupabaseClient", () => {
  it("creates a Supabase client using the project URL and service-role key", () => {
    const client = createAdminSupabaseClient();

    expect(createClient).toHaveBeenCalledWith("https://example.supabase.co", "service-role-key");
    expect(client).toEqual({ mocked: true });
  });
});

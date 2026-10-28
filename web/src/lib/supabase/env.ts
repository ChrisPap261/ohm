/** Prefer publishable key; accept legacy anon env name for compatibility. */
export function getSupabasePublishableKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    ""
  );
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseUrl().length > 0 && getSupabasePublishableKey().length > 0;
}

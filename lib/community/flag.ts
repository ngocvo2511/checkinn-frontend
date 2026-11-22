/**
 * Build-time switch for every community route and entry point. Next.js inlines the value,
 * so changing it requires a rebuild.
 */
export const COMMUNITY_ENABLED = process.env.NEXT_PUBLIC_COMMUNITY_ENABLED === 'true';

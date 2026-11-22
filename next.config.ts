import type { NextConfig } from "next";

// Cache Components / Partial Prefetching are deliberately off: every v1 page and
// API route serves live, uncached queue data (see ARCHITECTURE.md, "Realtime").
const nextConfig: NextConfig = {};

export default nextConfig;

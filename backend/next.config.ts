import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pin the workspace root to this backend directory so Turbopack doesn't
  // infer the monorepo root (which has its own package-lock.json) when
  // multiple lockfiles are present in the goldfish repo.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

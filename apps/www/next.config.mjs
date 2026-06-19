/**
 * Static export so the whole site (docs + registry under /r) can be hosted on
 * GitHub Pages or any static host. Set `BASE_PATH=/<repo>` when deploying to a
 * GitHub project page; leave empty for local dev and user/organization pages.
 */
const basePath = process.env.BASE_PATH ?? '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;

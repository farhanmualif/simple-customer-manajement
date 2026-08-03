/** @type {import('next').NextConfig} */
const nextConfig = {
  // VPS-friendly: tidak ada asumsi serverless-only
  output: undefined, // default = Node.js server, cocok untuk VPS
};

export default nextConfig;

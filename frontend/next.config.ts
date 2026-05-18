import type { NextConfig } from "next";
import os from "os";

// Helper to get local IP address automatically
const getLocalExternalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]!) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
};

const localIP = getLocalExternalIP();

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: localIP
    ? ["localhost:3000", localIP, `${localIP}:3000`]
    : ["localhost:3000"],
};

export default nextConfig;

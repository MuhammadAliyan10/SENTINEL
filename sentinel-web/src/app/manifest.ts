import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sentinel Access Pass",
    short_name: "Sentinel",
    description: "University Access Control System - Student Pass",
    start_url: "/student",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1E40AF",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icons/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/favicon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}

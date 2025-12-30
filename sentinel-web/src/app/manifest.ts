import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UOL Sentinel - Access Control System",
    short_name: "UOL Sentinel",
    description: "University of Lahore Access Control & Pass Management System",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#4f39f6",
    orientation: "portrait",
    icons: [
      {
        src: "/uol.png",
        sizes: "any",
        type: "image/png",
      },
      {
        src: "/icons/uol-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/icons/uol-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icons/uol-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/uol-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    categories: ["education", "productivity"],
    shortcuts: [
      {
        name: "Student Login",
        url: "/login",
        description: "Login as a student",
      },
      {
        name: "Manager Dashboard",
        url: "/manager/dashboard",
        description: "Access manager dashboard",
      },
    ],
  };
}

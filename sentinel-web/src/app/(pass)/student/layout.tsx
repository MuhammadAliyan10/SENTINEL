export const metadata = {
  title: "Sentinel Pass",
  description: "Your university access pass",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sentinel",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

import StudentBottomNav from "@/components/features/student/StudentBottomNav";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 to-white pb-20">
      {children}
      <StudentBottomNav />
    </div>
  );
}

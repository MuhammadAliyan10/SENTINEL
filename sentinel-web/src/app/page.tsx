// import Link from "next/link";
// import { Shield, Users, Ticket, ShieldAlert } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { createClient } from "@/lib/supabase/server";
// import { prisma } from "@/lib/prisma";
// import { redirect } from "next/navigation";
// import { SecretAccess } from "@/components/features/landing/SecretAccess";

// export default async function HomePage() {
//   // Check for existing session and redirect if found
//   const supabase = await createClient();
//   const {
//     data: { user: supabaseUser },
//   } = await supabase.auth.getUser();

//   if (supabaseUser) {
//     const user = await prisma.user.findUnique({
//       where: { id: supabaseUser.id },
//       select: { role: true },
//     });

//     if (user) {
//       switch (user.role) {
//         case "SUPER_ADMIN":
//           redirect("/admin");
//         case "CR":
//         case "GR":
//           redirect("/manager/dashboard");
//         case "STUDENT":
//           redirect("/student");
//       }
//     }
//   }
//   return (
//     <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
//       <div className="w-full max-w-3xl space-y-10">
//         {/* Header */}
//         <div className="text-center space-y-4">
//           <div className="flex justify-center">
//             <SecretAccess />
//           </div>
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">SENTINEL</h1>
//             <p className="text-muted-foreground font-medium">
//               University Access Control System
//             </p>
//           </div>
//         </div>

//         {/* Student Portal (Primary Card) */}
//         <div className="flex justify-center">
//           <Card className="w-full max-w-sm border-2 border-muted hover:border-primary/50 hover:shadow-lg transition-all duration-300">
//             <CardHeader className="text-center">
//               <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
//                 <Ticket className="w-8 h-8 text-primary" />
//               </div>
//               <CardTitle className="text-xl font-bold">
//                 Student Portal
//               </CardTitle>
//               <CardDescription>Access your digital pass</CardDescription>
//             </CardHeader>
//             <CardContent>
//               <Button asChild className="w-full bg-primary hover:bg-primary/90">
//                 <Link href="/login">Open Digital Pass</Link>
//               </Button>
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }
import Link from "next/link";
import { Shield, Users, Ticket, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SecretAccess } from "@/components/features/landing/SecretAccess";

export default async function HomePage() {
  // Check for existing session and redirect if found
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (supabaseUser) {
    const user = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
      select: { role: true },
    });

    if (user) {
      switch (user.role) {
        case "SUPER_ADMIN":
          redirect("/admin");
        case "CR":
        case "GR":
          redirect("/manager/dashboard");
        case "STUDENT":
          redirect("/student");
      }
    }
  }
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <SecretAccess />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SENTINEL</h1>
            <p className="text-muted-foreground font-medium">
              University Access Control System
            </p>
          </div>
        </div>

        {/* Student Portal (Primary Card) */}
        <div className="flex flex-col items-center space-y-4">
          <Card className="w-full max-w-sm border-2 border-muted hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Ticket className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold">
                Student Portal
              </CardTitle>
              <CardDescription>Access your digital pass</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link href="/login">Open Digital Pass</Link>
              </Button>
            </CardContent>
          </Card>

          {/* About Developers Link */}
          <Link
            href="/about-developers"
            className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4"
          >
            About the Developers
          </Link>
        </div>
      </div>
    </div>
  );
}

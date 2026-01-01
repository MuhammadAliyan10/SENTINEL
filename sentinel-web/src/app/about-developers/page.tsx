// "use client";

// import Image from "next/image";
// import Link from "next/link";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { CometCard } from "@/components/ui/comet-card";
// import {
//   ArrowLeft,
//   Github,
//   Linkedin,
//   Mail,
//   Crown,
//   Code2,
//   Smartphone,
// } from "lucide-react";

// const developers = [
//   {
//     name: "Muhammad Aliyan Nadeem",
//     role: "Team Leader & Senior Software Engineer",
//     university: "University of Lahore, Sargodha Campus",
//     semester: "Semester 7th • Section A",
//     bio: "Never talk to a woman.",
//     description:
//       "Built the architecture, planned the implementation, and led the entire development process.",
//     image: "/developers/Aliyan.jpeg",
//     github: "https://github.com/MuhammadAliyan10",
//     linkedin: "https://www.linkedin.com/in/muhammad-aliyan-1900a7275/",
//     email: "aliyannadeem10@gmail.com",
//     icon: Crown,
//     isLeader: true,
//   },
//   {
//     name: "Muhammad Hashir Abdullah",
//     role: "Lead Web Software Engineer",
//     university: "University of Lahore, Sargodha Campus",
//     semester: "Semester 7th • Section A",
//     bio: "Never rejected in his entire life.",
//     description:
//       "Spearheaded the web application development with cutting-edge technologies.",
//     image: "/developers/Hashir.jpeg",
//     github: "https://github.com/MHashirAbdullah",
//     linkedin: "https://www.linkedin.com/in/muhammad-hashir-abdullah-2b7271240",
//     email: "hashirabdullah46@gmail.com",
//     icon: Code2,
//     isLeader: false,
//   },
//   {
//     name: "Zeeshan Ahmad",
//     role: "Lead App Software Engineer",
//     university: "University of Lahore, Sargodha Campus",
//     semester: "Semester 7th • Section A",
//     bio: "He is our coach who got played before.",
//     description:
//       "Crafted the mobile application with seamless user experience.",
//     image: "/developers/Zeeshan.jpeg",
//     github: "https://github.com/Zeeshier",
//     linkedin: "https://www.linkedin.com/in/zeeshier",

//     email: "zeeshanwarraich51@gmail.com",
//     icon: Smartphone,
//     isLeader: false,
//   },
// ];

// export default function AboutDevelopersPage() {
//   return (
//     <div className="min-h-screen bg-linear-to-b from-slate-50 to-white">
//       {/* Header */}
//       <header className="bg-primary text-white">
//         <div className="container mx-auto px-4 py-4">
//           <Button
//             variant="ghost"
//             size="sm"
//             asChild
//             className="text-white/80 hover:text-white hover:bg-white/10"
//           >
//             <Link href="/">
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Home
//             </Link>
//           </Button>
//         </div>
//         <div className="container mx-auto px-4 pb-16 pt-8 text-center">
//           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
//             <span className="font-semibold">🏴‍☠️ Bounty Hunters</span>
//           </div>
//           <h1 className="text-3xl md:text-4xl font-bold mb-2">
//            Meet the Minds Behind SENTINEL
//           </h1>
//           <p className="text-white/80 text-lg">
//             A focused engineering team building secure, scalable and reliable access management systems.
//           </p>
//         </div>
//       </header>

//       {/* Team Section */}
//       <section className="container mx-auto px-4 py-16 -mt-8">
//         <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
//           {developers.map((dev, index) => (
//             <CometCard key={index} rotateDepth={12} translateDepth={15}>
//               <div
//                 className={`bg-white rounded-2xl overflow-hidden border ${
//                   dev.isLeader ? "border-primary/30" : "border-slate-200"
//                 }`}
//               >
//                 {/* Image Section */}
//                 <div className="relative h-64 bg-slate-50 flex items-center justify-center">
//                   {dev.image ? (
//                     <Image
//                       src={dev.image}
//                       alt={dev.name}
//                       fill
//                       className="object-cover"
//                       // sizes="(max-width: 768px) 100vw, 33vw"
//                     />
//                   ) : (
//                     <div className="absolute inset-0 flex items-center justify-center">
//                       <span className="text-6xl font-bold text-primary/20">
//                         {dev.name
//                           .split(" ")
//                           .map((n) => n[0])
//                           .join("")}
//                       </span>
//                     </div>
//                   )}

//                   <div className="absolute bottom-3 right-3">
//                     <div className="p-2 rounded-full bg-white/90 shadow-sm">
//                       <dev.icon className="h-5 w-5 text-primary" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Content Section */}
//                 <div className="p-5">
//                   <h2 className="text-lg font-bold text-foreground mb-1">
//                     {dev.name}
//                   </h2>
//                   <p className="text-primary font-semibold text-sm mb-3">
//                     {dev.role}
//                   </p>

//                   <div className="space-y-1 text-xs text-muted-foreground mb-3">
//                     <p className="flex items-center gap-1.5">
//                       <span>•</span> {dev.university}
//                     </p>
//                     <p className="flex items-center gap-1.5">
//                       <span>•</span> {dev.semester}
//                     </p>
//                   </div>

//                   <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
//                     {dev.description}
//                   </p>

//                   <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground text-xs mb-4">
//                     "{dev.bio}"
//                   </blockquote>

//                   {/* Social Links */}
//                   <div className="flex items-center gap-2">
//                     <a
//                       href={dev.github}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="p-2 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-colors"
//                     >
//                       <Github className="h-4 w-4" />
//                     </a>
//                     {dev.linkedin && (
//                       <a
//                         href={dev.linkedin}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="p-2 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-colors"
//                       >
//                         <Linkedin className="h-4 w-4" />
//                       </a>
//                     )}
//                     <a
//                       href={`mailto:${dev.email}`}
//                       className="p-2 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-colors"
//                     >
//                       <Mail className="h-4 w-4" />
//                     </a>
//                   </div>
//                 </div>
//               </div>
//             </CometCard>
//           ))}
//         </div>
//       </section>

//       {/* About Project Section */}
//       <section className="bg-primary/5 border-y">
//         <div className="container mx-auto px-4 py-12 text-center">
//           <h3 className="text-xl font-bold text-foreground mb-4">
//             About SENTINEL
//           </h3>
//           <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
//             SENTINEL is a comprehensive event access management system built for
//             the Department of Computer Science Annual Dinner 2026. It provides
//             secure QR-based entry verification, real-time attendance tracking,
//             and seamless check-in/check-out functionality through both web and
//             mobile platforms.
//           </p>
//           <div className="flex flex-wrap justify-center gap-2">
//             <Badge variant="default" className="px-3 py-1">
//               Next.js 15
//             </Badge>
//             <Badge variant="default" className="px-3 py-1">
//               React Native
//             </Badge>
//             <Badge variant="default" className="px-3 py-1">
//               Supabase
//             </Badge>
//             <Badge variant="default" className="px-3 py-1">
//               Prisma
//             </Badge>
//             <Badge variant="default" className="px-3 py-1">
//               TypeScript
//             </Badge>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-primary text-white py-6">
//         <div className="container mx-auto px-4 text-center">
//           <p className="text-sm text-white/80">
//             © 2024-2026 Bounty Hunters • Department of Computer Science,
//             University of Lahore
//           </p>
//           <p className="text-xs text-white/60 mt-1">
//             Built by Bounty Hunters for DCS Annual Dinner 2026
//           </p>
//         </div>
//       </footer>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Github,
  Linkedin,
  Mail,
  Crown,
  Code2,
  Smartphone,
  Star,
} from "lucide-react";

const developers = [
  {
    name: "Muhammad Aliyan Nadeem",
    role: "Team Leader & Senior Software Engineer",
    university: "University of Lahore, Sargodha Campus",
    semester: "Semester 7th • Section A",
    bio: "2004 | Polymath",
    description:
      "Built the architecture, planned the implementation, and led the entire development process.",
    image: "/developers/Aliyan.jpg",
    github: "https://github.com/MuhammadAliyan10",
    linkedin: "https://www.linkedin.com/in/muhammad-aliyan-1900a7275/",
    email: "aliyannadeem10@gmail.com",
    icon: Crown,
    isLeader: true,
    imagePosition: "center top",
  },
  {
    name: "Muhammad Hashir Abdullah",
    role: "Lead Web Software Engineer",
    university: "University of Lahore, Sargodha Campus",
    semester: "Semester 7th • Section A",
    bio: "A true tech enthusiast living on the cutting edge.",
    description:
      "Spearheaded the web application development with cutting-edge technologies.",
    image: "/developers/Hashir.jpg",
    github: "https://github.com/MHashirAbdullah",
    linkedin: "https://www.linkedin.com/in/muhammad-hashir-abdullah-2b7271240",
    email: "hashirabdullah46@gmail.com",
    icon: Code2,
    isLeader: false,
    imagePosition: "center top",
  },

  {
    name: "Zeeshan Ahmad",
    role: "Lead App Software Engineer",
    university: "University of Lahore, Sargodha Campus",
    semester: "Semester 7th • Section A",
    bio: "Deeply involved in the world of AI.",
    description:
      "Crafted the mobile application with seamless user experience.",
    image: "/developers/Zeeshan.png",
    github: "https://github.com/Zeeshier",
    linkedin: "https://www.linkedin.com/in/zeeshier",
    email: "zeeshanwarraich51@gmail.com",
    icon: Smartphone,
    isLeader: false,
    imagePosition: "center top",
  },
];

const techStack = [
  "Next.js 16",
  "React Native",
  "Supabase",
  "Prisma",
  "TypeScript",
  "Tailwind CSS",
  "PostgreSQL",
  "REST API",
];

export default function AboutDevelopersPage() {
  const [mounted, setMounted] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      {/* Header */}
      <header className="relative bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent to-blue-900/20" />

        <div className="relative container mx-auto px-4 py-4">
          <button
            onClick={() => window.history.back()}
            className="group flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
        </div>

        <div
          className={`relative container mx-auto px-4 pb-20 pt-12 text-center transition-all duration-1000 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-6">
            <span className="font-semibold text-sm">BOUNTY HUNTERS</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-white to-blue-100">
            Meet the Minds Behind SENTINEL
          </h1>

          <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            A focused engineering team building secure, scalable and reliable
            access management systems for the future.
          </p>

          {/* Decorative Elements */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent" />
        </div>
      </header>

      {/* Team Section */}
      <section className="relative container mx-auto px-4 py-20 -mt-12">
        <div className="grid gap-8 md:grid-cols-3 max-w-7xl mx-auto">
          {developers.map((dev, index) => (
            <div
              key={index}
              className={`transition-all duration-700 ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-20"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onMouseEnter={() => setActiveCard(index)}
              onMouseLeave={() => setActiveCard(null)}
            >
              <div
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border-2 ${
                  dev.isLeader
                    ? "border-yellow-400/50 hover:border-yellow-400"
                    : "border-slate-200 hover:border-blue-400"
                } ${activeCard === index ? "scale-105" : ""}`}
              >
                {/* Leader Badge */}
                {dev.isLeader && (
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-linear-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold shadow-lg animate-pulse">
                    <Crown className="h-3.5 w-3.5" />
                    <span>TEAM LEADER</span>
                  </div>
                )}

                {/* Image Section */}
                <div className="relative h-72 bg-linear-to-br from-slate-100 to-slate-200 overflow-hidden">
                  {dev.image ? (
                    <img
                      src={dev.image}
                      alt={dev.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      style={{ objectPosition: dev.imagePosition ?? "center" }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl font-bold text-blue-600/20">
                        {dev.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )}

                  {/* linear Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Icon Badge */}
                  <div className="absolute bottom-4 right-4 p-3 rounded-full bg-white shadow-lg transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12">
                    <dev.icon className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {dev.name}
                    </h2>
                    <p className="text-primary font-semibold text-sm">
                      {dev.role}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-600" />
                      {dev.university}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-blue-600" />
                      {dev.semester}
                    </p>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    {dev.description}
                  </p>

                  <blockquote className="relative border-l-3 border-blue-400 pl-4 py-2 italic text-slate-600 text-sm bg-blue-50/50 rounded-r-lg">
                    {dev.bio}
                  </blockquote>

                  {/* Social Links */}
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 p-2.5 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white transition-all duration-300 flex items-center justify-center group/link"
                    >
                      <Github className="h-4 w-4 group-hover/link:scale-110 transition-transform" />
                    </a>
                    {dev.linkedin && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 p-2.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white transition-all duration-300 flex items-center justify-center group/link"
                      >
                        <Linkedin className="h-4 w-4 group-hover/link:scale-110 transition-transform" />
                      </a>
                    )}
                    <a
                      href={`mailto:${dev.email}`}
                      className="flex-1 p-2.5 rounded-lg bg-slate-100 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center group/link"
                    >
                      <Mail className="h-4 w-4 group-hover/link:scale-110 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About Project Section */}
      <section className="relative bg-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />

        <div
          className={`relative container mx-auto px-4 py-16 text-center transition-all duration-1000 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
            <span className="text-sm font-semibold">About the Project</span>
          </div>

          <h3 className="text-3xl md:text-4xl font-bold mb-6">
            SENTINEL Access Management
          </h3>

          <p className="text-white/90 text-lg max-w-3xl mx-auto mb-10 leading-relaxed">
            SENTINEL is a comprehensive event access management system built for
            the Department of Computer Science Annual Dinner 2026. It provides
            secure QR-based entry verification, real-time attendance tracking,
            and seamless check-in/check-out functionality through both web and
            mobile platforms.
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {techStack.map((tech, index) => (
              <span
                key={index}
                className={`px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium hover:bg-white/20 transition-all duration-300 cursor-default ${
                  mounted
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${800 + index * 50}ms` }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-px w-16 bg-linear-to-r from-transparent to-blue-500" />
              <div className="h-px w-16 bg-linear-to-l from-transparent to-blue-500" />
            </div>

            <p className="text-sm text-slate-400">
              © 2024-2026{" "}
              <span className="text-white font-semibold">Bounty Hunters</span> •
              Department of Computer Science, University of Lahore
            </p>
            <p className="text-xs text-slate-500">
              Built with passion for DCS Annual Dinner 2026
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .bg-grid-white\/5 {
          background-image: linear-gradient(
              to right,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.05) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}

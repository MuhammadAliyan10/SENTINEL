"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CometCard } from "@/components/ui/comet-card";
import {
  ArrowLeft,
  Github,
  Linkedin,
  Mail,
  Crown,
  Code2,
  Smartphone,
} from "lucide-react";

const developers = [
  {
    name: "Muhammad Aliyan Nadeem",
    role: "Team Leader & Senior Software Engineer",
    university: "University of Lahore, Sargodha Campus",
    semester: "Semester 7th • Section A",
    bio: "Never talk to a women.",
    description:
      "Built the architecture, planned the implementation, and led the entire development process.",
    image: "/developers/Aliyan.jpeg",
    github: "https://github.com/MuhammadAliyan10",
    linkedin: "https://www.linkedin.com/in/muhammad-aliyan-1900a7275/",
    email: "aliyannadeem10@gmail.com",
    icon: Crown,
    isLeader: true,
  },
  {
    name: "Muhammad Hashir Abdullah",
    role: "Lead Web Software Engineer",
    university: "University of Lahore, Sargodha Campus",
    semester: "Semester 7th • Section A",
    bio: "Never rejected in his entire life.",
    description:
      "Spearheaded the web application development with cutting-edge technologies.",
    image: "/developers/Hashir.jpeg",
    github: "https://github.com/MHashirAbdullah",
    linkedin: "https://www.linkedin.com/in/muhammad-hashir-abdullah-2b7271240",
    email: "hashirabdullah46@gmail.com",
    icon: Code2,
    isLeader: false,
  },
  {
    name: "Zeeshan Ahmad",
    role: "Lead App Software Engineer",
    university: "University of Lahore, Sargodha Campus",
    semester: "Semester 7th • Section A",
    bio: "He is our coach who got played before.",
    description:
      "Crafted the mobile application with seamless user experience.",
    image: "/developers/Zeeshan.jpeg",
    github: "https://github.com/Zeeshier",
    linkedin: "https://www.linkedin.com/in/zeeshier",

    email: "zeeshanwarraich51@gmail.com",
    icon: Smartphone,
    isLeader: false,
  },
];

export default function AboutDevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-primary text-white">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/80 hover:text-white hover:bg-white/10"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        <div className="container mx-auto px-4 pb-16 pt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
            <span className="font-semibold">🏴‍☠️ Bounty Hunters</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Meet the Software Engineers
          </h1>
          <p className="text-white/80 text-lg">
            The talented team of CS students who brought SENTINEL to life
          </p>
        </div>
      </header>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16 -mt-8">
        <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
          {developers.map((dev, index) => (
            <CometCard key={index} rotateDepth={12} translateDepth={15}>
              <div
                className={`bg-white rounded-2xl overflow-hidden border ${
                  dev.isLeader ? "border-primary/30" : "border-slate-200"
                }`}
              >
                {/* Image Section */}
                <div className="relative h-64 bg-slate-50 flex items-center justify-center">
                  {dev.image ? (
                    <Image
                      src={dev.image}
                      alt={dev.name}
                      fill
                      className="object-cover"
                      // sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl font-bold text-primary/20">
                        {dev.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3">
                    <div className="p-2 rounded-full bg-white/90 shadow-sm">
                      <dev.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {dev.name}
                  </h2>
                  <p className="text-primary font-semibold text-sm mb-3">
                    {dev.role}
                  </p>

                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <p className="flex items-center gap-1.5">
                      <span>•</span> {dev.university}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span>•</span> {dev.semester}
                    </p>
                  </div>

                  <p className="text-sm text-foreground/70 mb-3 line-clamp-2">
                    {dev.description}
                  </p>

                  <blockquote className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground text-xs mb-4">
                    "{dev.bio}"
                  </blockquote>

                  {/* Social Links */}
                  <div className="flex items-center gap-2">
                    <a
                      href={dev.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-colors"
                    >
                      <Github className="h-4 w-4" />
                    </a>
                    {dev.linkedin && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-colors"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    <a
                      href={`mailto:${dev.email}`}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-primary hover:text-white transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </CometCard>
          ))}
        </div>
      </section>

      {/* About Project Section */}
      <section className="bg-primary/5 border-y">
        <div className="container mx-auto px-4 py-12 text-center">
          <h3 className="text-xl font-bold text-foreground mb-4">
            About SENTINEL
          </h3>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-6">
            SENTINEL is a comprehensive event access management system built for
            the Department of Computer Science Annual Dinner 2026. It provides
            secure QR-based entry verification, real-time attendance tracking,
            and seamless check-in/check-out functionality through both web and
            mobile platforms.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="default" className="px-3 py-1">
              Next.js 15
            </Badge>
            <Badge variant="default" className="px-3 py-1">
              React Native
            </Badge>
            <Badge variant="default" className="px-3 py-1">
              Supabase
            </Badge>
            <Badge variant="default" className="px-3 py-1">
              Prisma
            </Badge>
            <Badge variant="default" className="px-3 py-1">
              TypeScript
            </Badge>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-white/80">
            © 2024-2026 Bounty Hunters • Department of Computer Science,
            University of Lahore
          </p>
          <p className="text-xs text-white/60 mt-1">
            Built by Bounty Hunters for DCS Annual Dinner 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

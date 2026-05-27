"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, History, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Generate", icon: Zap },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-primary transition-transform group-hover:scale-105">
            <Zap size={16} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold text-brand-dark tracking-tight">
              Webability
            </span>
            <span className="text-[10px] font-medium text-brand-muted tracking-wide uppercase">
              Content Engine
            </span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150",
                pathname === href
                  ? "bg-primary-bg text-primary"
                  : "text-brand-muted hover:bg-gray-50 hover:text-brand-dark"
              )}
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        {/* External link */}
        <a
          href="https://www.webability.io/blog"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-4 py-2 text-xs font-medium text-brand-muted transition-all hover:border-primary hover:text-primary"
        >
          <BookOpen size={13} strokeWidth={2} />
          webability.io/blog
        </a>
      </div>
    </header>
  );
}

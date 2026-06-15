import type { ReactNode } from "react";
import { Link } from "wouter";
import { BookOpen, ArrowLeft, type LucideIcon } from "lucide-react";
import { PublicBackground } from "./PublicBackground";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  badge?: string;
}

export function AuthShell({ children, title, subtitle, icon: Icon, badge }: AuthShellProps) {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-[42%] bg-sidebar text-sidebar-foreground flex-col justify-between p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-sidebar-primary/30" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2.5 rounded-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-serif text-2xl font-bold">Pustaka</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="font-serif text-3xl font-bold leading-tight">
            Where Knowledge Lives &amp; Stories Come Alive
          </p>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed max-w-md">
            Your trusted library companion for discovering books, managing loans, and staying connected.
          </p>
        </div>

        <p className="relative z-10 text-sidebar-foreground/50 text-sm">
          &copy; Pustaka Library Management
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <PublicBackground />
        <div className="w-full max-w-md relative z-10">
          <Link
            href="/"
            className="lg:hidden inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="font-serif text-2xl font-bold text-foreground">Pustaka</span>
          </div>

          <div className="mb-6">
            {badge && Icon && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm font-medium text-foreground mb-3">
                <Icon className="w-4 h-4 text-primary" />
                {badge}
              </div>
            )}
            <h1 className="font-serif text-3xl font-bold text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-lg p-6 sm:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

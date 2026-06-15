import { Link } from "wouter";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublicHeaderProps {
  showRegister?: boolean;
}

export function PublicHeader({ showRegister = true }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-sidebar border-b border-sidebar-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-md transition-transform group-hover:scale-105">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-serif text-xl font-bold text-sidebar-foreground">Pustaka</span>
        </Link>
        {showRegister && (
          <div className="flex items-center gap-2">
            <Link href="/register">
              <Button
                variant="ghost"
                size="sm"
                className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                Student Sign Up
              </Button>
            </Link>
            <Link href="/register/admin">
              <Button
                variant="outline"
                size="sm"
                className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                Admin Sign Up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

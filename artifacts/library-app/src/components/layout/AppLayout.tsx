import React from "react";
import { useAuth, AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";
import { Link, useLocation } from "wouter";
import { LogOut, BookOpen, Users, LayoutDashboard, Bell, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWidget } from "@/components/ChatWidget";

function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const [location] = useLocation();

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/books", label: "Catalog", icon: BookOpen },
    { href: "/transactions", label: "Transactions", icon: Library },
    { href: "/users", label: "Users", icon: Users },
  ];

  const studentLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/books", label: "Catalog", icon: BookOpen },
    { href: "/my-books", label: "My Books", icon: Library },
    { href: "/notifications", label: "Notifications", icon: Bell },
  ];

  const links = isAdmin ? adminLinks : studentLinks;

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border min-h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border flex items-center gap-3">
        <div className="bg-primary text-primary-foreground p-2 rounded-md">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="font-serif text-xl font-bold text-sidebar-foreground">Alexandria</div>
      </div>
      
      <div className="flex-1 py-6 px-4 flex flex-col gap-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location === link.href || location.startsWith(`${link.href}/`);
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="px-4 py-3 mb-2 rounded-md bg-sidebar-accent/30 text-sm">
          <div className="font-medium text-sidebar-foreground">{user?.name}</div>
          <div className="text-sidebar-foreground/70 truncate text-xs">{user?.email}</div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent/50" 
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
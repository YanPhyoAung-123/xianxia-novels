import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { PenTool, Library, History as HistoryIcon, X, Menu } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isSuccess } = useHealthCheck();

  const navItems = [
    { label: "Translator", href: "/", icon: PenTool },
    { label: "Glossaries", href: "/glossaries", icon: Library },
    { label: "History", href: "/history", icon: HistoryIcon },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-sidebar flex-col justify-between shrink-0">
        <div>
          <div className="h-16 flex items-center px-6 border-b border-border/50">
            <h1 className="text-lg font-serif font-semibold tracking-wide text-foreground flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center">
                <PenTool className="w-3.5 h-3.5" />
              </span>
              Novel Translator
            </h1>
          </div>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-2">
            <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`} />
            API Status
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-background border-b border-border flex items-center justify-between px-4">
        <h1 className="text-base font-serif font-semibold text-foreground flex items-center gap-2">
          <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center">
            <PenTool className="w-3 h-3" />
          </span>
          Novel Translator
        </h1>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`} />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-background border-t border-border flex items-stretch">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                active
                  ? "text-primary bg-primary/5"
                  : "text-muted-foreground"
              }`}
              data-testid={`mobile-nav-${item.label.toLowerCase()}`}
            >
              <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

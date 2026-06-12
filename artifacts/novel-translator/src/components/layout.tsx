import React from "react";
import { Link, useLocation } from "wouter";
import { PenTool, Library, History as HistoryIcon, Settings2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useHealthCheck } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Optional: display online/offline status subtly
  const { isSuccess } = useHealthCheck();

  const navItems = [
    { label: "Translator", href: "/", icon: PenTool },
    { label: "Glossaries", href: "/glossaries", icon: Library },
    { label: "History", href: "/history", icon: HistoryIcon },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col justify-between shrink-0">
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
              const active = location === item.href || (item.href !== "/" && location.startsWith(item.href));
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

        <div className="p-4 border-t border-border/50 space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isSuccess ? "bg-green-500" : "bg-red-500"}`} />
              API Status
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Subtle noise texture over everything */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay z-50 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        {children}
      </main>
    </div>
  );
}

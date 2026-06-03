import React from "react";
import { Link, useLocation } from "wouter";
import { Sword, Compass, LayoutDashboard, UserCircle, PlusCircle, Menu, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  const navLinks = [
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: UserCircle },
    { href: "/host", label: "Host Quest", icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold font-serif hover:text-primary transition-colors">
              <Sword className="h-6 w-6 text-primary" />
              <span>Earnity Quest</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1.5 ${
                  location === link.href ? "text-primary border-b-2 border-primary py-5" : "text-muted-foreground"
                }`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </Button>
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 glass-panel border-r-primary/20">
                <div className="flex flex-col gap-6 mt-8">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href}
                      className={`flex items-center gap-3 text-lg font-medium p-2 rounded-md ${
                        location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground"
                      }`}
                    >
                      <link.icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Button className="w-full gap-2 bg-primary hover:bg-primary/90 text-white">
                      <Wallet className="h-4 w-4" />
                      Connect Wallet
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 py-8 relative z-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sword className="h-5 w-5 text-primary" />
            <span className="font-serif font-bold text-lg">Earnity Quest</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
            Journey to Eryth. Complete epic quests, earn rare rewards, and level up your traveler rank.
          </p>
          <div className="flex justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Tome of Rules</a>
            <a href="#" className="hover:text-primary transition-colors">Guild Hall</a>
            <a href="#" className="hover:text-primary transition-colors">Lore</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

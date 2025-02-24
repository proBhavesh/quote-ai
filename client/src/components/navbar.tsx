"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession, signOut } from "next-auth/react";
import { useEffect, memo, useCallback, useRef, useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Quotes", href: "/quotes" },
  { name: "Blog", href: "/blog" },
];

function NavbarComponent() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: session,
    status,
    update,
  } = useSession({
    required: false,
    onUnauthenticated() {},
  });

  const hasLoggedMount = useRef(false);

  useEffect(() => {
    if (!hasLoggedMount.current) {
      update();
      hasLoggedMount.current = true;
    }
  }, [update]);

  const handleSignOut = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    await signOut({
      callbackUrl: `${baseUrl}/login`,
      redirect: true,
    });
  }, []);

  let authContent;
  if (status === "loading") {
    authContent = (
      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
    );
  } else if (session?.user) {
    authContent = (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-8 w-8 rounded-full ring-offset-background transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={ undefined}
                alt={session.user.name ?? "User"}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {session.user.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {session.user.name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {session.user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center cursor-pointer">
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/pricing" className="flex items-center cursor-pointer">
              Plans & Pricing
            </Link>
          </DropdownMenuItem>
          {session.user.role === "ADMIN" && (
            <DropdownMenuItem asChild>
              <Link href="/admin/blog" className="flex items-center cursor-pointer">
                Manage Blog
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer"
            onClick={handleSignOut}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else {
    authContent = (
      <Button asChild variant="default" className="font-medium shadow-sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  const mobileNav = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden hover:bg-primary/10"
          aria-label="Open main menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
            QuoteAI
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col space-y-3">
          {navigation.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            </SheetClose>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            {mobileNav}
            <div className="flex flex-shrink-0 items-center">
              <Link 
                href="/dashboard" 
                className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              >
                QuoteAI
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center sm:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-all border-b-2 hover:-translate-y-[1px] ${
                  pathname === item.href
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            {!session?.user && (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/register">Get Started</Link>
              </Button>
            )}
            {authContent}
          </div>
        </div>
      </div>
    </nav>
  );
}

export const Navbar = memo(NavbarComponent);

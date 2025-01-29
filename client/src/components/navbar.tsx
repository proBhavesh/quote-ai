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
    await signOut({
      callbackUrl: "/login",
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
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={session.user.image ?? undefined}
                alt={session.user.name ?? "User"}
              />
              <AvatarFallback>
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
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/pricing">Plans & Pricing</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={handleSignOut}
          >
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  } else {
    authContent = (
      <Button asChild variant="default">
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
          className="sm:hidden"
          aria-label="Open main menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl font-bold">QuoteAI</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col space-y-3">
          {navigation.map((item) => (
            <SheetClose asChild key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
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
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex items-center">
            {mobileNav}
            <div className="flex flex-shrink-0 items-center">
              <Link href="/dashboard" className="text-xl font-bold">
                QuoteAI
              </Link>
            </div>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-center sm:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                  pathname === item.href
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center">{authContent}</div>
        </div>
      </div>
    </nav>
  );
}

export const Navbar = memo(NavbarComponent);

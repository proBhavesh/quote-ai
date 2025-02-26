"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full h-16 border-t border-border bg-background mt-auto">
      <div className="container h-full max-w-7xl mx-auto flex items-center justify-between px-4">
        <p className="text-sm text-muted-foreground">
          Built with ❤️ by{" "}
          <a
            href="mailto:Kokov.azamat@gmail.com"
            target="_blank"
            rel="noreferrer"
            className="font-medium hover:text-foreground transition-colors"
          >
            Azamat
          </a>
        </p>
        <nav className="flex items-center space-x-6">
          <Link
            href="/contact"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </footer>
  );
} 
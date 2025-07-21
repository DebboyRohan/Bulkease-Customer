// app/components/Navbar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "../ui/button";
import { LayoutDashboard, Menu, ShoppingBag, UserCheck, X } from "lucide-react";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/*
          KEY CHANGE:
          - Removed the `container` class.
          - Added `w-full` to ensure it fills the header.
          - Added responsive horizontal padding: `px-4` on small screens, `sm:px-6` on small-and-up, `lg:px-8` on large-and-up.
        */}
        <div className="flex h-16 items-center justify-between w-full px-4 sm:px-6 lg:px-8">
          {/* Logo and Brand Name */}
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="text-lg font-bold">
              BULK<span className="text-green-600">EASE</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              href="/products" // Updated this based on your last code snippet
              className="text-foreground transition-colors hover:text-foreground/80"
            >
              <span className="flex gap-1 items-center">
                <ShoppingBag className="text-green-600" size={15} />
                Shop
              </span>
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-foreground/60 transition-colors hover:text-foreground/80"
              >
                <Button variant="outline" className="text-green-600">
                  Dashboard
                </Button>
              </Link>
            </SignedIn>
          </nav>

          {/* Right side: Auth buttons and Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="sm">Sign In</Button>
                </SignInButton>
              </SignedOut>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-50 grid gap-6 bg-background p-6 animate-in slide-in-from-top-4">
          <nav className="grid gap-4">
            <Link
              href="/products"
              className="text-lg font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              <span className="flex gap-3 items-center">
                <ShoppingBag className="text-green-600" size={15} />
                Shop
              </span>
            </Link>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-lg font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex gap-3 items-center">
                  <LayoutDashboard className="text-green-600" size={15} />
                  Dashboard
                </span>
              </Link>
            </SignedIn>
          </nav>
          <hr />
          {/* Auth buttons for Mobile */}
          <div className="flex items-center">
            <SignedIn>
              <div className="flex items-center justify-between w-full">
                <p className="font-medium">
                  <span className="flex gap-3 items-center">
                    <UserCheck className="text-green-600" size={15} />
                    My Account
                  </span>
                </p>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <Button className="w-full" onClick={() => setIsMenuOpen(false)}>
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      )}
    </>
  );
}

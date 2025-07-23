// components/Navbar.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { Button } from "../ui/button";
import {
  Menu,
  ShoppingBag,
  ShoppingCart,
  X,
  Package,
  Users,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { sessionClaims } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get user role from session claims
  const userRole = sessionClaims?.metadata?.role || "user";

  // Dashboard configuration
  const getDashboardConfig = () => {
    switch (userRole) {
      case "admin":
        return {
          url: "/admin/products",
          label: "Admin",
          icon: BarChart3,
        };
      case "sales":
        return {
          url: "/sales",
          label: "Sales",
          icon: Users,
        };
      case "user":
      default:
        return {
          url: "/orders",
          label: "Orders",
          icon: Package,
        };
    }
  };

  const dashboardConfig = getDashboardConfig();

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-200",
          isScrolled
            ? "bg-white shadow-sm border-b border-gray-200"
            : "bg-white border-b border-gray-100"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">BE</span>
              </div>
              <span className="text-xl font-bold text-gray-900">BulkEase</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center">
              <Link
                href="/products"
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                <ShoppingBag className="w-4 h-4" />
                Shop
              </Link>
            </nav>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Authenticated User Menu */}
              <SignedIn>
                {/* Cart (Desktop) */}
                <Link
                  href="/cart"
                  className="hidden sm:flex p-2 text-gray-700 hover:text-green-600 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                </Link>

                {/* Dashboard (Desktop) */}
                <Link
                  href={dashboardConfig.url}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  <dashboardConfig.icon className="w-4 h-4" />
                  {dashboardConfig.label}
                </Link>

                {/* User Button */}
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 hover:scale-105 transition-transform",
                    },
                  }}
                />
              </SignedIn>

              {/* Guest User Buttons */}
              <SignedOut>
                <div className="hidden md:flex items-center gap-2">
                  <SignInButton mode="modal">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-700 hover:text-gray-900"
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Get Started
                    </Button>
                  </SignInButton>
                </div>
              </SignedOut>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/10"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="md:hidden fixed inset-x-0 top-16 z-50 bg-white border-b border-gray-200 shadow-lg">
            <div className="p-4 space-y-4">
              {/* Shop Link */}
              <Link
                href="/products"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingBag className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Shop</span>
              </Link>

              {/* Authenticated User Links */}
              <SignedIn>
                <div className="border-t border-gray-100 pt-4 space-y-2">
                  {/* Dashboard */}
                  <Link
                    href={dashboardConfig.url}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <dashboardConfig.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">
                      {dashboardConfig.label}
                    </span>
                  </Link>

                  {/* Cart */}
                  <Link
                    href="/cart"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShoppingCart className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Cart</span>
                  </Link>
                </div>
              </SignedIn>

              {/* Guest User Buttons */}
              <SignedOut>
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <SignInButton mode="modal">
                    <Button
                      variant="outline"
                      className="w-full justify-center border-gray-300 text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignInButton mode="modal">
                    <Button
                      className="w-full justify-center bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Button>
                  </SignInButton>
                </div>
              </SignedOut>
            </div>
          </div>
        </>
      )}
    </>
  );
}

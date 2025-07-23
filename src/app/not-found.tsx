// app/not-found.tsx
"use client";
// app/not-found.tsx (Minimalist)

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Simple geometric illustration */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 relative">
            {/* Main circle */}
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="w-20 h-20 bg-blue-200 rounded-full flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-300 rounded-full flex items-center justify-center">
                  <HelpCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-6xl font-light text-gray-700 mb-2">404</div>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Page Not Found
          </h1>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>

          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

// components/Footer.tsx

import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Left Section - Address and Contact Details */}
          <div className="space-y-4 text-center md:text-left">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Contact Us
            </h3>

            {/* Address */}
            <div className="flex items-start gap-3 justify-center md:justify-start">
              <MapPin className="w-5 h-5 mt-1 text-green-600 flex-shrink-0" />
              <div className="text-gray-600">
                <p>Azad Hall</p>
                <p>IIT Kharagpur</p>
                <p>Kharagpur, West Bengal, 721302</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
              <a
                href="tel:+919430071336"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                +91 94300-71336
              </a>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <Mail className="w-5 h-5 text-green-600 flex-shrink-0" />
              <a
                href="mailto:thebulkease@gmail.com"
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                thebulkease@gmail.com
              </a>
            </div>
          </div>

          {/* Middle Section - Logo */}
          <div className="flex justify-center items-center order-first md:order-none">
            <Link href="/" className="flex flex-col items-center gap-2">
              <div className="rounded-lg flex items-center justify-center">
                <Image
                  src="/LogoWithoutBG.png"
                  height={140}
                  width={140}
                  alt="Bulkease"
                  className="hover:scale-105 transition-transform duration-300"
                />
              </div>
            </Link>
          </div>

          {/* Right Section - Social Media */}
          <div className="space-y-4 text-center md:text-right">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Follow Us
            </h3>

            <div className="flex gap-3 justify-center md:justify-end">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-600 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-400 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-pink-50 hover:text-pink-600 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t border-gray-200 mt-10 pt-8">
          <p className="text-center text-gray-500 text-sm">
            Copyright © 2025 |{" "}
            <span className="text-green-600 font-medium">BulkEase</span>. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

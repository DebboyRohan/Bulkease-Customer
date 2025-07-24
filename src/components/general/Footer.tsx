// components/Footer.tsx

"use client";

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

const socialLinks = [
  {
    name: "Facebook",
    href: "https://facebook.com/bulkease",
    icon: Facebook,
  },
  {
    name: "Twitter",
    href: "https://twitter.com/bulkease",
    icon: Twitter,
  },
  {
    name: "Instagram",
    href: "https://instagram.com/bulkease",
    icon: Instagram,
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/bulkease",
    icon: Linkedin,
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="flex items-center gap-3 group justify-center md:justify-start"
            >
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold">BE</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">BulkEase</span>
            </Link>

            <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
              Empowering students with collective buying power. Save money
              through community group purchasing.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-center md:text-left">
              Contact Us
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-3 justify-center md:justify-start">
                <div className="p-2 bg-green-600 rounded-lg flex-shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="text-gray-600 text-sm">
                  <p className="font-medium text-gray-900">
                    Azad Hall, IIT Kharagpur
                  </p>
                  <p>Kharagpur, West Bengal, 721302</p>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="p-2 bg-gray-900 rounded-lg">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <a
                  href="tel:+919430071336"
                  className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium"
                >
                  +91 94300-71336
                </a>
              </div>

              <div className="flex items-center gap-3 justify-center md:justify-start">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <a
                  href="mailto:thebulkease@gmail.com"
                  className="text-gray-600 hover:text-green-600 transition-colors text-sm font-medium"
                >
                  thebulkease@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="text-center md:text-right">
            <h4 className="font-semibold text-gray-900 mb-4">Follow Us</h4>

            <div className="flex items-center gap-3 justify-center md:justify-end">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 hover:scale-105"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>

            <p className="text-gray-600 text-sm mt-4">
              Connect with us for updates and exclusive deals
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <p className="text-gray-500 text-sm">
              © 2025{" "}
              <span className="font-semibold text-green-600">BulkEase</span>.
              All rights reserved.
            </p>

            <p className="text-gray-400 text-xs">
              Made with ❤️ for students, by students
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

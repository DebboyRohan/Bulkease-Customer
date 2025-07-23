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
    color: "hover:text-blue-600 hover:bg-blue-50",
  },
  {
    name: "Twitter",
    href: "https://twitter.com/bulkease",
    icon: Twitter,
    color: "hover:text-blue-400 hover:bg-blue-50",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/bulkease",
    icon: Instagram,
    color: "hover:text-pink-600 hover:bg-pink-50",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com/company/bulkease",
    icon: Linkedin,
    color: "hover:text-blue-700 hover:bg-blue-50",
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <Link
              href="/"
              className="flex items-center gap-3 group justify-center md:justify-start"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold">BE</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                BulkEase
              </span>
            </Link>

            <p className="text-gray-600 mt-3 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
              Empowering students with collective buying power. Save money
              through community group purchasing.
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 text-center md:text-left mb-4">
              Contact Us
            </h4>

            <div className="flex items-start gap-3 justify-center md:justify-start">
              <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-gray-600 text-sm">
                <p className="font-medium">Azad Hall, IIT Kharagpur</p>
                <p>Kharagpur, West Bengal, 721302</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Phone className="w-4 h-4 text-blue-600" />
              </div>
              <a
                href="tel:+919430071336"
                className="text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium"
              >
                +91 94300-71336
              </a>
            </div>

            <div className="flex items-center gap-3 justify-center md:justify-start">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <a
                href="mailto:thebulkease@gmail.com"
                className="text-gray-600 hover:text-purple-600 transition-colors text-sm font-medium"
              >
                thebulkease@gmail.com
              </a>
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
                  className={`p-3 bg-gray-100 text-gray-600 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-md ${social.color}`}
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
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-center md:text-left">
            <p className="text-gray-500 text-sm">
              © 2025{" "}
              <span className="font-semibold text-green-600">BulkEase</span>.
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

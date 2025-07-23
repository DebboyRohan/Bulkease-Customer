// components/home/HeroSection.tsx

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, ShoppingCart, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen bg-white overflow-hidden">
      {/* Minimal Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-green-900/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gray-900/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center min-h-screen py-20">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-green-900/10 px-4 py-2 rounded-full"
            >
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-900">
                1000+ students saving together
              </span>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight"
              >
                Community
                <br />
                <span className="text-green-600">Group Buying</span>
                <br />
                Made Simple
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-xl text-gray-600 leading-relaxed max-w-lg"
              >
                Join your college community to unlock bulk discounts. The more
                students participate, the better prices everyone gets.
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                asChild
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Link
                  href="/products"
                  className="flex items-center justify-center"
                >
                  Start Group Buying
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-6 text-lg font-medium rounded-lg transition-all duration-200"
              >
                How It Works
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-100"
            >
              <div>
                <div className="text-3xl font-bold text-gray-900">50%</div>
                <div className="text-sm text-gray-500 font-medium">
                  Average Savings
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-500 font-medium">
                  Active Students
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-900">24h</div>
                <div className="text-sm text-gray-500 font-medium">
                  Fast Delivery
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                <div className="space-y-8">
                  {/* Center Icon */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
                        <Users className="w-10 h-10 text-white" />
                      </div>

                      {/* Floating Elements */}
                      <motion.div
                        animate={{ y: [-8, 8, -8] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center"
                      >
                        <ShoppingCart className="w-3 h-3 text-white" />
                      </motion.div>

                      <motion.div
                        animate={{ y: [8, -8, 8] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute -bottom-2 -left-2 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center"
                      >
                        <TrendingDown className="w-3 h-3 text-white" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Process Steps */}
                  <div className="space-y-4">
                    {[
                      { step: "1", text: "Browse group deals", delay: 0.8 },
                      {
                        step: "2",
                        text: "Join with your community",
                        delay: 1.0,
                      },
                      { step: "3", text: "Save money together", delay: 1.2 },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: item.delay }}
                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {item.step}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Price Card */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-4 -left-4 bg-green-600 text-white p-4 rounded-xl shadow-lg"
              >
                <div className="text-sm font-bold">₹500 → ₹250</div>
                <div className="text-xs opacity-90">50% savings</div>
              </motion.div>

              {/* Floating Success Badge */}
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-4 -right-4 bg-gray-900 text-white p-4 rounded-xl shadow-lg"
              >
                <div className="text-sm font-bold">15+ orders</div>
                <div className="text-xs opacity-90">Best price unlocked</div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-5 h-8 border-2 border-gray-400 rounded-full flex justify-center mx-auto"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-2 bg-gray-400 rounded-full mt-2"
            />
          </motion.div>
          <p className="text-xs text-gray-500 mt-2">Scroll to explore</p>
        </motion.div>
      </div>
    </section>
  );
}

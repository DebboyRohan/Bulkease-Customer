// components/home/AboutSection.tsx

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Calendar,
  Lightbulb,
  Users,
  Target,
  Heart,
  Rocket,
} from "lucide-react";

const timeline = [
  {
    date: "December 2024",
    title: "The Idea",
    description:
      "Realized how much students overpay for essentials. What if we could solve this together?",
    icon: Lightbulb,
  },
  {
    date: "January 2025",
    title: "Building",
    description:
      "Passionate students came together with one mission - affordable essentials for all.",
    icon: Users,
  },
  {
    date: "March 2025",
    title: "Success",
    description:
      "First pilot saved students 40% on monthly essentials. We knew we had something special.",
    icon: Target,
  },
  {
    date: "Today",
    title: "Growing",
    description:
      "1000+ students trust BulkEase. We're revolutionizing how students shop and save.",
    icon: Rocket,
  },
];

export default function AboutSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 md:mb-20"
        >
          <div className="inline-flex items-center gap-2 bg-gray-900/10 px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4 text-gray-900" />
            <span className="text-sm font-medium text-gray-900">
              Our Journey
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            From Idea to
            <span className="text-green-600"> Impact</span>
          </h2>

          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
            Every great change starts with a simple question: "What if we could
            do this better?"
          </p>
        </motion.div>

        {/* Timeline - Desktop Version */}
        <div className="hidden lg:block relative max-w-4xl mx-auto">
          {/* Timeline Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>

          <div className="space-y-12">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className={`flex items-center ${
                  index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Content */}
                <div
                  className={`w-5/12 ${
                    index % 2 === 0 ? "text-right pr-8" : "text-left pl-8"
                  }`}
                >
                  <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 mb-3 justify-center">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500">
                        {item.date}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>

                {/* Timeline Node */}
                <div className="w-2/12 flex justify-center">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Spacer */}
                <div className="w-5/12"></div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline - Mobile & Tablet Version */}
        <div className="lg:hidden">
          <div className="relative max-w-2xl mx-auto">
            {/* Vertical Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative flex items-start"
                >
                  {/* Timeline Node */}
                  <div className="absolute left-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-sm z-10">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="ml-20 w-full">
                    <div className="bg-gray-50 p-4 md:p-6 rounded-xl border border-gray-200">
                      {/* Date Badge */}
                      <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full mb-3 border border-gray-200">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span className="text-xs md:text-sm font-medium text-gray-500">
                          {item.date}
                        </span>
                      </div>

                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gray-900 rounded-2xl p-6 md:p-12 text-center text-white mt-12 md:mt-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
            Our Mission
          </h3>
          <p className="text-base md:text-xl leading-relaxed opacity-90 mb-6 md:mb-8 max-w-3xl mx-auto px-2">
            "To empower every student with the collective buying power of their
            community, making quality products accessible and affordable for
            all."
          </p>

          <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-md mx-auto">
            <div>
              <div className="text-xl md:text-2xl font-bold text-green-400">
                1000+
              </div>
              <div className="text-xs md:text-sm opacity-75">Students</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-green-400">
                ₹50L+
              </div>
              <div className="text-xs md:text-sm opacity-75">Saved</div>
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-green-400">
                50+
              </div>
              <div className="text-xs md:text-sm opacity-75">Products</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

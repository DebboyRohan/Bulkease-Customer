// components/home/BenefitsSection.tsx

"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  TrendingDown,
  Users,
  Clock,
  Shield,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const benefits = [
  {
    icon: TrendingDown,
    title: "Better Prices",
    description: "Save up to 50% through community bulk buying power",
    stat: "Up to 50% off",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join fellow students to unlock better prices for everyone",
    stat: "1000+ students",
  },
  {
    icon: Clock,
    title: "Fast Delivery",
    description: "Quick delivery directly to your campus within 24-48 hours",
    stat: "24h delivery",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Verified products and secure payments for peace of mind",
    stat: "100% secure",
  },
];

export default function BenefitsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-green-900/10 px-4 py-2 rounded-full mb-6">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              Why BulkEase
            </span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Community Power,
            <br />
            <span className="text-green-600">Unbeatable Savings</span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            When students come together, incredible savings happen. Discover the
            power of community-driven bulk purchasing.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-white p-6 rounded-xl border border-gray-200 hover:border-green-600/20 hover:shadow-md transition-all duration-300 h-full">
                {/* Icon */}
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {benefit.title}
                    </h3>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {benefit.stat}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                {/* Hover indicator */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  className="mt-4 flex items-center text-green-600 text-sm font-medium"
                >
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-1" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* How It Works Process */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white rounded-2xl p-8 lg:p-12 border border-gray-200"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Simple Process, Maximum Savings
            </h3>
            <p className="text-gray-600">
              Four easy steps to start saving with your community
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Browse",
                desc: "Find products you need",
                color: "bg-green-600",
              },
              {
                step: "2",
                title: "Join",
                desc: "Add to group order",
                color: "bg-gray-900",
              },
              {
                step: "3",
                title: "Save",
                desc: "More joiners = lower prices",
                color: "bg-green-600",
              },
              {
                step: "4",
                title: "Receive",
                desc: "Get delivery to campus",
                color: "bg-gray-900",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="text-center relative"
              >
                {/* Step Circle */}
                <div
                  className={`w-12 h-12 ${item.color} text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4 shadow-sm`}
                >
                  {item.step}
                </div>

                {/* Connector Line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gray-200 transform translate-x-6 -z-10" />
                )}

                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h4>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

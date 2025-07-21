// components/LoadingPage.tsx

"use client";

import { motion } from "framer-motion";
import { Package, TruckIcon, Users } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Bulk Order Animation */}
        <div className="relative">
          {/* Multiple packages representing bulk orders */}
          <motion.div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  y: [0, -5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
                className="bg-gray-100 rounded-lg p-3"
              >
                <Package className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Bulk ordering text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center space-y-2"
        >
          <h2 className="text-lg font-medium text-gray-800">
            Welcome to the Bulkease Community
          </h2>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 justify-center">
            <motion.span
              className="text-sm text-gray-600"
              animate={{
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              Loading...
            </motion.span>
          </div>
        </motion.div>

        {/* Simple progress bar */}
        <motion.div
          className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="h-full bg-green-500 rounded-full"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

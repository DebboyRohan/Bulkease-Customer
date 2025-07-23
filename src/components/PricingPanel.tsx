// components/PricingPanel.tsx
import {
  getCurrentPrice,
  getNextBracket,
  getMinPrice,
  PriceRange,
  safeToFixed,
} from "@/lib/pricing-utils";

interface PricingPanelProps {
  ranges: PriceRange[];
  totalOrders: number;
}

export default function PricingPanel({
  ranges,
  totalOrders,
}: PricingPanelProps) {
  const now = getCurrentPrice(ranges, totalOrders);
  const next = getNextBracket(ranges, totalOrders);
  const floor = getMinPrice(ranges);

  return (
    <section className="border rounded-lg p-6 bg-white space-y-4">
      {/* current */}
      <div className="flex items-baseline justify-between">
        <span className="text-gray-700">Current price</span>
        <span className="text-3xl font-bold text-green-700">
          ₹{safeToFixed(now)}
        </span>
      </div>

      {/* ladder info */}
      {next && (
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-gray-600">Next bracket</span>
          <span className="font-medium">
            ₹{safeToFixed(next.pricePerUnit)} @ ≥{next.minQuantity}
          </span>
        </div>
      )}

      {/* totals */}
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-gray-600">Orders placed</span>
        <span className="font-medium">{totalOrders}</span>
      </div>

      {/* floor */}
      <div className="flex items-baseline justify-between text-xs text-gray-500 pt-2 border-t">
        <span>Minimum achievable</span>
        <span>₹{safeToFixed(floor)}</span>
      </div>
    </section>
  );
}

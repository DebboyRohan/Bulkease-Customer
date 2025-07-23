// components/ProductCard.tsx
import {
  getCurrentPrice,
  getNextBracket,
  getMinPrice,
  safeToFixed,
} from "@/lib/pricing-utils";

export default function ProductCard({
  product,
  qty,
}: {
  product: any;
  qty: any;
}) {
  const priceNow = getCurrentPrice(product.priceRanges, qty) ?? 0;
  const next = getNextBracket(product.priceRanges, qty);
  const bestPrice = getMinPrice(product.priceRanges);

  return (
    <article className="border rounded-lg shadow-sm hover:shadow-md transition">
      {/* image / name omitted for brevity */}

      <div className="p-4 space-y-3">
        {/* 1 · Current price */}
        <div className="text-xl font-semibold text-gray-900">
          ₹{safeToFixed(priceNow)}
          <span className="ml-1 text-sm font-normal text-gray-500">/unit</span>
        </div>

        {/* 2 · Next cheaper bracket */}
        {next && (
          <p className="text-sm text-gray-600">
            Next: <strong>₹{safeToFixed(next.pricePerUnit)}</strong>
            &nbsp;@&nbsp;≥{next.minQuantity} units
          </p>
        )}

        {/* 3 · Orders so far */}
        <p className="text-sm text-gray-500">
          Orders placed: <strong>{product._count.orderItems}</strong>
        </p>

        {/* 4 · Floor price */}
        <p className="text-xs text-gray-400">
          Floor&nbsp;price: ₹{safeToFixed(bestPrice)}
        </p>

        {/* "Book now" button sits here */}
      </div>
    </article>
  );
}

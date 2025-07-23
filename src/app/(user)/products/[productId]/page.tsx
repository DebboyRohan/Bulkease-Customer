// app/products/[productId]/page.tsx

import ProductDetailClient from "./ProductDetailClient";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ProductDetailClient productId={productId} />;
}

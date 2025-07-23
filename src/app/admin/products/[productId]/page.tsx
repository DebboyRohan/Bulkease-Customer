// app/admin/products/[productId]/page.tsx

import AdminProductDetailClient from "./AdminProductDetailClient";

// Server component that handles async params
export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <AdminProductDetailClient productId={productId} />;
}

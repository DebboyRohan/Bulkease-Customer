// app/admin/products/[productId]/AdminProductDetailClient.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  Eye,
  Users,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingPage from "@/components/LoadingPage";
import Image from "next/image";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  bookingAmount?: number;
  hasVariants: boolean;
  variants: Array<{
    id: string;
    name: string;
    bookingAmount: number;
    images: string[];
    priceRanges: Array<{
      minQuantity: number;
      maxQuantity?: number;
      pricePerUnit: number;
    }>;
    _count: {
      orderItems: number;
    };
  }>;
  priceRanges: Array<{
    minQuantity: number;
    maxQuantity?: number;
    pricePerUnit: number;
  }>;
  _count: {
    orderItems: number;
    variants: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface AdminProductDetailClientProps {
  productId: string;
}

export default function AdminProductDetailClient({
  productId,
}: AdminProductDetailClientProps) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const safeToFixed = (value: any, decimals: number = 2): string => {
    const num = Number(value) || 0;
    return num.toFixed(decimals);
  };

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/admin/products");
          return;
        }
        throw new Error("Failed to fetch product");
      }

      const productData = await response.json();
      setProduct(productData);
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Product deleted successfully!");
        router.push("/admin/products");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The product you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push("/admin/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/products")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-4">
                <Badge variant={product.hasVariants ? "default" : "secondary"}>
                  {product.hasVariants
                    ? `${product._count.variants} Variants`
                    : "Single Product"}
                </Badge>
                <Badge variant="outline">
                  {product._count.orderItems} Orders
                </Badge>
                <span className="text-sm text-gray-500">
                  Created: {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/products/${product.id}`)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Public
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/admin/products/${product.id}/edit`)
                }
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                {product.hasVariants ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Images are managed at the variant level for this product.
                    </p>
                    {product.variants.map((variant) => (
                      <div key={variant.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{variant.name}</h4>
                        {variant.images.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {variant.images
                              .slice(0, 4)
                              .map((image, imgIndex) => (
                                <div
                                  key={imgIndex}
                                  className="aspect-square relative rounded-lg overflow-hidden"
                                >
                                  <Image
                                    src={image}
                                    alt={`${variant.name} ${imgIndex + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {product.images.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {product.images.map((image, index) => (
                          <div
                            key={index}
                            className="aspect-square relative rounded-lg overflow-hidden"
                          >
                            <Image
                              src={image}
                              alt={`${product.name} ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No images uploaded
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="space-y-6">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Name
                      </label>
                      <p className="text-gray-900">{product.name}</p>
                    </div>

                    {product.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <p className="text-gray-900">{product.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Product Type
                        </label>
                        <p className="text-gray-900">
                          {product.hasVariants
                            ? "Product with Variants"
                            : "Single Product"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Total Orders
                        </label>
                        <p className="text-gray-900">
                          {product._count.orderItems}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Created
                        </label>
                        <p className="text-gray-900">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Last Updated
                        </label>
                        <p className="text-gray-900">
                          {new Date(product.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {product.hasVariants && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Variants ({product._count.variants})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {product.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium">{variant.name}</h4>
                              <Badge variant="outline">
                                {variant._count.orderItems} orders
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Booking Amount:
                                </span>
                                <span className="ml-2 font-medium">
                                  ₹{safeToFixed(variant.bookingAmount)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Images:</span>
                                <span className="ml-2 font-medium">
                                  {variant.images.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="pricing" className="space-y-6">
                {product.hasVariants ? (
                  <div className="space-y-6">
                    {product.variants.map((variant) => (
                      <Card key={variant.id}>
                        <CardHeader>
                          <CardTitle>{variant.name} - Price Ranges</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {variant.priceRanges.map((range, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div>
                                  <span className="font-medium">
                                    {range.minQuantity} -{" "}
                                    {range.maxQuantity || "∞"} units
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold text-green-600">
                                    ₹{safeToFixed(range.pricePerUnit)}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">
                                    /unit
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Price Ranges</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">
                            Booking Amount:
                          </span>
                          <span className="ml-2 text-lg font-bold text-orange-600">
                            ₹{safeToFixed(product.bookingAmount)}
                          </span>
                        </div>

                        {product.priceRanges.map((range, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <span className="font-medium">
                                {range.minQuantity} - {range.maxQuantity || "∞"}{" "}
                                units
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">
                                ₹{safeToFixed(range.pricePerUnit)}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                /unit
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Total Orders
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {product._count.orderItems}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Package className="w-8 h-8 text-green-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            {product.hasVariants ? "Variants" : "Price Tiers"}
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {product.hasVariants
                              ? product._count.variants
                              : product.priceRanges.length}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center">
                        <Calendar className="w-8 h-8 text-purple-600" />
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">
                            Days Live
                          </p>
                          <p className="text-2xl font-bold text-gray-900">
                            {Math.floor(
                              (new Date().getTime() -
                                new Date(product.createdAt).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

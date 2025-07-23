// app/admin/products/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Plus, Package, Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingPage from "@/components/LoadingPage";
import { CreateProductModal } from "@/components/admin/CreateProductModal";
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
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const safeToFixed = (value: any, decimals: number = 2): string => {
    const num = Number(value) || 0;
    return num.toFixed(decimals);
  };

  const fetchProducts = async (
    searchQuery?: string,
    sortBy: string = "newest",
    pageNum: number = 1
  ) => {
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: "12",
        sort: sortBy,
      });

      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }

      const response = await fetch(`/api/admin/products?${queryParams}`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(search, sort, page);
  }, [page, sort]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchLoading(true);
    setPage(1);
    await fetchProducts(search, sort, 1);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setDeletingIds((prev) => new Set(prev).add(productId));

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Product deleted successfully!");
        await fetchProducts(search, sort, page);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const getProductImages = (product: Product) => {
    if (product.hasVariants && product.variants.length > 0) {
      return product.variants[0]?.images || [];
    }
    return product.images || [];
  };

  const getBookingAmount = (product: Product) => {
    if (product.hasVariants && product.variants.length > 0) {
      return product.variants[0]?.bookingAmount || 0;
    }
    return product.bookingAmount || 0;
  };

  const getStartingPrice = (product: Product) => {
    let ranges = product.priceRanges;
    if (product.hasVariants && product.variants.length > 0) {
      // For variants, we would need to get variant price ranges
      // This is simplified - in real app you'd need to fetch variant price ranges
      return 0;
    }

    if (ranges.length === 0) return 0;

    const sortedRanges = ranges.sort((a, b) => a.minQuantity - b.minQuantity);
    return Number(sortedRanges[0]?.pricePerUnit) || 0;
  };

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
            <p className="text-gray-600">
              Manage your product catalog and inventory
              {pagination && ` • ${pagination.total} products total`}
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  disabled={searchLoading}
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </form>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="orders">Most Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? "No products found" : "No products created yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {search
                ? `No products match "${search}". Try a different search term.`
                : "Get started by creating your first product."}
            </p>
            {!search && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const images = getProductImages(product);
              const bookingAmount = getBookingAmount(product);
              const startingPrice = getStartingPrice(product);

              return (
                <Card
                  key={product.id}
                  className="group overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <CardHeader className="p-0">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {images.length > 0 ? (
                        <Image
                          src={images[0]}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Package className="w-12 h-12 text-gray-300" />
                        </div>
                      )}

                      {/* Product badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        {product.hasVariants && (
                          <Badge className="bg-blue-600 text-white">
                            {product._count.variants} Variants
                          </Badge>
                        )}
                        <Badge className="bg-green-600 text-white">
                          {product._count.orderItems} Orders
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">
                      {product.name}
                    </h3>

                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                      {product.description || "No description provided"}
                    </p>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Booking:</span>
                        <span className="font-medium">
                          ₹{safeToFixed(bookingAmount)}
                        </span>
                      </div>

                      {!product.hasVariants && startingPrice > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Starting at:</span>
                          <span className="font-medium">
                            ₹{safeToFixed(startingPrice)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/products/${product.id}`)
                      }
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/products/${product.id}/edit`)
                      }
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(product.id)}
                      disabled={deletingIds.has(product.id)}
                    >
                      {deletingIds.has(product.id) ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-6"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={
                      pageNum === page ? "bg-green-600 hover:bg-green-700" : ""
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.pages}
              className="px-6"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchProducts(search, sort, page);
        }}
      />
    </div>
  );
}

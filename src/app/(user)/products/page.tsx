// app/products/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Search, Package, Eye, ArrowRight } from "lucide-react";
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
import { OnboardingModal } from "@/components/OnboardingModal";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Product,
  getCurrentPrice,
  getNextBracket,
  getMinPrice,
  getProductImages,
  getTotalOrders,
  getProductPriceRanges,
  safeToFixed,
} from "@/lib/pricing-utils";

export default function ProductsPage() {
  const { userId, isLoaded, sessionClaims } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

      const response = await fetch(`/api/products?${queryParams}`);

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

  const handleViewDetails = (productId: string) => {
    router.push(`/products/${productId}`);
  };

  if (!isLoaded || loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Products</h1>
          <p className="text-gray-600">
            Professional bulk procurement with transparent community pricing
            {pagination && ` • ${pagination.total} products available`}
          </p>
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
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? "No products found" : "No products available"}
            </h3>
            <p className="text-gray-500">
              {search
                ? `No products match "${search}". Try a different search term.`
                : "Products will appear here when they become available."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              // Use first variant if available, otherwise product data
              const selectedVariant = product.hasVariants
                ? product.variants[0]
                : undefined;
              const images = getProductImages(product, selectedVariant);
              const priceRanges = getProductPriceRanges(
                product,
                selectedVariant
              );
              const totalOrders = getTotalOrders(product, selectedVariant);

              const currentPrice = getCurrentPrice(priceRanges, totalOrders);
              const nextBracket = getNextBracket(priceRanges, totalOrders);
              const minPrice = getMinPrice(priceRanges);

              return (
                <Card
                  key={product.id}
                  className="group overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 bg-white"
                >
                  <CardHeader className="p-0">
                    <div
                      className="aspect-square bg-gray-100 relative cursor-pointer overflow-hidden"
                      onClick={() => handleViewDetails(product.id)}
                    >
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
                      <div className="absolute top-3 left-3">
                        {product.hasVariants && (
                          <Badge className="bg-white text-gray-700 shadow-sm">
                            {product.variants.length} Options
                          </Badge>
                        )}
                      </div>

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white text-gray-900 hover:bg-gray-100 shadow-lg"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5">
                    <div
                      className="cursor-pointer mb-4"
                      onClick={() => handleViewDetails(product.id)}
                    >
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>

                      <p className="text-gray-600 text-sm line-clamp-2">
                        {product.description ||
                          "Professional quality product with competitive bulk pricing"}
                      </p>
                    </div>

                    {/* Professional Pricing Display */}
                    <div className="space-y-3 border-t pt-4">
                      {/* Current price */}
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Current price
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          ₹{safeToFixed(currentPrice)}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            /unit
                          </span>
                        </span>
                      </div>

                      {/* Next bracket */}
                      {nextBracket && (
                        <div className="flex items-baseline justify-between text-sm">
                          <span className="text-gray-600">Next tier</span>
                          <span className="font-medium text-green-700">
                            ₹{safeToFixed(nextBracket.pricePerUnit)} @ ≥
                            {nextBracket.minQuantity}
                          </span>
                        </div>
                      )}

                      {/* Orders placed */}
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="text-gray-600">Orders placed</span>
                        <span className="font-medium text-gray-900">
                          {totalOrders}
                        </span>
                      </div>

                      {/* Minimum achievable */}
                      <div className="flex items-baseline justify-between text-xs text-gray-500 pt-2 border-t">
                        <span>Best possible price</span>
                        <span className="font-medium">
                          ₹{safeToFixed(minPrice)}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="p-5 pt-0">
                    <Button
                      onClick={() => handleViewDetails(product.id)}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium"
                    >
                      View Details & Order
                      <ArrowRight className="w-4 h-4 ml-2" />
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

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
          window.location.reload();
        }}
      />
    </div>
  );
}

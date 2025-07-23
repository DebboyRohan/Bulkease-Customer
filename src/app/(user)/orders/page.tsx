// app/orders/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Package,
  Calendar,
  CreditCard,
  Filter,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingPage from "@/components/LoadingPage";
import Image from "next/image";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/pricing-utils";

interface OrderItem {
  id: string;
  quantity: number;
  bookingPrice: number;
  finalPrice?: number | null;
  product?: {
    id: string;
    name: string;
    images: string[];
    hasVariants: boolean;
  } | null;
  variant?: {
    id: string;
    name: string;
    images: string[];
    product: {
      id: string;
      name: string;
      hasVariants: boolean;
    };
  } | null;
}

interface Order {
  id: string;
  totalQuantity: number;
  bookingAmount: number;
  finalAmount?: number | null;
  remainingAmount?: number | null;
  transactionId: string;
  status: "BOOKED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItem[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "BOOKED":
      return "bg-blue-100 text-blue-800";
    case "DELIVERED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "REFUNDED":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function OrdersPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all"); // Changed from ""
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push("/sign-in");
        return;
      }
      fetchOrders();
    }
  }, [userId, isLoaded, statusFilter, page]);

  const fetchOrders = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      // Only append status if it's not "all"
      if (statusFilter && statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }

      const response = await fetch(`/api/orders?${queryParams}`);

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setPagination(data.pagination);
      } else {
        toast.error("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const getOrderItemDetails = (item: OrderItem) => {
    const isVariant = !!item.variant;
    const product = isVariant ? item.variant!.product : item.product!;
    const variant = item.variant;

    return {
      name: product.name,
      variantName: variant?.name,
      images: isVariant ? variant!.images : item.product!.images,
      quantity: item.quantity,
      bookingPrice: item.bookingPrice,
      finalPrice: item.finalPrice,
    };
  };

  if (!isLoaded || loading) {
    return <LoadingPage />;
  }

  if (orders.length === 0 && statusFilter === "all") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to see your orders here
            </p>
            <Button
              onClick={() => router.push("/products")}
              className="bg-green-600 hover:bg-green-700"
            >
              Browse Products
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order History
          </h1>
          <p className="text-gray-600">
            Track and manage your bulk orders
            {pagination && ` • ${pagination.total} orders total`}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="BOOKED">Booked</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(-8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Order Items Preview */}
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Items ({order.totalQuantity})
                    </h4>
                    <div className="flex -space-x-2">
                      {order.orderItems.slice(0, 3).map((item, index) => {
                        const details = getOrderItemDetails(item);
                        return (
                          <div
                            key={item.id}
                            className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white bg-gray-100"
                          >
                            {details.images.length > 0 ? (
                              <Image
                                src={details.images[0]}
                                alt={details.name}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-300" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {order.orderItems.length > 3 && (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            +{order.orderItems.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      {order.orderItems.slice(0, 2).map((item) => {
                        const details = getOrderItemDetails(item);
                        return (
                          <p key={item.id} className="text-sm text-gray-600">
                            {details.quantity}x {details.name}
                            {details.variantName && ` (${details.variantName})`}
                          </p>
                        );
                      })}
                      {order.orderItems.length > 2 && (
                        <p className="text-sm text-gray-500">
                          and {order.orderItems.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Date */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Order Date
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  {/* Order Amount */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Payment</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          ₹{safeToFixed(order.bookingAmount)} paid
                        </span>
                      </div>
                      {order.finalAmount && (
                        <p className="text-xs text-gray-600">
                          Total: ₹{safeToFixed(order.finalAmount)}
                        </p>
                      )}
                      {order.remainingAmount && order.remainingAmount > 0 && (
                        <p className="text-xs text-orange-600">
                          Remaining: ₹{safeToFixed(order.remainingAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
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
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

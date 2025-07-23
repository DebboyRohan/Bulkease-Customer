// app/orders/[orderId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  Package,
  Calendar,
  CreditCard,
  User,
  Phone,
  MapPin,
  Hash,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LoadingPage from "@/components/LoadingPage";
import Image from "next/image";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/pricing-utils";

interface OrderDetailProps {
  params: Promise<{ orderId: string }>;
}

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
  user: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    hall?: string | null;
    roll?: string | null;
  };
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

export default function OrderDetailPage({ params }: OrderDetailProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const getOrderId = async () => {
      const { orderId } = await params;
      return orderId;
    };

    if (isLoaded) {
      if (!userId) {
        router.push("/sign-in");
        return;
      }
      getOrderId().then(fetchOrder);
    }
  }, [userId, isLoaded]);

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);
      } else if (response.status === 404) {
        toast.error("Order not found");
        router.push("/orders");
      } else {
        toast.error("Failed to load order");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order || order.status !== "BOOKED") return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (response.ok) {
        toast.success("Order cancelled successfully");
        setOrder({ ...order, status: "CANCELLED" });
      } else {
        toast.error("Failed to cancel order");
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Failed to cancel order");
    } finally {
      setCancelling(false);
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

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Order Not Found
          </h2>
          <Button onClick={() => router.push("/orders")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/orders")}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(order.status)}>
                {order.status}
              </Badge>
              {order.status === "BOOKED" && (
                <Button
                  variant="destructive"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                >
                  {cancelling ? "Cancelling..." : "Cancel Order"}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({order.totalQuantity})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.orderItems.map((item) => {
                  const details = getOrderItemDetails(item);
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          {details.images.length > 0 ? (
                            <Image
                              src={details.images[0]}
                              alt={details.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {details.name}
                        </h4>
                        {details.variantName && (
                          <p className="text-sm text-gray-600">
                            Variant: {details.variantName}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Quantity: {details.quantity}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₹
                          {safeToFixed(details.bookingPrice * details.quantity)}
                        </p>
                        <p className="text-xs text-gray-500">Booking amount</p>
                        {details.finalPrice && (
                          <p className="text-sm text-green-600">
                            Final: ₹
                            {safeToFixed(details.finalPrice * details.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.user.name && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>{order.user.name}</span>
                  </div>
                )}
                {order.user.email && (
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span>{order.user.email}</span>
                  </div>
                )}
                {order.user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span>{order.user.phone}</span>
                  </div>
                )}
                {order.user.hall && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{order.user.hall} Hall</span>
                  </div>
                )}
                {order.user.roll && (
                  <div className="flex items-center gap-3">
                    <Hash className="w-4 h-4 text-gray-500" />
                    <span>Roll: {order.user.roll}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Booking Amount Paid</span>
                  <span className="font-semibold text-green-600">
                    ₹{safeToFixed(order.bookingAmount)}
                  </span>
                </div>

                {order.finalAmount && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Final Amount</span>
                      <span className="font-semibold">
                        ₹{safeToFixed(order.finalAmount)}
                      </span>
                    </div>
                  </>
                )}

                {order.remainingAmount && order.remainingAmount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Remaining Amount</span>
                    <span className="font-semibold text-orange-600">
                      ₹{safeToFixed(order.remainingAmount)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Transaction ID:</strong> {order.transactionId}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Order Date:</strong>{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Last Updated:</strong>{" "}
                    {new Date(order.updatedAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Information */}
            {order.status === "BOOKED" && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your order has been confirmed. You'll be notified about
                  delivery updates.
                </AlertDescription>
              </Alert>
            )}

            {order.status === "CANCELLED" && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This order has been cancelled. If you have any questions,
                  please contact support.
                </AlertDescription>
              </Alert>
            )}

            {order.status === "DELIVERED" && (
              <Alert className="border-green-200 bg-green-50">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your order has been delivered successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

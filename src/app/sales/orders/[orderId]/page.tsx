// app/sales/orders/[orderId]/page.tsx

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
  Edit,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingPage from "@/components/LoadingPage";
import Image from "next/image";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/pricing-utils";

interface SalesOrderDetailProps {
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

interface SalesOrder {
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

export default function SalesOrderDetailPage({
  params,
}: SalesOrderDetailProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editingPrices, setEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState<{ [key: string]: number }>({});
  const [tempFinalAmount, setTempFinalAmount] = useState<number>(0);

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
      const response = await fetch(`/api/sales/orders/${orderId}`);

      if (response.ok) {
        const orderData = await response.json();
        setOrder(orderData);

        // Initialize temp prices
        const prices: { [key: string]: number } = {};
        orderData.orderItems.forEach((item: OrderItem) => {
          prices[item.id] = item.finalPrice || item.bookingPrice;
        });
        setTempPrices(prices);
        setTempFinalAmount(orderData.finalAmount || 0);
      } else if (response.status === 404) {
        toast.error("Order not found");
        router.push("/sales");
      } else if (response.status === 403) {
        toast.error("Access denied. Sales role required.");
        router.push("/");
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

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/sales/orders/${order.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success("Order status updated successfully");
        setOrder({ ...order, status: newStatus as any });
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  const updateOrderPrices = async () => {
    if (!order) return;

    setUpdating(true);
    try {
      const updatedItems = order.orderItems.map((item) => ({
        id: item.id,
        finalPrice: tempPrices[item.id],
      }));

      const response = await fetch(`/api/sales/orders/${order.id}/prices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: updatedItems,
          finalAmount: tempFinalAmount,
        }),
      });

      if (response.ok) {
        toast.success("Prices updated successfully");
        await fetchOrder(order.id);
        setEditingPrices(false);
      } else {
        toast.error("Failed to update prices");
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      toast.error("Failed to update prices");
    } finally {
      setUpdating(false);
    }
  };

  const calculateTotalFromItems = () => {
    return Object.values(tempPrices).reduce((sum, price) => sum + price, 0);
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
          <Button onClick={() => router.push("/sales")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/sales")}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sales
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
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={updating}
              >
                <SelectTrigger className="w-40">
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKED">BOOKED</SelectItem>
                  <SelectItem value="DELIVERED">DELIVERED</SelectItem>
                  <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                  <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Order Items ({order.totalQuantity})</CardTitle>
                <div className="flex gap-2">
                  {editingPrices ? (
                    <>
                      <Button
                        size="sm"
                        onClick={updateOrderPrices}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingPrices(false);
                          // Reset temp prices
                          const prices: { [key: string]: number } = {};
                          order.orderItems.forEach((item) => {
                            prices[item.id] =
                              item.finalPrice || item.bookingPrice;
                          });
                          setTempPrices(prices);
                          setTempFinalAmount(order.finalAmount || 0);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingPrices(true)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit Prices
                    </Button>
                  )}
                </div>
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
                        <p className="text-sm text-gray-600">
                          Booking: ₹{safeToFixed(details.bookingPrice)} per unit
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-sm text-gray-600">
                          Booking Total: ₹
                          {safeToFixed(details.bookingPrice * details.quantity)}
                        </p>

                        {editingPrices ? (
                          <div>
                            <Label className="text-xs">
                              Final Price per Item
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={tempPrices[item.id] || 0}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setTempPrices((prev) => ({
                                  ...prev,
                                  [item.id]: value * details.quantity,
                                }));
                              }}
                              className="w-24 text-sm"
                            />
                          </div>
                        ) : (
                          details.finalPrice && (
                            <p className="font-semibold text-green-600">
                              Final: ₹
                              {safeToFixed(
                                details.finalPrice * details.quantity
                              )}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}

                {editingPrices && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Calculated total from items: ₹
                      {safeToFixed(calculateTotalFromItems())}
                    </AlertDescription>
                  </Alert>
                )}
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

                <Separator />

                {editingPrices ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Final Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={tempFinalAmount}
                        onChange={(e) =>
                          setTempFinalAmount(parseFloat(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Remaining Amount</span>
                      <span className="font-medium">
                        ₹
                        {safeToFixed(
                          Math.max(0, tempFinalAmount - order.bookingAmount)
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {order.finalAmount && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Final Amount</span>
                        <span className="font-semibold">
                          ₹{safeToFixed(order.finalAmount)}
                        </span>
                      </div>
                    )}

                    {order.remainingAmount && order.remainingAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Remaining Amount</span>
                        <span className="font-semibold text-orange-600">
                          ₹{safeToFixed(order.remainingAmount)}
                        </span>
                      </div>
                    )}
                  </>
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

            {/* Status Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => updateOrderStatus("DELIVERED")}
                  disabled={updating || order.status === "DELIVERED"}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Mark as Delivered
                </Button>

                <Button
                  onClick={() => updateOrderStatus("CANCELLED")}
                  disabled={updating || order.status === "CANCELLED"}
                  variant="destructive"
                  className="w-full"
                >
                  Cancel Order
                </Button>

                <Button
                  onClick={() => updateOrderStatus("REFUNDED")}
                  disabled={updating || order.status === "REFUNDED"}
                  variant="outline"
                  className="w-full"
                >
                  Process Refund
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

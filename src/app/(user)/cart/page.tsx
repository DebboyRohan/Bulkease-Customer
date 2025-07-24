// app/cart/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LoadingPage from "@/components/LoadingPage";
import PaymentModal from "@/components/PaymentModal";
import Image from "next/image";
import { toast } from "sonner";
import {
  CartItemWithDetails,
  getCartItemDetails,
  calculateCartTotals,
} from "@/lib/cart-utils";
import { safeToFixed } from "@/lib/pricing-utils";

export default function CartPage() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (!userId) {
        router.push("/sign-in");
        return;
      }
      fetchCart();
    }
  }, [userId, isLoaded]);

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart");

      if (response.ok) {
        const cart = await response.json();
        setCartItems(cart.items || []);
      } else {
        toast.error("Failed to load cart");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        await fetchCart();
      } else {
        toast.error("Failed to update quantity");
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setUpdating(itemId);
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Item removed from cart");
        await fetchCart();
      } else {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentProcessing(true);
    setShowPayment(false);

    // Show loading for 2 seconds before redirecting
    setTimeout(() => {
      router.push("/orders");
    }, 2000);
  };

  if (!isLoaded || loading) {
    return <LoadingPage />;
  }

  // Payment processing overlay
  if (paymentProcessing) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600">Redirecting to your orders...</p>
        </div>
      </div>
    );
  }

  const cartTotals = calculateCartTotals(cartItems);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some products to get started with bulk ordering
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
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            {cartTotals.totalItems}{" "}
            {cartTotals.totalItems === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const details = getCartItemDetails(item);
              const isUpdating = updating === item.id;

              return (
                <Card key={item.id} className="relative">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                          {details.images.length > 0 ? (
                            <Image
                              src={details.images[0]}
                              alt={details.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {details.name}
                            </h3>
                            {details.variantName && (
                              <p className="text-sm text-gray-600">
                                Variant: {details.variantName}
                              </p>
                            )}
                            <p className="text-sm text-gray-600">
                              ₹{safeToFixed(details.bookingAmountPerUnit)} per
                              unit
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            disabled={isUpdating}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, details.quantity - 1)
                              }
                              disabled={details.quantity <= 1 || isUpdating}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="font-medium min-w-[2rem] text-center">
                              {details.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(item.id, details.quantity + 1)
                              }
                              disabled={isUpdating}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{safeToFixed(details.totalBookingAmount)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Booking amount
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isUpdating && (
                      <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                        <Loader2 className="w-6 h-6 text-green-600 animate-spin" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    Items ({cartTotals.totalItems})
                  </span>
                  <span className="font-medium">
                    ₹{cartTotals.formattedTotal}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>Total Booking Amount</span>
                  <span className="text-green-600">
                    ₹{cartTotals.formattedTotal}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Payment Information
                  </h4>
                  <p className="text-sm text-blue-800">
                    You'll pay the booking amount now. The remaining amount will
                    be calculated based on final bulk pricing and charged after
                    order confirmation.
                  </p>
                </div>

                <Button
                  onClick={() => setShowPayment(true)}
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                  disabled={cartItems.length === 0}
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Proceed to Payment
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push("/products")}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal with higher z-index */}
      {showPayment && (
        <PaymentModal
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          totalAmount={cartTotals.totalBookingAmount}
          onSuccess={handlePaymentSuccess}
          // Higher z-index
        />
      )}
    </div>
  );
}

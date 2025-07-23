// components/PaymentModal.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { safeToFixed } from "@/lib/pricing-utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onSuccess: (orderId: string) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({
  isOpen,
  onClose,
  totalAmount,
  onSuccess,
}: PaymentModalProps) {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!userId) {
      toast.error("Please sign in to continue");
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!orderResponse.ok) {
        throw new Error("Failed to create order");
      }

      const { razorpayOrderId, amount, currency, orderId } =
        await orderResponse.json();

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(amount * 100), // Amount in paise
        currency,
        name: "Bulk Order Platform",
        description: "Booking Amount Payment",
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              }),
            });

            if (verifyResponse.ok) {
              const result = await verifyResponse.json();
              toast.success("Payment successful!");
              onSuccess(result.orderId);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: "User",
          email: "user@example.com",
        },
        theme: {
          color: "#16a34a",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment");
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Booking Amount</span>
                  <span className="font-semibold">
                    ₹{safeToFixed(totalAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total to Pay</span>
                  <span className="text-green-600">
                    ₹{safeToFixed(totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This is the booking amount. The remaining
              amount will be calculated based on final bulk pricing and charged
              separately.
            </p>
          </div>

          {/* Payment Button */}
          <div className="space-y-3">
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ₹{safeToFixed(totalAmount)}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

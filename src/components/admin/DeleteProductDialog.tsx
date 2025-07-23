// components/admin/DeleteProductDialog.tsx (Enhanced Version)

"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package,
  AlertTriangle,
  Loader2,
  ShoppingCart,
  Archive,
} from "lucide-react";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description?: string;
  images: string[];
  bookingAmount: number;
  hasVariants: boolean;
  variants: any[];
  priceRanges: any[];
  createdAt: string;
  updatedAt: string;
}

interface DeleteProductDialogProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (productId: string) => Promise<void>;
}

export function DeleteProductDialog({
  product,
  onClose,
  onConfirm,
}: DeleteProductDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [understoodConsequences, setUnderstoodConsequences] = useState(false);
  const [activeOrders, setActiveOrders] = useState<number | null>(null);
  const [cartsCount, setCartsCount] = useState<number | null>(null);

  const isConfirmationValid =
    confirmationText === product?.name && understoodConsequences;

  // Fetch product usage statistics when dialog opens
  useEffect(() => {
    if (product) {
      fetchProductUsage(product.id);
    }
  }, [product]);

  const fetchProductUsage = async (productId: string) => {
    try {
      // You can implement these endpoints to check product usage
      const [ordersRes, cartsRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}/orders-count`),
        fetch(`/api/admin/products/${productId}/carts-count`),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setActiveOrders(ordersData.count);
      }

      if (cartsRes.ok) {
        const cartsData = await cartsRes.json();
        setCartsCount(cartsData.count);
      }
    } catch (error) {
      console.error("Error fetching product usage:", error);
    }
  };

  const handleDelete = async () => {
    if (!product || !isConfirmationValid) return;

    setIsDeleting(true);
    try {
      await onConfirm(product.id);
      // Reset form state
      setConfirmationText("");
      setUnderstoodConsequences(false);
      setActiveOrders(null);
      setCartsCount(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmationText("");
      setUnderstoodConsequences(false);
      setActiveOrders(null);
      setCartsCount(null);
      onClose();
    }
  };

  if (!product) return null;

  return (
    <AlertDialog open={!!product} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                Delete Product
              </AlertDialogTitle>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Product Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-16 h-16 bg-white rounded-lg overflow-hidden flex-shrink-0">
                {product.images.length > 0 ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {product.description || "No description"}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={product.hasVariants ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {product.hasVariants ? "Has Variants" : "Simple Product"}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    ₹{product.bookingAmount} booking
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Usage Statistics */}
          {(activeOrders !== null || cartsCount !== null) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Archive className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Current Usage:</p>
                  <div className="grid grid-cols-2 gap-4">
                    {activeOrders !== null && (
                      <div className="flex items-center gap-1">
                        <ShoppingCart className="w-3 h-3" />
                        <span>{activeOrders} active orders</span>
                      </div>
                    )}
                    {cartsCount !== null && (
                      <div className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        <span>{cartsCount} in carts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consequences Warning */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-800">
                <p className="font-medium mb-1">
                  This will permanently delete:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  {product.hasVariants && (
                    <li>{product.variants.length} product variant(s)</li>
                  )}
                  <li>
                    {product.hasVariants
                      ? "All variant price ranges"
                      : `${product.priceRanges.length} price range(s)`}
                  </li>
                  <li>Product from any existing carts</li>
                  <li>All product images and data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="understand"
              checked={understoodConsequences}
              onCheckedChange={(checked) =>
                setUnderstoodConsequences(checked as boolean)
              }
              disabled={isDeleting}
            />
            <Label
              htmlFor="understand"
              className="text-sm text-gray-700 cursor-pointer"
            >
              I understand that this action cannot be undone
            </Label>
          </div>

          {/* Confirmation Text Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type <strong>{product.name}</strong> to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${product.name}" here`}
              disabled={isDeleting}
              className={
                confirmationText === product.name ? "border-green-500" : ""
              }
            />
          </div>

          <AlertDialogDescription className="text-gray-600 text-sm">
            <strong>Note:</strong> Existing orders containing this product will
            not be affected, but customers won't be able to reorder this
            product.
          </AlertDialogDescription>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2 mt-6">
          <AlertDialogCancel
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600 flex-1 sm:flex-none disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Product"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

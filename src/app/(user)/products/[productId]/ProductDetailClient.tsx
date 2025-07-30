// app/products/[productId]/ProductDetailClient.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  ArrowLeft,
  ShoppingCart,
  Package,
  Star,
  Plus,
  Minus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingPage from "@/components/LoadingPage";
import { OnboardingModal } from "@/components/OnboardingModal";
import Image from "next/image";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import PricingPanel from "@/components/PricingPanel";
import {
  Product,
  Variant,
  getProductImages,
  getProductBookingAmount,
  getProductPriceRanges,
  getTotalOrders,
  getCurrentPrice,
  safeToFixed,
  safeNumber,
} from "@/lib/pricing-utils";

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({
  productId,
}: ProductDetailClientProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [checkingOnboarding, setCheckingOnboarding] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (userId) {
      checkUserOnboardingStatus();
    }
  }, [userId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        if (response.status === 404) {
          router.push("/products");
          return;
        }
        throw new Error("Failed to fetch product");
      }

      const productData: Product = await response.json();
      setProduct(productData);

      // Set default variant if product has variants and has active variants
      if (
        productData.hasVariants &&
        productData.variants &&
        productData.variants.length > 0
      ) {
        // Find the first active variant, or fallback to first variant
        const activeVariant =
          productData.variants.find((v) => v.isActive !== false) ||
          productData.variants[0];
        setSelectedVariant(activeVariant.id);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  const checkUserOnboardingStatus = async () => {
    if (!userId) return;

    setCheckingOnboarding(true);
    try {
      const response = await fetch("/api/user/onboarding-status");

      if (response.ok) {
        const data = await response.json();
        setIsOnboarded(data.onboarded);
      } else {
        console.error("Failed to check onboarding status");
        setIsOnboarded(false);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsOnboarded(false);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const getSelectedVariantData = (): Variant | undefined => {
    if (!product?.hasVariants || !selectedVariant) return undefined;
    return product.variants?.find((v) => v.id === selectedVariant);
  };

  const handleAddToCart = async () => {
    // Check if user is signed in
    if (!userId) {
      router.push("/sign-in");
      return;
    }

    // Check if user is onboarded
    if (isOnboarded === false) {
      setShowOnboarding(true);
      return;
    }

    // If we haven't checked onboarding status yet, check it now
    if (isOnboarded === null && !checkingOnboarding) {
      await checkUserOnboardingStatus();
      return; // Let the effect handle the result
    }

    // If still checking, wait
    if (checkingOnboarding) {
      return;
    }

    setAddingToCart(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedVariant ? null : product?.id,
          variantId: selectedVariant || null,
          quantity: quantity,
        }),
      });

      if (response.ok) {
        toast.success("Added to cart successfully!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setIsOnboarded(true); // Update local state immediately
    toast.success("Profile completed! You can now add items to cart.");
  };

  if (!isLoaded || loading) {
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
          <Button onClick={() => router.push("/products")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const selectedVariantData = getSelectedVariantData();
  const images = getProductImages(product, selectedVariantData);
  const bookingAmountPerUnit = getProductBookingAmount(
    product,
    selectedVariantData
  );
  const priceRanges = getProductPriceRanges(product, selectedVariantData);
  const totalOrders = getTotalOrders(product, selectedVariantData);

  // Calculate quantity-based amounts
  const totalBookingAmount = safeNumber(bookingAmountPerUnit) * quantity;
  const currentPricePerUnit = getCurrentPrice(priceRanges, totalOrders);
  const totalCurrentPrice = currentPricePerUnit * quantity;
  const remainingAmount = totalCurrentPrice - totalBookingAmount;

  // Safe access to order count with fallback
  const orderCount = product._count?.orderItems ?? 0;

  // Determine button state and text
  const getButtonState = () => {
    if (addingToCart)
      return { disabled: true, text: "Adding to Cart...", showSpinner: true };
    if (checkingOnboarding)
      return { disabled: true, text: "Checking Status...", showSpinner: true };
    if (!userId)
      return {
        disabled: false,
        text: "Sign In to Add to Cart",
        showSpinner: false,
      };
    if (isOnboarded === false)
      return {
        disabled: false,
        text: "Complete Profile to Add to Cart",
        showSpinner: false,
      };
    if (product.hasVariants && !selectedVariant)
      return { disabled: true, text: "Select a Variant", showSpinner: false };
    return {
      disabled: false,
      text: `Add to Cart - ₹${safeToFixed(totalBookingAmount)}`,
      showSpinner: false,
    };
  };

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/products")}
            className="text-gray-600 hover:text-gray-900 p-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
              {images.length > 0 ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className={`aspect-square bg-white rounded-lg overflow-hidden cursor-pointer border-2 transition-colors ${
                      selectedImage === index
                        ? "border-green-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">
                    {orderCount} orders placed
                  </span>
                </div>

                {product.hasVariants && product.variants && (
                  <Badge variant="secondary">
                    {product.variants.length} Variants Available
                  </Badge>
                )}
              </div>

              {product.description && (
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Variants Selection */}
            {product.hasVariants &&
              product.variants &&
              product.variants.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Select Variant:
                  </Label>
                  <Select
                    value={selectedVariant}
                    onValueChange={(value) => {
                      setSelectedVariant(value);
                      setSelectedImage(0); // Reset image selection
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants
                        .filter((variant) => variant.isActive !== false) // Only show active variants
                        .map((variant) => (
                          <SelectItem key={variant.id} value={variant.id}>
                            {variant.name} - ₹
                            {safeToFixed(variant.bookingAmount)} booking/unit
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

            {/* Quantity Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Quantity:</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-medium text-lg min-w-[3rem] text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Booking: ₹{safeToFixed(bookingAmountPerUnit)} per unit
              </p>
            </div>

            <Separator />

            {/* Pricing Panel */}
            <PricingPanel ranges={priceRanges} totalOrders={totalOrders} />

            <Separator />

            {/* User's Order Calculation */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200 space-y-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Your Order Summary
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">
                    {quantity} units
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Current price per unit:</span>
                  <span className="font-medium text-gray-900">
                    ₹{safeToFixed(currentPricePerUnit)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total estimated cost:</span>
                  <span className="font-medium text-gray-900">
                    ₹{safeToFixed(totalCurrentPrice)}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between text-lg">
                  <span className="font-medium text-orange-600">
                    You pay now (booking):
                  </span>
                  <span className="font-bold text-orange-600">
                    ₹{safeToFixed(totalBookingAmount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Remaining amount (estimated):
                  </span>
                  <span className="font-medium text-gray-700">
                    ₹{safeToFixed(Math.max(0, remainingAmount))}
                  </span>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> You pay the booking amount now. The
                    remaining amount will be calculated based on final bulk
                    pricing and charged after order confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAddToCart}
                disabled={buttonState.disabled}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
              >
                {buttonState.showSpinner && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                )}
                <ShoppingCart className="w-5 h-5 mr-2" />
                {buttonState.text}
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push("/cart")}
                className="w-full h-12"
              >
                View Cart
              </Button>
            </div>

            {/* User Status Message */}
            {!userId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Sign in required:</strong> Please sign in to add items
                  to your cart.
                </p>
              </div>
            )}

            {userId && isOnboarded === false && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Complete your profile:</strong> Please fill in your
                  details to start shopping.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Bulk pricing available</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Quality guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600" />
                  <span>Fast delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}

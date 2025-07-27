// app/admin/products/[productId]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  useForm,
  useFieldArray,
  Controller,
  SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Upload,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import LoadingPage from "@/components/LoadingPage";
import { toast } from "sonner";
import Image from "next/image";

// Fixed validation schemas with strict typing
const priceRangeSchema = z.object({
  minQuantity: z.number().min(1, "Minimum quantity must be at least 1"),
  maxQuantity: z.number().nullable().optional(),
  pricePerUnit: z.number().min(0.01, "Price must be greater than 0"),
});

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  bookingAmount: z.number().min(0.01, "Booking amount must be greater than 0"),
  images: z.array(z.string()),
  isActive: z.boolean(),
  priceRanges: z
    .array(priceRangeSchema)
    .min(1, "At least one price range is required"),
});

// Main product schema - make all fields required except where explicitly optional
const productSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(255, "Name is too long"),
    description: z.string().optional(),
    images: z.array(z.string()),
    bookingAmount: z.number().nullable().optional(),
    hasVariants: z.boolean(),
    isActive: z.boolean(),
    variants: z.array(variantSchema),
    priceRanges: z.array(priceRangeSchema),
  })
  .refine(
    (data) => {
      if (data.hasVariants) {
        return data.variants && data.variants.length > 0;
      } else {
        return (
          data.bookingAmount !== null &&
          data.bookingAmount !== undefined &&
          data.bookingAmount > 0 &&
          data.priceRanges &&
          data.priceRanges.length > 0
        );
      }
    },
    {
      message: "Invalid product configuration",
      path: ["hasVariants"],
    }
  );

// Explicit type definition to match the schema exactly
type ProductFormData = {
  name: string;
  description?: string;
  images: string[];
  bookingAmount?: number | null;
  hasVariants: boolean;
  isActive: boolean;
  variants: Array<{
    name: string;
    bookingAmount: number;
    images: string[];
    isActive: boolean;
    priceRanges: Array<{
      minQuantity: number;
      maxQuantity?: number | null;
      pricePerUnit: number;
    }>;
  }>;
  priceRanges: Array<{
    minQuantity: number;
    maxQuantity?: number | null;
    pricePerUnit: number;
  }>;
};

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { userId, isLoaded, sessionClaims } = useAuth();
  const router = useRouter();

  const [productId, setProductId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);

  // Get user role
  const userRole = sessionClaims?.metadata?.role || "user";

  useEffect(() => {
    params.then(({ productId: id }) => {
      setProductId(id);
    });
  }, [params]);

  useEffect(() => {
    if (isLoaded) {
      if (!userId || userRole !== "admin") {
        router.push("/");
        return;
      }
      if (productId) {
        fetchProduct();
      }
    }
  }, [userId, isLoaded, userRole, productId]);

  // Fixed form initialization with explicit typing
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any, // Type assertion to fix resolver issue
    defaultValues: {
      hasVariants: false,
      isActive: true,
      variants: [],
      priceRanges: [],
      name: "",
      description: "",
      bookingAmount: null,
      images: [],
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
    watch,
    reset,
    setValue,
    clearErrors,
  } = form;

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: "variants",
  });

  const {
    fields: priceRangeFields,
    append: appendPriceRange,
    remove: removePriceRange,
  } = useFieldArray({
    control,
    name: "priceRanges",
  });

  const hasVariants = watch("hasVariants");
  const isActive = watch("isActive");

  // Fixed fetchProduct function
  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);

      if (response.ok) {
        const product = await response.json();

        // Create properly typed form data
        const formData: ProductFormData = {
          name: product.name,
          description: product.description || "",
          hasVariants: product.hasVariants,
          isActive: product.isActive ?? true,
          images: product.images || [],
          bookingAmount: product.bookingAmount,
          variants:
            product.variants?.map((variant: any) => ({
              name: variant.name,
              bookingAmount: variant.bookingAmount,
              isActive: variant.isActive ?? true,
              images: variant.images || [],
              priceRanges:
                variant.priceRanges?.map((pr: any) => ({
                  minQuantity: pr.minQuantity,
                  maxQuantity: pr.maxQuantity,
                  pricePerUnit: pr.pricePerUnit,
                })) || [],
            })) || [],
          priceRanges:
            product.priceRanges?.map((pr: any) => ({
              minQuantity: pr.minQuantity,
              maxQuantity: pr.maxQuantity,
              pricePerUnit: pr.pricePerUnit,
            })) || [],
        };

        // Reset form with validated data
        reset(formData);
        setProductImageUrls(product.images || []);
      } else if (response.status === 404) {
        toast.error("Product not found");
        router.push("/admin/products");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to load product");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  // Fixed hasVariants toggle useEffect
  useEffect(() => {
    if (hasVariants) {
      setValue("priceRanges", []);
      setValue("bookingAmount", null);
      clearErrors(["priceRanges", "bookingAmount"]);

      if (variantFields.length === 0) {
        appendVariant({
          name: "",
          bookingAmount: 0,
          isActive: true,
          images: [],
          priceRanges: [{ minQuantity: 1, maxQuantity: null, pricePerUnit: 0 }],
        });
      }
    } else {
      setValue("variants", []);
      clearErrors("variants");

      if (priceRangeFields.length === 0) {
        appendPriceRange({
          minQuantity: 1,
          maxQuantity: null,
          pricePerUnit: 0,
        });
      }
    }
  }, [
    hasVariants,
    setValue,
    clearErrors,
    appendVariant,
    appendPriceRange,
    variantFields.length,
    priceRangeFields.length,
  ]);

  const addProductImage = () => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      const newImages = [...productImageUrls, url.trim()];
      setProductImageUrls(newImages);
      setValue("images", newImages);
    }
  };

  const removeProductImage = (index: number) => {
    const newImages = productImageUrls.filter((_, i) => i !== index);
    setProductImageUrls(newImages);
    setValue("images", newImages);
  };

  const addVariantImage = (variantIndex: number) => {
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      const currentImages = watch(`variants.${variantIndex}.images`) || [];
      const newImages = [...currentImages, url.trim()];
      setValue(`variants.${variantIndex}.images`, newImages);
    }
  };

  const removeVariantImage = (variantIndex: number, imageIndex: number) => {
    const currentImages = watch(`variants.${variantIndex}.images`) || [];
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    setValue(`variants.${variantIndex}.images`, newImages);
  };

  // Fixed onSubmit with proper typing
  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    setSaving(true);

    try {
      // Validate required fields before submission
      if (data.hasVariants) {
        if (!data.variants || data.variants.length === 0) {
          toast.error(
            "At least one variant is required when variants are enabled"
          );
          setSaving(false);
          return;
        }

        // Check if all variants have valid data
        for (let i = 0; i < data.variants.length; i++) {
          const variant = data.variants[i];
          if (!variant.name.trim()) {
            toast.error(`Variant ${i + 1} name is required`);
            setSaving(false);
            return;
          }
          if (!variant.priceRanges || variant.priceRanges.length === 0) {
            toast.error(`Variant ${i + 1} must have at least one price range`);
            setSaving(false);
            return;
          }
        }
      } else {
        if (!data.bookingAmount || data.bookingAmount <= 0) {
          toast.error(
            "Booking amount is required for products without variants"
          );
          setSaving(false);
          return;
        }
        if (!data.priceRanges || data.priceRanges.length === 0) {
          toast.error("At least one price range is required");
          setSaving(false);
          return;
        }
      }

      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        hasVariants: data.hasVariants,
        isActive: data.isActive,
        images: data.hasVariants ? [] : productImageUrls,
        bookingAmount: data.hasVariants ? null : data.bookingAmount,
        variants: data.hasVariants
          ? data.variants?.map((variant) => ({
              name: variant.name.trim(),
              bookingAmount: variant.bookingAmount,
              isActive: variant.isActive,
              images: variant.images || [],
              priceRanges: variant.priceRanges.map((pr) => ({
                minQuantity: pr.minQuantity,
                maxQuantity:
                  pr.maxQuantity && pr.maxQuantity > 0 ? pr.maxQuantity : null,
                pricePerUnit: pr.pricePerUnit,
              })),
            }))
          : undefined,
        priceRanges: !data.hasVariants
          ? data.priceRanges?.map((pr) => ({
              minQuantity: pr.minQuantity,
              maxQuantity:
                pr.maxQuantity && pr.maxQuantity > 0 ? pr.maxQuantity : null,
              pricePerUnit: pr.pricePerUnit,
            }))
          : undefined,
      };

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Product updated successfully!");

        // Reset form to clear dirty state
        reset(data);

        // Navigate back after a short delay
        setTimeout(() => {
          router.push("/admin/products");
        }, 1000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to update product");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update product"
      );
    } finally {
      setSaving(false);
    }
  };

  const VariantPriceRanges = ({ variantIndex }: { variantIndex: number }) => {
    const {
      fields: priceRangeFields,
      append: appendPriceRange,
      remove: removePriceRange,
    } = useFieldArray({
      control,
      name: `variants.${variantIndex}.priceRanges`,
    });

    return (
      <div className="space-y-4">
        <Label className="text-base font-medium">
          Price Ranges for{" "}
          {watch(`variants.${variantIndex}.name`) || "this variant"}
        </Label>

        <div className="space-y-3">
          {priceRangeFields.map((priceRange, priceIndex) => {
            const isLastTier = priceIndex === priceRangeFields.length - 1;
            return (
              <div
                key={priceRange.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div>
                  <Label className="text-sm font-medium">Min Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(
                      `variants.${variantIndex}.priceRanges.${priceIndex}.minQuantity`,
                      { valueAsNumber: true }
                    )}
                    placeholder="1"
                  />
                  {errors.variants?.[variantIndex]?.priceRanges?.[priceIndex]
                    ?.minQuantity && (
                    <p className="text-red-500 text-xs mt-1">
                      {
                        errors.variants[variantIndex]?.priceRanges?.[priceIndex]
                          ?.minQuantity?.message
                      }
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium">Max Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(
                      `variants.${variantIndex}.priceRanges.${priceIndex}.maxQuantity`,
                      { valueAsNumber: true }
                    )}
                    placeholder={isLastTier ? "Leave empty" : "Optional"}
                    disabled={isLastTier}
                    className={isLastTier ? "bg-gray-100 text-gray-500" : ""}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">
                    Price per Unit (₹)
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register(
                      `variants.${variantIndex}.priceRanges.${priceIndex}.pricePerUnit`,
                      { valueAsNumber: true }
                    )}
                    placeholder="0.00"
                  />
                  {errors.variants?.[variantIndex]?.priceRanges?.[priceIndex]
                    ?.pricePerUnit && (
                    <p className="text-red-500 text-xs mt-1">
                      {
                        errors.variants[variantIndex]?.priceRanges?.[priceIndex]
                          ?.pricePerUnit?.message
                      }
                    </p>
                  )}
                </div>

                <div className="flex items-end">
                  {priceRangeFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePriceRange(priceIndex)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              appendPriceRange({
                minQuantity: 1,
                maxQuantity: null,
                pricePerUnit: 0,
              })
            }
            className="w-full"
            size="sm"
          >
            <Plus className="w-3 h-3 mr-2" />
            Add Price Range
          </Button>
        </div>
      </div>
    );
  };

  if (!isLoaded || loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/products")}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
              <p className="text-gray-600 mt-1">
                Update product information and pricing
              </p>
            </div>

            {isDirty && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <AlertCircle className="w-4 h-4" />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Rest of the form remains the same as previous version */}
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter product name"
                  maxLength={255}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Enter product description"
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {/* Product Status */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <Label htmlFor="isActive" className="text-base font-medium">
                    Product Status
                  </Label>
                  <p className="text-sm text-gray-600">
                    Only active products are visible to customers
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      isActive ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        id="isActive"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Product Variants Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <Label
                    htmlFor="hasVariants"
                    className="text-base font-medium"
                  >
                    Product Variants
                  </Label>
                  <p className="text-sm text-gray-600">
                    Enable if this product has multiple variants
                  </p>
                </div>
                <Controller
                  name="hasVariants"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="hasVariants"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>

              {!hasVariants && (
                <div>
                  <Label htmlFor="bookingAmount">Booking Amount (₹)</Label>
                  <Input
                    id="bookingAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register("bookingAmount", { valueAsNumber: true })}
                    placeholder="Enter booking amount"
                  />
                  {errors.bookingAmount && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.bookingAmount.message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Continue with rest of the form sections... */}
          {/* (The rest of the JSX remains identical to the previous version) */}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/products")}
              disabled={saving}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="text-sm text-gray-500">
                  You have unsaved changes
                </span>
              )}

              <Button
                type="submit"
                disabled={!isValid || saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Product
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

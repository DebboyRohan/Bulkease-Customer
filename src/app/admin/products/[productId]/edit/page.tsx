// app/admin/products/[productId]/edit/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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

// Validation schemas
const priceRangeSchema = z.object({
  minQuantity: z.number().min(1, "Minimum quantity must be at least 1"),
  maxQuantity: z.number().nullable().optional(),
  pricePerUnit: z.number().min(0.01, "Price must be greater than 0"),
});

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  bookingAmount: z.number().min(0.01, "Booking amount must be greater than 0"),
  images: z.array(z.string()),
  priceRanges: z
    .array(priceRangeSchema)
    .min(1, "At least one price range is required"),
});

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
    variants: z.array(variantSchema).optional(),
    priceRanges: z.array(priceRangeSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.hasVariants) {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one variant is required when variants are enabled",
          path: ["variants"],
        });
      }
    } else {
      if (!data.bookingAmount || data.bookingAmount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Booking amount is required for products without variants",
          path: ["bookingAmount"],
        });
      }
      if (!data.priceRanges || data.priceRanges.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one price range is required",
          path: ["priceRanges"],
        });
      }
    }
  });

type ProductFormData = z.infer<typeof productSchema>;

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

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      hasVariants: false,
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

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`);

      if (response.ok) {
        const product = await response.json();

        // Reset form with product data
        reset({
          name: product.name,
          description: product.description || "",
          hasVariants: product.hasVariants,
          images: product.images || [],
          bookingAmount: product.bookingAmount,
          variants:
            product.variants?.map((variant: any) => ({
              name: variant.name,
              bookingAmount: variant.bookingAmount,
              images: variant.images || [],
              priceRanges: variant.priceRanges.map((pr: any) => ({
                minQuantity: pr.minQuantity,
                maxQuantity: pr.maxQuantity,
                pricePerUnit: pr.pricePerUnit,
              })),
            })) || [],
          priceRanges:
            product.priceRanges?.map((pr: any) => ({
              minQuantity: pr.minQuantity,
              maxQuantity: pr.maxQuantity,
              pricePerUnit: pr.pricePerUnit,
            })) || [],
        });

        setProductImageUrls(product.images || []);
      } else if (response.status === 404) {
        toast.error("Product not found");
        router.push("/admin/products");
      } else {
        toast.error("Failed to load product");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  // Handle variants toggle
  useEffect(() => {
    if (hasVariants) {
      setValue("priceRanges", []);
      setValue("bookingAmount", null);
      clearErrors(["priceRanges", "bookingAmount"]);

      if (variantFields.length === 0) {
        appendVariant({
          name: "",
          bookingAmount: 0,
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
    appendVariant,
    appendPriceRange,
    setValue,
    clearErrors,
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

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);

    try {
      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        hasVariants: data.hasVariants,
        images: data.hasVariants ? [] : productImageUrls,
        bookingAmount: data.hasVariants ? null : data.bookingAmount,
        variants: data.hasVariants
          ? data.variants?.map((variant) => ({
              name: variant.name.trim(),
              bookingAmount: variant.bookingAmount,
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
        router.push("/admin/products");
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

          {/* Product Images (for non-variant products) */}
          {!hasVariants && (
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addProductImage}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Image URL
                  </Button>

                  {productImageUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {productImageUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full h-24 bg-gray-100 rounded-lg overflow-hidden border">
                            <Image
                              src={url}
                              alt={`Product ${index + 1}`}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeProductImage(index)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Variants */}
          {hasVariants && (
            <Card>
              <CardHeader>
                <CardTitle>Product Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {variantFields.map((variant, variantIndex) => (
                    <Card
                      key={variant.id}
                      className="border-2 border-dashed border-gray-300"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            Variant {variantIndex + 1}
                          </CardTitle>
                          {variantFields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeVariant(variantIndex)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Variant Name</Label>
                            <Input
                              {...register(`variants.${variantIndex}.name`)}
                              placeholder="e.g., Red, Large, etc."
                              maxLength={100}
                            />
                            {errors.variants?.[variantIndex]?.name && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.variants[variantIndex]?.name?.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label>Booking Amount (₹)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              {...register(
                                `variants.${variantIndex}.bookingAmount`,
                                {
                                  valueAsNumber: true,
                                }
                              )}
                              placeholder="0.00"
                            />
                            {errors.variants?.[variantIndex]?.bookingAmount && (
                              <p className="text-red-500 text-sm mt-1">
                                {
                                  errors.variants[variantIndex]?.bookingAmount
                                    ?.message
                                }
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Variant Images */}
                        <div>
                          <Label className="text-base font-medium mb-3 block">
                            Variant Images
                          </Label>
                          <div className="space-y-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addVariantImage(variantIndex)}
                              size="sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Add Image URL
                            </Button>

                            {watch(`variants.${variantIndex}.images`)?.length >
                              0 && (
                              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {watch(`variants.${variantIndex}.images`).map(
                                  (url: string, imageIndex: number) => (
                                    <div
                                      key={imageIndex}
                                      className="relative group"
                                    >
                                      <div className="w-full h-16 bg-gray-100 rounded-lg overflow-hidden border">
                                        <Image
                                          src={url}
                                          alt={`Variant ${
                                            variantIndex + 1
                                          } Image ${imageIndex + 1}`}
                                          width={64}
                                          height={64}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display =
                                              "none";
                                          }}
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 p-0"
                                        onClick={() =>
                                          removeVariantImage(
                                            variantIndex,
                                            imageIndex
                                          )
                                        }
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Variant Price Ranges */}
                        <VariantPriceRanges variantIndex={variantIndex} />
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendVariant({
                        name: "",
                        bookingAmount: 0,
                        images: [],
                        priceRanges: [
                          {
                            minQuantity: 1,
                            maxQuantity: null,
                            pricePerUnit: 0,
                          },
                        ],
                      })
                    }
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Variant
                  </Button>

                  {errors.variants && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errors.variants.message ||
                          "Please check variant information"}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Price Ranges (for non-variant products) */}
          {!hasVariants && (
            <Card>
              <CardHeader>
                <CardTitle>Price Ranges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceRangeFields.map((priceRange, index) => {
                    const isLastTier = index === priceRangeFields.length - 1;
                    return (
                      <div
                        key={priceRange.id}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div>
                          <Label className="text-sm font-medium">
                            Min Quantity
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            {...register(`priceRanges.${index}.minQuantity`, {
                              valueAsNumber: true,
                            })}
                            placeholder="1"
                          />
                          {errors.priceRanges?.[index]?.minQuantity && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.priceRanges[index]?.minQuantity?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Max Quantity
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            {...register(`priceRanges.${index}.maxQuantity`, {
                              valueAsNumber: true,
                            })}
                            placeholder={
                              isLastTier ? "Leave empty" : "Optional"
                            }
                            disabled={isLastTier}
                            className={
                              isLastTier ? "bg-gray-100 text-gray-500" : ""
                            }
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
                            {...register(`priceRanges.${index}.pricePerUnit`, {
                              valueAsNumber: true,
                            })}
                            placeholder="0.00"
                          />
                          {errors.priceRanges?.[index]?.pricePerUnit && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.priceRanges[index]?.pricePerUnit?.message}
                            </p>
                          )}
                        </div>

                        <div className="flex items-end">
                          {priceRangeFields.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePriceRange(index)}
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

                  {errors.priceRanges && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {errors.priceRanges.message ||
                          "Please check price range information"}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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

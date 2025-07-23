// components/admin/CreateProductModal.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Minus, Upload, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const priceRangeSchema = z.object({
  minQuantity: z.coerce.number().min(1, "Minimum quantity must be at least 1"),
  maxQuantity: z.coerce.number().optional().nullable(),
  pricePerUnit: z.coerce.number().min(0.01, "Price must be greater than 0"),
});

const variantSchema = z.object({
  name: z.string().min(1, "Variant name is required"),
  bookingAmount: z.coerce
    .number()
    .min(0.01, "Booking amount must be greater than 0"),
  images: z.array(z.string()).default([]),
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
    images: z.array(z.string()).default([]),
    bookingAmount: z.coerce.number().optional().nullable(),
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
        return;
      }
      if (data.bookingAmount !== null && data.bookingAmount !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Products with variants should not have a booking amount",
          path: ["bookingAmount"],
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

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [productImageUrls, setProductImageUrls] = useState<string[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      hasVariants: false,
      variants: [],
      priceRanges: [{ minQuantity: 1, maxQuantity: null, pricePerUnit: 0 }],
      name: "",
      description: "",
      bookingAmount: 0,
      images: [],
    },
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    reset,
    setValue,
    clearErrors,
    getValues,
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
      setValue("bookingAmount", 0);
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
    setLoading(true);

    try {
      const formValues = getValues();

      // Create the payload with proper typing
      const payload: {
        name: string;
        description: string;
        hasVariants: boolean;
        images?: string[];
        bookingAmount?: number | null;
        variants?: Array<{
          name: string;
          bookingAmount: number;
          images: string[];
          priceRanges: Array<{
            minQuantity: number;
            maxQuantity: number | null;
            pricePerUnit: number;
          }>;
        }>;
        priceRanges?: Array<{
          minQuantity: number;
          maxQuantity: number | null;
          pricePerUnit: number;
        }>;
      } = {
        name: formValues.name.trim(),
        description: formValues.description?.trim() || "",
        hasVariants: formValues.hasVariants,
      };

      if (formValues.hasVariants) {
        payload.images = [];
        payload.bookingAmount = null;

        if (!formValues.variants || formValues.variants.length === 0) {
          throw new Error("At least one variant is required");
        }

        payload.variants = formValues.variants.map((variant) => ({
          name: variant.name.trim(),
          bookingAmount: Number(variant.bookingAmount),
          images: variant.images || [],
          priceRanges: variant.priceRanges.map((pr) => ({
            minQuantity: Number(pr.minQuantity),
            maxQuantity:
              pr.maxQuantity && pr.maxQuantity > 0
                ? Number(pr.maxQuantity)
                : null,
            pricePerUnit: Number(pr.pricePerUnit),
          })),
        }));
      } else {
        payload.images = productImageUrls;
        payload.bookingAmount = Number(formValues.bookingAmount);

        if (!formValues.priceRanges || formValues.priceRanges.length === 0) {
          throw new Error("At least one price range is required");
        }

        payload.priceRanges = formValues.priceRanges.map((pr) => ({
          minQuantity: Number(pr.minQuantity),
          maxQuantity:
            pr.maxQuantity && pr.maxQuantity > 0
              ? Number(pr.maxQuantity)
              : null,
          pricePerUnit: Number(pr.pricePerUnit),
        }));
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Product created successfully!");
        onSuccess();
        handleClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to create product");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create product"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset({
        hasVariants: false,
        variants: [],
        priceRanges: [{ minQuantity: 1, maxQuantity: null, pricePerUnit: 0 }],
        name: "",
        description: "",
        bookingAmount: 0,
        images: [],
      });
      setProductImageUrls([]);
      onClose();
    }
  };

  // Child component for variant price ranges to avoid hooks issues
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
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg bg-white"
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
                    className={isLastTier ? "bg-gray-50 text-gray-500" : ""}
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
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

          {hasVariants ? (
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
                      <CardContent className="space-y-4">
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
                              placeholder="Enter booking amount"
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

                        <div>
                          <Label className="text-base font-medium">
                            Variant Images
                          </Label>
                          <div className="mt-2 space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addVariantImage(variantIndex)}
                              className="w-full"
                              size="sm"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Add Image URL
                            </Button>

                            {watch(`variants.${variantIndex}.images`)?.length >
                              0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {watch(`variants.${variantIndex}.images`).map(
                                  (url: string, imageIndex: number) => (
                                    <div
                                      key={imageIndex}
                                      className="relative group"
                                    >
                                      <img
                                        src={url}
                                        alt={`Variant ${
                                          variantIndex + 1
                                        } Image ${imageIndex + 1}`}
                                        className="w-full h-20 object-cover rounded-lg border"
                                      />
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() =>
                                          removeVariantImage(
                                            variantIndex,
                                            imageIndex
                                          )
                                        }
                                      >
                                        <X className="w-2 h-2" />
                                      </Button>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </div>

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
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Price Ranges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priceRangeFields.map((field, index) => {
                    const isLastTier = index === priceRangeFields.length - 1;
                    return (
                      <div
                        key={field.id}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg bg-white"
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
                              isLastTier ? "bg-gray-50 text-gray-500" : ""
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
                            <p className="text-xs text-red-500 mt-1">
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
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Price Range
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix the form errors before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !isValid}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

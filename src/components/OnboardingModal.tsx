// components/OnboardingModal.tsx

"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Hall } from "@/generated/prisma";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UserCheck, MapPin, Phone, Mail, CreditCard } from "lucide-react";
import { toast } from "sonner";

const onboardingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  roll: z.string().min(1, "Roll number is required"),
  hall: z.nativeEnum(Hall, {
    error: () => ({ message: "Please select a hall" }),
  }),
});
type OnboardingFormData = z.infer<typeof onboardingSchema>;

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function OnboardingModal({
  isOpen,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      phone: "",
      roll: "",
      hall: undefined,
    },
  });

  const onSubmit = async (data: OnboardingFormData) => {
    console.log("Submitting onboarding data:", data);
    setLoading(true);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Success result:", result);
        toast.success("Profile completed successfully!");
        reset();
        onComplete();
      } else {
        const error = await response.json();
        console.error("Error response:", error);
        toast.error(error.error || "Failed to complete profile");
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold">
                Complete Your Profile
              </DialogTitle>
              <p className="text-sm text-gray-600 mt-1">
                Help us serve you better with bulk deals
              </p>
            </div>
          </div>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label
                  htmlFor="name"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="w-4 h-4" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="phone"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="roll"
                  className="flex items-center gap-2 text-sm font-medium"
                >
                  <CreditCard className="w-4 h-4" />
                  Roll Number *
                </Label>
                <Input
                  id="roll"
                  {...register("roll")}
                  placeholder="Enter your roll number"
                  disabled={loading}
                />
                {errors.roll && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.roll.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <MapPin className="w-4 h-4" />
                  Hall of Residence *
                </Label>
                <Controller
                  name="hall"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your hall" />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {Object.values(Hall).map((hall) => (
                          <SelectItem key={hall} value={hall}>
                            {hall}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.hall && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hall.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Why we need this:</strong> Your details help us
                  organize bulk orders efficiently and ensure proper delivery to
                  your location.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 h-11"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Completing Profile...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-2" />
                    Complete Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

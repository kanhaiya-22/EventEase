"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelRegistration } from "@/lib/actions/cancel-registration";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";
import { toast } from "sonner";

interface CancelRegistrationButtonProps {
  registrationId: string;
  eventTitle: string;
}

export function CancelRegistrationButton({
  registrationId,
  eventTitle,
}: CancelRegistrationButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm(`Cancel your registration for "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const result = await cancelRegistration(registrationId);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={loading}
      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
    >
      <XCircle className="h-4 w-4 mr-1" />
      {loading ? "Cancelling..." : "Cancel Registration"}
    </Button>
  );
}

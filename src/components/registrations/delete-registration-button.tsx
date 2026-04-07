"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRegistration } from "@/lib/actions/registrations";
import { Trash2, Loader, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface DeleteRegistrationButtonProps {
  registrationId: string;
  eventId: string;
  studentName: string;
  studentEmail: string;
}

export default function DeleteRegistrationButton({
  registrationId,
  eventId,
  studentName,
  studentEmail,
}: DeleteRegistrationButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteRegistration(registrationId, eventId);

      if (result.success) {
        toast.success(result.message);
        setShowDialog(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error deleting registration");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        title="Delete registration"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {/* Confirmation Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowDialog(false)}
          />

          {/* Dialog */}
          <div className="fixed z-50 bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-semibold text-lg text-gray-900">
                  Delete Registration
                </h2>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the registration for:
              </p>

              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <p className="font-medium text-gray-900">{studentName}</p>
                <p className="text-sm text-gray-600">{studentEmail}</p>
              </div>

              <p className="text-sm text-red-600 font-medium">
                ⚠️ This action cannot be undone. The student will be notified of the cancellation.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowDialog(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Registration
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

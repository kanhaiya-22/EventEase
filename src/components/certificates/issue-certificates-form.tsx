"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
  };
}

interface IssueCertificatesFormProps {
  eventId: string;
  eventTitle: string;
  registeredStudents: Student[];
}

export default function IssueCertificatesForm({
  eventId,
  eventTitle,
  registeredStudents,
}: IssueCertificatesFormProps) {
  const router = useRouter();
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [issuing, setIssuing] = useState(false);

  const handleSelectStudent = (userId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === registeredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(registeredStudents.map((student) => student.user.id));
    }
  };

  const handleIssueCertificates = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setIssuing(true);
    try {
      const res = await fetch(`/api/events/${eventId}/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudents,
          eventId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Certificates issued to ${data.count} student(s)`);
        setSelectedStudents([]);
        // Refresh the page
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to issue certificates");
      }
    } catch (error) {
      toast.error("Error issuing certificates");
      console.error(error);
    } finally {
      setIssuing(false);
    }
  };

  const allSelected = selectedStudents.length === registeredStudents.length;

  return (
    <>
      {/* Students List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Select Students</CardTitle>
            <div className="text-sm text-muted-foreground">
              {selectedStudents.length} selected
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-3 pb-4 border-b">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              />
              <label className="font-medium cursor-pointer">
                Select All ({registeredStudents.length} present)
              </label>
            </div>

            {/* Student List */}
            <div className="space-y-3">
              {registeredStudents.map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(registration.user.id)}
                    onChange={() => handleSelectStudent(registration.user.id)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{registration.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {registration.user.email}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {registration.user.department || "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleIssueCertificates}
          disabled={selectedStudents.length === 0 || issuing}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          {issuing ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Issuing Certificates...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Issue Certificates ({selectedStudents.length})
            </>
          )}
        </Button>
        <Link href={`/organized-events/${eventId}/students`}>
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
    </>
  );
}

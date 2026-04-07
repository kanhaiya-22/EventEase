"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";

export function VerifyForm() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) {
      router.push(`/verify/${trimmed}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          required
          autoFocus
        />
      </div>
      <Button type="submit" className="w-full" disabled={!code.trim()}>
        <Search className="h-4 w-4 mr-2" />
        Verify
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        The verification code is printed on the certificate, usually at the bottom.
      </p>
    </form>
  );
}

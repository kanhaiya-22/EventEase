import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Mail, Award } from "lucide-react";

export const metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: {
      org: { select: { slug: true, name: true } },
      _count: {
        select: {
          registrations: { where: { status: { not: "CANCELLED" } } },
          certificates: true,
          organizedEvents: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-6 pt-6">
          <Avatar className="h-20 w-20">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback className="text-2xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-muted-foreground flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{user.role}</Badge>
              {user.org && <Badge variant="outline">{user.org.name}</Badge>}
            </div>
          </div>
          <div className="hidden sm:flex gap-6 text-center">
            <div>
              <p className="text-2xl font-bold">{user._count.registrations}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Events
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">{user._count.certificates}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" /> Certificates
              </p>
            </div>
            {user.role !== "STUDENT" && (
              <div>
                <p className="text-2xl font-bold">{user._count.organizedEvents}</p>
                <p className="text-xs text-muted-foreground">Organized</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ProfileForm
        user={{
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          phone: user.phone,
          interests: user.interests,
          organizationSlug: user.org?.slug ?? null,
          organizationName: user.org?.name ?? null,
        }}
      />
    </div>
  );
}

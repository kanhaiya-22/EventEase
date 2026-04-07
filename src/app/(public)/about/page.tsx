import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Calendar,
  Users,
  QrCode,
  Award,
  BarChart3,
  Bell,
  Shield,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "About",
};

const stats = [
  { label: "Events Managed", value: "500+", icon: Calendar },
  { label: "Students Served", value: "10,000+", icon: Users },
  { label: "Certificates Issued", value: "8,000+", icon: Award },
  { label: "QR Check-ins", value: "25,000+", icon: QrCode },
];

const features = [
  {
    icon: Calendar,
    title: "Full Event Lifecycle",
    description:
      "From draft to archive — create, publish, manage, and complete events with a clear status workflow. No more lost spreadsheets.",
  },
  {
    icon: Users,
    title: "Instant Registration",
    description:
      "Students register in one click. Organizers get real-time participant lists with department, year, and contact details.",
  },
  {
    icon: QrCode,
    title: "QR-Based Attendance",
    description:
      "Every registration generates a unique QR code. Scan at the door or let students self-check-in — no proxy entries possible.",
  },
  {
    icon: Award,
    title: "Verified Certificates",
    description:
      "Issue certificates to attended students with unique verification codes. Anyone can verify authenticity via a public link.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Export",
    description:
      "Track registrations, attendance rates, and capacity in real-time. Export student lists to CSV for offline use.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "In-app notification bell with unread badges. Students get notified on registration, cancellation, and certificate issuance.",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description:
      "Three distinct roles — Students browse and register, Organizers create and manage, Admins oversee the platform.",
  },
  {
    icon: Zap,
    title: "Duplicate & Reuse",
    description:
      "Running a weekly workshop? Duplicate any event as a draft with one click and adjust the dates. No re-creation needed.",
  },
];

const roles = [
  {
    title: "Students",
    description: "Browse events, register instantly, get QR codes, self-check-in, view certificates, manage your profile.",
    color: "bg-blue-500",
  },
  {
    title: "Organizers",
    description: "Create events, track registrations, scan QR attendance, issue certificates, export data, duplicate events.",
    color: "bg-green-500",
  },
  {
    title: "Admins",
    description: "Approve events, manage users across the platform, access analytics, and oversee all operations.",
    color: "bg-purple-500",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            About EventEase
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            A unified platform for managing the complete college event lifecycle —
            replacing WhatsApp groups, Google Forms, and manual spreadsheets with
            one professional solution.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            Three simple steps to go from event idea to certificates in hand.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-lg mb-2">Create & Publish</h3>
              <p className="text-sm text-muted-foreground">
                Organizers create events with all details — dates, venue, capacity, posters, and documents. Publish when ready.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-lg mb-2">Register & Attend</h3>
              <p className="text-sm text-muted-foreground">
                Students discover events, register in one click, get unique QR codes, and check in at the venue.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-lg mb-2">Certify & Analyze</h3>
              <p className="text-sm text-muted-foreground">
                After the event, organizers issue verified certificates and review analytics — attendance rates, exports, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/40 border-t">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Platform Features</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            Everything a college needs to run events professionally.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="border shadow-sm">
                <CardContent className="pt-6">
                  <feature.icon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Built for Every Role</h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-16">
            Each user gets a tailored experience based on their role.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {roles.map((role) => (
              <Card key={role.title} className="overflow-hidden">
                <div className={`h-2 ${role.color}`} />
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">{role.title}</h3>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            Join your college community on EventEase and start managing events the right way.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">Create Account</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-slate-500 hover:bg-slate-700 hover:text-white bg-transparent" asChild>
              <Link href="/events">Browse Events</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

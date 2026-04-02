import Link from "next/link";
import Image from "next/image";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  QrCode,
  Award,
  BarChart3,
  Bell,
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Event Lifecycle",
    description:
      "Create, approve, publish, and archive events with a clear workflow.",
  },
  {
    icon: Users,
    title: "One-Click Registration",
    description:
      "Students register instantly. Organizers see real-time participant lists.",
  },
  {
    icon: QrCode,
    title: "QR Attendance",
    description:
      "Unique, single-use QR codes eliminate proxy entries and speed up check-in.",
  },
  {
    icon: Award,
    title: "Auto Certificates",
    description:
      "Generate and distribute verified certificates seconds after an event ends.",
  },
  {
    icon: BarChart3,
    title: "Live Dashboards",
    description:
      "Real-time analytics on registrations, attendance, and event popularity.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Email and in-app reminders for deadlines, updates, and certificates.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
              Built for colleges that care about events
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Manage college events
              <br />
              <span className="text-primary">without the chaos</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              One platform for the entire event lifecycle — creation, approval,
              registration, attendance, and certificates. No more WhatsApp
              groups, Google Forms, and manual spreadsheets.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/register">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-muted-foreground">
              Replace 5+ disconnected tools with one unified platform.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to simplify event management?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join colleges that have moved from spreadsheets to a real platform.
          </p>
          <Button size="lg" className="mt-8" asChild>
            <Link href="/register">Create Your Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="EventEase" width={24} height={24} />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EventEase
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/events" className="hover:text-foreground">
              Events
            </Link>
            <Link href="#features" className="hover:text-foreground">
              Features
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

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
  ArrowRight,
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
        {/* Soft, soothing background wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.97_0_0)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,oklch(0.22_0_0)_0%,transparent_70%)]"
        />
        {/* Ambient drifting orbs — slow, calm */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/4 -z-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl animate-drift dark:bg-emerald-400/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 right-1/4 -z-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl animate-drift-reverse dark:bg-sky-400/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />

        <div className="container mx-auto px-6 py-28 md:py-36">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <div className="group mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3.5 py-1 text-xs font-medium text-muted-foreground backdrop-blur transition-all hover:border-foreground/20 hover:text-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 animate-pulse-soft" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Built for colleges that care about events
            </div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Manage college events
              <br />
              <span className="bg-gradient-to-r from-muted-foreground via-foreground/70 to-muted-foreground bg-clip-text text-transparent animate-gradient-pan">
                without the chaos
              </span>
            </h1>
            <p
              className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg animate-fade-up"
              style={{ animationDelay: "120ms" }}
            >
              One quiet platform for the entire event lifecycle — creation,
              approval, registration, attendance, and certificates.
            </p>
            <div
              className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row animate-fade-up"
              style={{ animationDelay: "220ms" }}
            >
              <Button size="lg" className="group gap-1.5" asChild>
                <Link href="/register">
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/events">Browse Events</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60">
        <div className="container mx-auto px-6 py-24">
          <div
            className="mx-auto mb-16 max-w-xl text-center animate-fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              What&apos;s inside
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Replace five disconnected tools with one calm, unified platform.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <div
                key={feature.title}
                className="group relative bg-background p-7 transition-colors duration-300 hover:bg-muted/40 animate-fade-up"
                style={{ animationDelay: `${120 + idx * 60}ms` }}
              >
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-sm">
                  <feature.icon
                    className="h-[18px] w-[18px] transition-transform duration-500 group-hover:scale-110"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="text-[15px] font-semibold tracking-tight text-foreground transition-colors group-hover:text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-7 bottom-5 h-px origin-left scale-x-0 bg-gradient-to-r from-foreground/30 to-transparent transition-transform duration-500 group-hover:scale-x-100"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/60">
        <div className="container mx-auto px-6 py-24 text-center">
          <div className="mx-auto max-w-xl animate-fade-up">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ready to simplify event management?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Join colleges that have moved from spreadsheets to a real platform.
            </p>
            <Button size="lg" className="group mt-9 gap-1.5" asChild>
              <Link href="/register">
                Create Your Account
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="EventEase" width={22} height={22} />
            <span className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EventEase
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/events" className="transition-colors hover:text-foreground">
              Events
            </Link>
            <Link href="/about" className="transition-colors hover:text-foreground">
              About
            </Link>
            <Link href="/contact" className="transition-colors hover:text-foreground">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

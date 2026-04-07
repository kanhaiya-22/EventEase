import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MapPin, Clock, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Contact Us
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Have questions, feedback, or need help? We're here for you.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-6">Get in Touch</h2>
                <p className="text-muted-foreground mb-8">
                  Whether you're a student looking for help, an organizer with a feature request,
                  or an institution interested in adopting EventEase — reach out to us.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      support@eventease.college
                    </p>
                    <p className="text-muted-foreground text-sm">
                      For technical issues and general inquiries.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      IET Lucknow
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Sitapur Road, Lucknow, Uttar Pradesh, India
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Response Time</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      We typically respond within 24 hours on weekdays.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Feedback</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Have a feature suggestion or found a bug? We'd love to hear from you.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-muted/40 border-t">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">How do I register for an event?</h3>
              <p className="text-sm text-muted-foreground">
                Create an account as a Student, browse available events, and click "Register Now"
                on any event page. You'll receive a unique QR code for check-in.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How do I create events as an organizer?</h3>
              <p className="text-sm text-muted-foreground">
                Sign up as an Organizer, go to your dashboard, and click "Create Event". Fill
                in the details, upload a poster, and publish when ready.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does QR attendance work?</h3>
              <p className="text-sm text-muted-foreground">
                Each registration generates a unique QR code. At the event, organizers scan
                it or students self-check-in within 15 minutes of the start time.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How can I verify a certificate?</h3>
              <p className="text-sm text-muted-foreground">
                Every certificate has a unique verification code. Visit the "Verify Certificate"
                page in the navbar and enter the code to confirm authenticity.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I cancel my registration?</h3>
              <p className="text-sm text-muted-foreground">
                Yes. Go to "My Registrations" in your dashboard and click "Cancel Registration"
                on any upcoming event. The organizer will be notified.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is EventEase free to use?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! EventEase is free for students and organizers. Institutions can request
                custom deployments by contacting us.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactForm() {
  return (
    <form
      action="https://formsubmit.co/support@eventease.college"
      method="POST"
      className="space-y-4"
    >
      <input type="hidden" name="_captcha" value="false" />
      <input type="hidden" name="_next" value="https://eventease.college/contact?sent=true" />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="Your name"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            placeholder="you@college.edu"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="subject" className="text-sm font-medium">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          placeholder="What's this about?"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us more..."
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[120px]"
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
      >
        Send Message
      </button>
    </form>
  );
}

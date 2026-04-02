import { Logo } from "@/components/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12 text-primary-foreground">
        <Logo size="lg" className="text-primary-foreground" />
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Manage college events
            <br />
            the smart way.
          </h1>
          <p className="mt-4 text-lg opacity-80">
            One platform for creation, registration, attendance, and certificates.
          </p>
        </div>
        <p className="text-sm opacity-60">
          &copy; {new Date().getFullYear()} EventEase
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden mb-8">
            <Logo size="lg" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

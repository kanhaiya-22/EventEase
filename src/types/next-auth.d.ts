import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
      role: "STUDENT" | "ORGANIZER" | "ADMIN";
      department?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "STUDENT" | "ORGANIZER" | "ADMIN";
    department?: string;
  }
}

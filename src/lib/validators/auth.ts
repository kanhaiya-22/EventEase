import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    role: z.enum(["STUDENT", "ORGANIZER"]).default("STUDENT"),
    department: z.string().optional(),
    year: z.string().optional(),
    // Organizer-specific fields
    collegeName: z.string().optional(),
    designation: z.string().optional(),
    organizationWeb: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    reason: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "ORGANIZER") {
        return !!data.collegeName && data.collegeName.length >= 2;
      }
      return true;
    },
    { message: "College/Organization name is required", path: ["collegeName"] }
  )
  .refine(
    (data) => {
      if (data.role === "ORGANIZER") {
        return !!data.designation && data.designation.length >= 2;
      }
      return true;
    },
    { message: "Designation/Role is required", path: ["designation"] }
  )
  .refine(
    (data) => {
      if (data.role === "ORGANIZER") {
        return !!data.reason && data.reason.length >= 10;
      }
      return true;
    },
    { message: "Please explain why you want to be an organizer (min 10 characters)", path: ["reason"] }
  );

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

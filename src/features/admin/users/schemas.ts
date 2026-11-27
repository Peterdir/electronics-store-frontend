import { z } from "zod";

export const userActionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("status"), value: z.enum(["ACTIVE", "INACTIVE"]) }),
  z.object({ kind: z.literal("role"), value: z.enum(["ADMIN", "MANAGER", "STAFF", "CUSTOMER"]) }),
]);

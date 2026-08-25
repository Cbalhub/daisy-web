import { z } from "zod";

export const quickReplySchema = z.object({
  label: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(1000),
  order: z.number().int().min(0).max(9999).default(0),
});

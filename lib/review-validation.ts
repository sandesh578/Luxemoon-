import { z } from "zod";

function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

const NameSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(z.string().min(2).max(100));

const CommentSchema = z
  .string()
  .transform(sanitizeText)
  .pipe(z.string().min(10).max(2000));

const AddressSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" ? sanitizeText(value) : ""))
  .pipe(z.string().max(100))
  .transform((value) => (value.length > 0 ? value : null));

const VideoSchema = z
  .union([z.string().url(), z.literal(""), z.null(), z.undefined()])
  .transform((value) => (typeof value === "string" && value.length > 0 ? value : null));

export const ReviewSchema = z.object({
  productId: z.string().trim().min(1),
  userName: NameSchema,
  address: AddressSchema,
  rating: z.coerce.number().int().min(1).max(5),
  comment: CommentSchema,
  images: z.array(z.string().url()).max(3).default([]),
  video: VideoSchema,
});

export type ReviewInput = z.infer<typeof ReviewSchema>;

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { verifyAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UploadSchema = z.object({
  context: z.enum(["products", "reviews", "logos"]),
  assetType: z.enum(["image", "video"]).default("image"),
});

const REVIEW_HOURLY_LIMIT = 5;
const ADMIN_HOURLY_LIMIT = 20;

const REVIEW_IMAGE_LIMIT = 3;
const REVIEW_VIDEO_LIMIT = 1;

function getClientIp(headersList: Headers): string {
  const forwardedFor = headersList.get("x-forwarded-for");
  return forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";
}

async function enforceRateLimit(ip: string, marker: string, limit: number) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.loginAttempt.count({
    where: {
      ip,
      email: marker,
      createdAt: { gt: oneHourAgo },
    },
  });

  if (count >= limit) {
    throw new Error("RATE_LIMITED");
  }
}

async function recordUploadAttempt(ip: string, marker: string) {
  await prisma.loginAttempt.create({
    data: {
      ip,
      email: marker,
      success: true,
    },
  });
}

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = getClientIp(headersList);
    const body = await req.json().catch(() => ({}));
    const data = UploadSchema.parse(body);

    const isAdminContext = data.context === "products" || data.context === "logos";
    if (isAdminContext) {
      await verifyAdmin();
      await enforceRateLimit(ip, "upload:admin", ADMIN_HOURLY_LIMIT);
    } else {
      await enforceRateLimit(ip, "upload:review", REVIEW_HOURLY_LIMIT);
      if (data.assetType === "image") {
        await enforceRateLimit(ip, "upload:review:image", REVIEW_IMAGE_LIMIT);
      } else {
        await enforceRateLimit(ip, "upload:review:video", REVIEW_VIDEO_LIMIT);
      }
    }

    const folder = `luxemoon/${data.context}`;
    const resourceType = data.assetType;
    const allowedFormats = data.assetType === "image" ? "jpg,jpeg,png,webp" : "mp4";
    const maxFileSize = data.assetType === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;

    const cloudinary = getCloudinary();
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !cloudName || !apiSecret) {
      return NextResponse.json(
        { error: "Cloudinary is not configured." },
        { status: 500 }
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const signatureParams = {
      timestamp,
      folder,
      allowed_formats: allowedFormats,
      max_file_size: maxFileSize,
      resource_type: resourceType,
    };

    const signature = cloudinary.utils.api_sign_request(signatureParams, apiSecret);

    if (isAdminContext) {
      await recordUploadAttempt(ip, "upload:admin");
    } else {
      await recordUploadAttempt(ip, "upload:review");
      await recordUploadAttempt(ip, `upload:review:${data.assetType}`);
    }

    return NextResponse.json({
      timestamp,
      signature,
      apiKey,
      cloudName,
      folder,
      resourceType,
      allowedFormats: allowedFormats.split(","),
      maxFileSize,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid upload request", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      return NextResponse.json(
        { error: "Upload limit exceeded. Please try again later." },
        { status: 429 }
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("Missing Cloudinary environment variables")
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}


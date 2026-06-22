import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getAdminPayload, adminUnauthorized } from "@/lib/adminAuth";

cloudinary.config({
  cloud_name: "doh00coks",
  api_key: "111473792778163",
  api_secret: "X3yN-IAaw6rsWtz_7X3-9dcQYoQ",
});

export async function POST(req: NextRequest) {
  const admin = await getAdminPayload();
  if (!admin) return adminUnauthorized();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await new Promise<{ secure_url: string; public_id: string }>(
    (resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "danilkravafit" },
        (error, result) => {
          if (error || !result) return reject(new Error(error?.message ?? "Upload failed"));
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
    }
  );

  return NextResponse.json(result);
}

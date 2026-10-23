// Image uploads for the admin.
//  • On Vercel (BLOB_READ_WRITE_TOKEN set): browser uploads straight to Vercel Blob. This route only
//    issues short-lived upload tokens to logged-in staff — the file never passes through the function,
//    so the 4.5 MB serverless body limit doesn't apply.
//  • Local dev without Blob: multipart upload saved to ./data/uploads and served from /uploads/….
import fs from "node:fs";
import path from "node:path";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { currentUser } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/db";
import { token } from "@/lib/util";

const MAX = 15 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function mode(): "blob" | "local" | "none" {
  if (process.env.BLOB_READ_WRITE_TOKEN) return "blob";
  return process.env.VERCEL ? "none" : "local";
}

async function staff() {
  const u = await currentUser();
  return u && u.role !== "door" ? u : null;
}

export async function GET() {
  if (!(await staff())) return Response.json({ error: "Not allowed" }, { status: 403 });
  return Response.json({ mode: mode() });
}

function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return ".webp";
  if (b.subarray(0, 3).toString() === "GIF") return ".gif";
  return null;
}

export async function POST(req: Request) {
  // Vercel Blob client-upload handshake (JSON body).
  if ((req.headers.get("content-type") || "").includes("application/json")) {
    if (mode() !== "blob") return Response.json({ error: "Vercel Blob is not configured" }, { status: 400 });
    const body = (await req.json()) as HandleUploadBody;
    try {
      const result = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          if (!(await staff())) throw new Error("Not allowed");
          if (!pathname.startsWith("uploads/")) throw new Error("Bad path");
          return { allowedContentTypes: TYPES, maximumSizeInBytes: MAX, addRandomSuffix: true, cacheControlMaxAge: 31536000 };
        },
      });
      return Response.json(result);
    } catch (e) {
      return Response.json({ error: (e as Error).message }, { status: 400 });
    }
  }

  // Local mode: multipart upload to disk.
  if (!(await staff())) return Response.json({ error: "Not allowed" }, { status: 403 });
  if (mode() !== "local")
    return Response.json({ error: "Image storage isn't set up. In Vercel: Storage → Create → Blob, connect it to this project and redeploy." }, { status: 400 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Image must be under 15MB" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return Response.json({ error: "Only JPG, PNG, WEBP or GIF images" }, { status: 400 });
  const name = `${Date.now().toString(36)}-${token(6)}${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return Response.json({ url: `/uploads/${name}` });
}

import fs from "node:fs";
import path from "node:path";
import { currentUser } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/db";
import { token } from "@/lib/util";

const MAX = 8 * 1024 * 1024;

function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return ".png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return ".webp";
  if (b.subarray(0, 3).toString() === "GIF") return ".gif";
  return null;
}

export async function POST(req: Request) {
  const u = await currentUser();
  if (!u || u.role === "door") return Response.json({ error: "Not allowed" }, { status: 403 });
  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) return Response.json({ error: "No file" }, { status: 400 });
  if (file.size > MAX) return Response.json({ error: "Image must be under 8MB" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return Response.json({ error: "Only JPG, PNG, WEBP or GIF images" }, { status: 400 });
  const name = `${Date.now().toString(36)}-${token(6)}${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return Response.json({ url: `/uploads/${name}` });
}

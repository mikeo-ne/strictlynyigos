import { upload } from "@vercel/blob/client";

let modePromise: Promise<"blob" | "local" | "none"> | null = null;
function storageMode() {
  modePromise ??= fetch("/api/admin/upload")
    .then((r) => r.json())
    .then((d) => d.mode ?? "local")
    .catch(() => {
      modePromise = null;
      return "local";
    });
  return modePromise;
}

/** Shrinks big phone photos (keeps uploads fast on mobile data). GIFs are left alone. */
async function downscale(file: File, maxSide = 2400): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5 * 1024 * 1024) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 4 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, type === "image/png" ? ".png" : ".jpg"), { type });
  } catch {
    return file;
  }
}

export async function uploadImage(original: File): Promise<string> {
  const file = await downscale(original);
  const mode = await storageMode();
  if (mode === "blob") {
    const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+/, "") || "image.jpg";
    const blob = await upload(`uploads/${safe}`, file, { access: "public", handleUploadUrl: "/api/admin/upload", contentType: file.type });
    return blob.url;
  }
  if (mode === "none") throw new Error("Image storage isn't set up yet — in Vercel, add Storage → Blob to this project and redeploy.");
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return data.url as string;
}

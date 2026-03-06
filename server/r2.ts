import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "path";

// ─── R2 Configuration ──────────────────────────────────────────────
const accountId = process.env.R2_ACCOUNT_ID || "";
const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const bucketName = process.env.R2_BUCKET_NAME || "techsavvy-assets";
const publicUrl = (process.env.R2_PUBLIC_URL || "https://assets.techsavvyhawaii.com").replace(/\/$/, "");

const r2Enabled = !!(accountId && accessKeyId && secretAccessKey && publicUrl);

const s3 = r2Enabled
  ? new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    })
  : null;

// MIME types for Content-Type header
const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".zip": "application/zip",
  ".txt": "text/plain",
  ".html": "text/html",
  ".htm": "text/html",
};

/**
 * Upload a file buffer to R2.
 * @param buffer File contents
 * @param originalName Original filename (for extension + sanitization)
 * @param folder R2 folder prefix (e.g. "resources", "invoices", "statements", "partner-agreements")
 * @returns Public URL to the uploaded file
 */
export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  folder: string,
): Promise<string> {
  const ext = path.extname(originalName).toLowerCase();
  const base = path
    .basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 60);
  const key = `${folder}/${Date.now()}-${base}${ext}`;

  if (!s3) {
    throw new Error("R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_PUBLIC_URL.");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: MIME_MAP[ext] || "application/octet-stream",
    }),
  );

  return `${publicUrl}/${key}`;
}

/**
 * Delete a file from R2 by its full public URL.
 */
export async function deleteFromR2(fileUrl: string): Promise<void> {
  if (!s3 || !publicUrl || !fileUrl.startsWith(publicUrl)) return;
  const key = fileUrl.slice(publicUrl.length + 1); // strip "https://…/"
  await s3.send(
    new DeleteObjectCommand({ Bucket: bucketName, Key: key }),
  );
}

export { r2Enabled };

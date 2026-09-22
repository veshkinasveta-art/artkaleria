import { supabase } from "@/integrations/supabase/client";

export const BUCKET = "product-images";
export const MAX_IMAGES = 5;
const MAX_WIDTH = 1600;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

async function compress(file: File): Promise<Blob> {
  if (!ALLOWED.includes(file.type)) throw new Error("Подходят файлы JPG, PNG или WebP.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Файл больше 10 МБ — выберите снимок полегче.");
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    if (scale === 1 && file.size < 900 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  const blob = await compress(file);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) throw new Error("Не удалось загрузить фотографию. Попробуйте ещё раз.");
  const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl) throw new Error("Фотография загружена, но ссылка не создалась.");
  return data.signedUrl;
}

export async function removeProductImage(url: string) {
  const match = url.match(new RegExp(`${BUCKET}/([^?]+)`));
  if (!match?.[1]) return;
  await supabase.storage.from(BUCKET).remove([decodeURIComponent(match[1])]);
}

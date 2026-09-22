import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_IMAGES, removeProductImage, uploadProductImage } from "@/lib/product-images";

export function ImageUploader({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setError("");
    const next = [...urls];
    try {
      for (const file of Array.from(files)) {
        if (next.length >= MAX_IMAGES) break;
        next.push(await uploadProductImage(file));
      }
      onChange(next);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не удалось загрузить фотографию.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return <div className="grid gap-3">
    <div className="flex flex-wrap gap-3">
      {urls.map((url, index) => <div key={url} className="relative size-24 overflow-hidden border border-border">
        <img src={url} alt="" className="h-full w-full object-cover" />
        {index === 0 ? <span className="absolute inset-x-0 bottom-0 bg-primary/85 py-0.5 text-center text-[10px] text-primary-foreground">главная</span> : null}
        <button type="button" aria-label="Удалить фотографию" className="absolute right-0 top-0 bg-background/90 p-1" onClick={() => { void removeProductImage(url); onChange(urls.filter((item) => item !== url)); }}><X className="size-3" /></button>
      </div>)}
      {urls.length < MAX_IMAGES ? <Button type="button" variant="outline" className="size-24 flex-col gap-1" disabled={busy} onClick={() => input.current?.click()}>{busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}<span className="text-xs">С компьютера</span></Button> : null}
    </div>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => void handleFiles(event.target.files)} />
    <p className="text-xs text-muted-foreground">До {MAX_IMAGES} фотографий, JPG, PNG или WebP, до 10 МБ. Первая — обложка.</p>
    {error ? <p className="text-xs text-destructive" role="alert">{error}</p> : null}
  </div>;
}

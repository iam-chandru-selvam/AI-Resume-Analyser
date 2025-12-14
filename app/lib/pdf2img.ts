export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  // 🛑 Run only in browser
  if (typeof window === "undefined") return null;

  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = import("pdfjs-dist/build/pdf").then((lib: any) => {
    // Use the worker file shipped with the installed `pdfjs-dist` package.
    // Vite serves node_modules under `/node_modules/` in dev, so point to
    // that worker to guarantee the worker version matches the library.
    // This avoids CDN fetches and mismatched versions (UnknownErrorException).
    lib.GlobalWorkerOptions.workerSrc =
      "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs";
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();
    if (!lib) {
      return { imageUrl: "", file: null, error: "PDFJS not available" };
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 2.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context!,
      viewport,
    }).promise;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png", 1.0)
    );
    let finalBlob: Blob | null = blob;

    // Fallback: some browsers/environments may return null from toBlob.
    // Try to get a dataURL and convert it to a blob as a backup.
    if (!finalBlob) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        const res = await fetch(dataUrl);
        finalBlob = await res.blob();
      } catch (err) {
        return {
          imageUrl: "",
          file: null,
          error: `Failed to create image (toBlob and dataURL fallback both failed): ${String(
            err
          )}`,
        };
      }
    }

    const originalName = file.name.replace(/\.pdf$/i, "");
    const imageFile = new File([finalBlob as Blob], `${originalName}.png`, {
      type: "image/png",
    });

    return {
      imageUrl: URL.createObjectURL(finalBlob as Blob),
      file: imageFile,
    };
  } catch (err) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${String(err)}`,
    };
  }
}

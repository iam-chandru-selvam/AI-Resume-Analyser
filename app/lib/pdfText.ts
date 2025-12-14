export async function extractTextFromPdf(file: File): Promise<string> {
  // 🛑 Run only in browser
  if (typeof window === "undefined") {
    throw new Error("PDF extraction is only available in the browser");
  }

  const pdfjsLib = await import("pdfjs-dist");

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
    disableWorker: true,
  } as any);

  const pdf = await loadingTask.promise;

  let text = "";

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    text += content.items.map((item: any) => item.str).join(" ");
  }

  return text.trim();
}

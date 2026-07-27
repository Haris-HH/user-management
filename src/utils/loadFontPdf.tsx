// Utils
import { loadFont } from "../utils/commonFunctions";

type PdfMake = typeof import("pdfmake/build/pdfmake");

/*
  pdfmake and the base64-encoded Sarabun fonts are only needed when a PDF is
  actually produced, so the module is imported on demand rather than being
  pulled into the initial bundle.

  The configured instance is cached because the three font files used to be
  re-fetched and re-encoded on every single export.
*/
let configuredPdfMake: Promise<PdfMake> | null = null;

const configurePdfMake = async (): Promise<PdfMake> => {
  const [pdfMakeModule, reg, bold, semi] = await Promise.all([
    import("pdfmake/build/pdfmake"),
    loadFont("/fonts/Sarabun-Regular.ttf"),
    loadFont("/fonts/Sarabun-Bold.ttf"),
    loadFont("/fonts/Sarabun-SemiBold.ttf")
  ]);

  const pdfMake = (pdfMakeModule.default ?? pdfMakeModule) as PdfMake;

  pdfMake.vfs = { "Sarabun-R.ttf": reg, "Sarabun-B.ttf": bold, "Sarabun-S.ttf": semi };
  pdfMake.fonts = { Sarabun: { normal: "Sarabun-R.ttf", bold: "Sarabun-B.ttf", bolditalics: "Sarabun-S.ttf" }};

  return pdfMake;
};

export const getConfiguredPdfMake = (): Promise<PdfMake> => {
  // A failed load must not be cached, so a later export can retry.
  configuredPdfMake ??= configurePdfMake().catch((error: unknown) => {
    configuredPdfMake = null;
    throw error;
  });

  return configuredPdfMake;
};

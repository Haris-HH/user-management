import pdfMake from "pdfmake/build/pdfmake";
import { saveAs } from "file-saver";
import dayjs from "dayjs";
import type { TDocumentDefinitions, TableCell } from "pdfmake/interfaces";
import type { User } from "../types/common";
import buddhistEra from "dayjs/plugin/buddhistEra";

// Utils
import { getConfiguredPdfMake } from "../utils/loadFontPdf";
import { formatPhone, formatThaiID } from "../utils/commonFunctions";

dayjs.extend(buddhistEra);

export const generateAddApproveUsersPdfBlob = async (
  data: User[],
  t: (key: string) => string,
  i18n: any,
  tab: number,
): Promise<Blob> => {
  await getConfiguredPdfMake();

  const dataDateFormat = i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY";

  const body: TableCell[][] = [
    [
      { text: t('table.header.no'), style: "tableHeader" },
      { text: t('table.header.pid-2'), style: "tableHeader" },
      { text: t('table.header.full-name'), style: "tableHeader" },
      { text: t('table.header.position'), style: "tableHeader" },
      { text: t('table.header.affiliation'), style: "tableHeader" },
      { text: t('table.header.email'), style: "tableHeader" },
      { text: t('table.header.mobile'), style: "tableHeader" },
      { text: t('table.header.register-date-2'), style: "tableHeader" },
      { text: t('table.header.user-group-2'), style: "tableHeader" },
      { text: t('table.header.status'), style: "tableHeader" },
    ],
    ...data.map((item, index) => {
      const department = [item.ou_name, item.bh_name, item.bk_name, item.org_name].filter((data) => data !== "-").join("/")

      return [
        { text: String(index + 1), alignment: "center" } as TableCell,
        { text: item.idcard ? formatThaiID(item.idcard) : "-" } as TableCell,
        { text: item.firstname + " " + item.lastname} as TableCell,
        { text: item.position || "-" } as TableCell,
        { text: department || "-" } as TableCell,
        { text: item.email || "-" } as TableCell,
        { text: item.phone ? formatPhone(item.phone) : "-" } as TableCell,
        { text: dayjs(item.created_at).format(dataDateFormat) } as TableCell,
        { text: item.user_group_name || "-" } as TableCell,
        { text: tab === 0 ? t('tabs.pending') : tab === 1 ? t('tabs.approved') : t('tabs.rejected') } as TableCell,
      ]
    }),
  ];

  const docDefinition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [15, 30, 15, 30],
    pageOrientation: "landscape",
    defaultStyle: {
      font: "Sarabun",
      fontSize: 9,
    },
    content: [
      {
        table: {
          headerRows: 1,
          widths: [30, 85, 100, 70, 120, 80, 65, 60, 45, 45],
          body,
        },
        layout: {
          fillColor: (rowIndex: number) => {
            return rowIndex === 0 ? "#D9D9D9" : null;
          },
          hLineColor: () => "#BFBFBF",
          vLineColor: () => "#BFBFBF",
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          paddingLeft: () => 5,
          paddingRight: () => 5,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    ],
    styles: {
      header: {
        fontSize: 14,
        bold: true,
        margin: [0, 0, 0, 10],
      },
      tableHeader: {
        bold: true,
        fillColor: "#eeeeee",
        color: "#585858",
        alignment: "center",
      },
    },
    footer: (currentPage: number, pageCount: number) => ({
      text: `${t('text.page')} ${currentPage} / ${pageCount}`,
      alignment: "right",
      margin: [0, 10, 40, 0],
    }),
  };

  const pdfDocGenerator = pdfMake.createPdf(docDefinition);

  return new Promise<Blob>((resolve, reject) => {
    pdfDocGenerator.getBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PDF generation failed"));
    });
  });
};

export const downloadAddApproveUsersPdf = async (
  data: User[],
  fileName: string,
  t: (key: string) => string,
  i18n: any,
  tab: number,
) => {
  const blob = await generateAddApproveUsersPdfBlob(data, t, i18n, tab);
  saveAs(blob, fileName);
};
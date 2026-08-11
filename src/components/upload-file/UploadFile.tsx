import React, { useCallback, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import type ExcelJS from "exceljs";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import dayjs from "dayjs";

// Material UI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Pagination from "@mui/material/Pagination";
import CircularProgress from "@mui/material/CircularProgress";

// Components
import Dialog from "../dialog/Dialog";
import AutoComplete from "../auto-complete/AutoComplete";
import TextBox from "../text-box/TextBox";

// Icons
import FileUploadIcon from "../../assets/icons/file-upload.png";
import { IoIosInformationCircleOutline } from "react-icons/io";
import { FaRegCheckCircle, FaUpload } from "react-icons/fa";
import { FaRegCircleXmark, FaX } from "react-icons/fa6";

// Constants
import {
  ERROR_STATE,
  SAVE_BUT_NOT_APPROVE_STATE,
  SUCCESS_STATE,
  WAITING_STATE,
  SUSPEND_STATE,
} from "../../constants/uploadStatus";

// Utils
import { 
  buildOptions, 
  formatPhone, 
  formatThaiID, 
  normalizeText,
  validateUserImportData
} from "../../utils/commonFunctions";

// Types
import type { OptionType, NsbBk, NsbOrg, CreateUser, UserDetail } from "../../types/common";
import type { RootState } from "../../store/store";

// i18n
import { useTranslation } from "react-i18next";

// API
import { getBk, getOrg } from "../../features/dropdown/api/DropdownApi";
import { createUserApi, approveUserApi } from "../../features/users/api/UsersApi";

interface FormData {
  agency_id: string;
  userGroup: string;
  userLifeTime: string;
}

type ImportRow = {
  prefixName: string;
  prefixNameId: string;
  firstName: string;
  lastName: string;
  nationalNumber: string;
  phoneNumber: string;
  email: string;
  position: string;
  positionId: string;
  ou_name: string;
  ou_id: string;
  bh_name: string;
  bh_name_id: string;
  bk_name: string;
  bk_name_id: string;
  org_name: string;
  org_name_id: string;
  status: number;
  error: string;
  isSendToUnApprove: boolean;
  member_of_groups: null;
  police_profile_status: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: (targetTab: number) => void;
};

// Alias for exceljs's real cell value union so raw Excel values never need
// `any` as they flow through parsing/matching below.
type ExcelJsCellValue = ExcelJS.CellValue;

const ROWS_PER_PAGE = 1000;
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const noop = () => {};

const toTrimmedString = (value: ExcelJsCellValue): string =>
  value === null || value === undefined ? "" : String(value).trim();

// Prefer the localized (th/en) label; fall back to whatever raw value was in
// the Excel cell, then to "". Collapses the repeated
// `(isThai ? a : b) || raw?.toString().trim() || ""` pattern used for every
// masterdata-backed column below.
const pickLocalizedLabel = (
  thValue: string | null | undefined,
  enValue: string | null | undefined,
  rawValue: ExcelJsCellValue,
  isThai: boolean
): string => (isThai ? thValue : enValue) || toTrimmedString(rawValue) || "";

// Builds a normalized-alias -> record lookup Map once for a masterdata list,
// so callers get O(1) matches instead of re-scanning the whole list with
// Array#find for every imported row. Reproduces the semantics of
// `list.find(item => keyFields.map(normalizeText).includes(keyword))`:
// the first item (in list order) that owns a given normalized alias wins it,
// including blank/empty aliases (matches the original find()-based lookups).
const buildLookupMap = <T,>(
  list: readonly T[],
  keyFields: readonly (keyof T)[]
): Map<string, T> => {
  const map = new Map<string, T>();

  list.forEach((item) => {
    keyFields.forEach((field) => {
      const key = normalizeText(item[field]);
      if (!map.has(key)) {
        map.set(key, item);
      }
    });
  });

  return map;
};

// Extracts a human-readable message from a caught API error without
// resorting to `any` for the error shape.
const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object") {
    const { response, message } = error as {
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };
    const responseMessage = response?.data?.message;

    if (typeof responseMessage === "string" && responseMessage) {
      return responseMessage;
    }
    if (typeof message === "string" && message) {
      return message;
    }
  }

  return fallback;
};

const UploadFile = ({ open, onClose, onUploadComplete }: Props) => {

  // i18n
  const { t, i18n } = useTranslation();

  // Redux
  // NOTE: one useSelector per field so this component only re-renders when a
  // field it actually reads changes, instead of on every dropdown slice update.
  const agency = useSelector((state: RootState) => state.dropdown.agency);
  const bh = useSelector((state: RootState) => state.dropdown.bh);
  const title = useSelector((state: RootState) => state.dropdown.title);
  const position = useSelector((state: RootState) => state.dropdown.position);
  const userGroup = useSelector((state: RootState) => state.dropdown.userGroup);
  const user = useSelector((state: RootState) => state.authUser.user);

  // Data
  const [file, setFile] = useState<File | null>(null);
  const [allImportData, setAllImportData] = useState<ImportRow[]>([]);

  // Pagination
  const [page, setPage] = useState(1);

  // State
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadData, setUploadData] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [targetTabAfterClose, setTargetTabAfterClose] = useState(0);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    agency_id: "",
    userGroup: "",
    userLifeTime: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<FormData>();

  const agencyOptions = useMemo(() => {
    const langKeyAgency = i18n.language === "th" ? "ou_abbr_th" : "ou_abbr_en";

    return buildOptions(agency, "", langKeyAgency, "ou_code", false);
  }, [agency, i18n.language]);

  const userGroupOptions = useMemo(() => {
    return buildOptions(userGroup, "", "group_name", "group_id", false);
  }, [userGroup]);

  const fetchBkList = useCallback(async (): Promise<NsbBk[]> => {
    try {
      const res = await getBk({ limit: "1000" });
      return res.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const fetchOrgList = useCallback(async (): Promise<NsbOrg[]> => {
    try {
      const res = await getOrg({ limit: "1000" });
      return res.data ?? [];
    } catch {
      return [];
    }
  }, []);

  const visibleRows = useMemo(() => {
    return allImportData
      .map((row, originalIndex) => ({ row, originalIndex }))
      .filter(({ row }) => row.status !== SUCCESS_STATE);
  }, [allImportData]);

  const totalPage = useMemo(() => {
    return Math.max(1, Math.ceil(visibleRows.length / ROWS_PER_PAGE));
  }, [visibleRows.length]);

  // Clamp the visible page to the current page count derived from data,
  // instead of syncing a page state via effect, so shrinking data (e.g.
  // removing a row) can never render a blank out-of-range page.
  const currentPage = useMemo(
    () => Math.min(page, totalPage),
    [page, totalPage]
  );

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return visibleRows.slice(start, start + ROWS_PER_PAGE);
  }, [visibleRows, currentPage]);

  const summary = useMemo(() => {
    return allImportData.reduce(
      (acc, row) => {
        acc.total += 1;

        switch (row.status) {
          case WAITING_STATE:
            acc.waiting += 1;
            break;
          case SUCCESS_STATE:
            acc.success += 1;
            break;
          case SAVE_BUT_NOT_APPROVE_STATE:
            acc.saveButNotApprove += 1;
            break;
          case ERROR_STATE:
            acc.error += 1;
            break;
          case SUSPEND_STATE:
            acc.suspend += 1;
            break;
          default:
            break;
        }

        return acc;
      },
      {
        total: 0,
        waiting: 0,
        success: 0,
        saveButNotApprove: 0,
        error: 0,
        suspend: 0,
      }
    );
  }, [allImportData]);

  const resetState = useCallback(() => {
    setFile(null);
    setAllImportData([]);
    setPage(1);
    setUploadData(false);
    setFileError("");
    setIsReadingFile(false);
    setIsUploadComplete(false);
    setTargetTabAfterClose(0);
    setFormData({
      agency_id: "",
      userGroup: "",
      userLifeTime: "",
    });
  }, []);

  // Reset local state when the dialog transitions to closed. Adjusting state
  // in response to a prop change is done during render (React's recommended
  // pattern for this) rather than in a useEffect, which would otherwise cause
  // an extra render before the reset becomes visible.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      resetState();
    }
  }

  const handleTextChange = useCallback(
    (key: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setValue(key, value);
    },
    [setValue]
  );

  const handleDropdownChange = useCallback(
    (
      event: React.SyntheticEvent,
      key: keyof FormData,
      value: string | OptionType | null
    ) => {
      event.preventDefault();

      const newValue = typeof value === "string" ? value : value?.value ?? ""
      setFormData((prev) => ({
        ...prev,
        [key]: newValue,
      }));

      if (key === "userGroup") {
        setValue(key, newValue);

        // Keep the life-time field in sync with the selected user group.
        // Folded into this handler (instead of a useEffect keyed off
        // formData.userGroup) since this is the only place userGroup changes.
        if (newValue) {
          const userGroupData = userGroup.find((data) => data.group_id === newValue);
          handleTextChange("userLifeTime", userGroupData?.login_lifetime.toString() ?? "");
          clearErrors("userLifeTime");
        } else {
          handleTextChange("userLifeTime", "");
        }
      }
    },
    [userGroup, handleTextChange, clearErrors, setValue]
  );

  const getCellValue = useCallback(
    (row: Record<string, ExcelJsCellValue>, key: string): ExcelJsCellValue =>
      row[t(key)],
    [t]
  );

  const normalizePhone = (value: ExcelJsCellValue): string => {
    let phone = toTrimmedString(value);

    if (!phone) return "";

    phone = phone.replace(/[^0-9]/g, "");

    if (phone.startsWith("66")) {
      phone = `0${phone.slice(2)}`;
    } else if (!phone.startsWith("0")) {
      phone = `0${phone}`;
    }

    return phone;
  };

  const normalizeNationalId = (value: ExcelJsCellValue): string =>
    toTrimmedString(value).replace(/[^0-9]/g, "");

  const parseExcelFile = useCallback(
    async (
      uploadedFile: File,
      bkList: NsbBk[],
      orgList: NsbOrg[]
    ) => {
      const arrayBuffer = await uploadedFile.arrayBuffer();

      /*
        exceljs is only needed once a file is actually being parsed, so it is
        loaded on demand rather than shipping in the initial bundle.
      */
      const { Workbook } = await import("exceljs");

      const workbook = new Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error("Worksheet not found");
      }

      const rawRows: ExcelJsCellValue[][] = [];

      worksheet.eachRow((row) => {
        // row.values is normally a sparse array (index 0 unused), but the
        // type also allows a keyed object form - handle both defensively so
        // an unusual/corrupt worksheet can't throw here.
        const values = Array.isArray(row.values)
          ? row.values
          : Object.values(row.values);
        rawRows.push(values.slice(1));
      });

      const [headerRow, ...dataRows] = rawRows;

      if (!headerRow || dataRows.length === 0) {
        throw new Error("Empty file");
      }

      const headers = headerRow.map((header) =>
        typeof header === "string" ? header.trim() : String(header)
      );

      const mappedRows = dataRows.map((row) => {
        const obj: Record<string, ExcelJsCellValue> = {};

        headers.forEach((key, index) => {
          obj[key] = row[index];
        });

        return obj;
      });

      // Build normalized-alias -> record lookups once per import instead of
      // scanning the full masterdata list for every row (previously an
      // O(rows * masterdata) linear scan per column, per row).
      const agencyMap = buildLookupMap(agency, [
        "ou_abbr_th",
        "ou_abbr_en",
        "ou_name_th",
        "ou_name_en",
        "ou_code",
      ]);
      const bhMap = buildLookupMap(bh, [
        "bh_name_th",
        "bh_name_en",
        "bh_abbr_th",
        "bh_abbr_en",
        "bh_code",
      ]);
      const bkMap = buildLookupMap(bkList, [
        "bk_name_th",
        "bk_name_en",
        "bk_abbr_th",
        "bk_abbr_en",
        "bk_code",
      ]);
      const orgMap = buildLookupMap(orgList, [
        "org_name_th",
        "org_name_en",
        "org_abbr_th",
        "org_abbr_en",
        "org_code",
      ]);
      const titleMap = buildLookupMap(title, [
        "title_th",
        "title_en",
        "title_abbr_th",
        "title_abbr_en",
        "id",
      ]);
      const positionMap = buildLookupMap(position, [
        "position_en",
        "position_th",
        "id",
      ]);

      const isThai = i18n.language === "th";

      const jsonData = mappedRows
        .map((row): ImportRow | null => {
          const bhRow = getCellValue(row, "table.header.bh");
          const bkRow = getCellValue(row, "table.header.bk");
          const orgRow = getCellValue(row, "table.header.org");
          const prefixRow = getCellValue(row, "table.header.prefix");
          const posRow = getCellValue(row, "table.header.position");
          const ouRow = getCellValue(row, "table.header.agency");

          const ouData = agencyMap.get(normalizeText(ouRow));
          const bhData = bhMap.get(normalizeText(bhRow));
          const bkData = bkMap.get(normalizeText(bkRow));
          const orgData = orgMap.get(normalizeText(orgRow));
          const titleData = titleMap.get(normalizeText(prefixRow));
          const positionData = positionMap.get(normalizeText(posRow));

          const nationalId = normalizeNationalId(
            getCellValue(row, "table.header.pid")
          );

          const phoneNumber = normalizePhone(
            getCellValue(row, "table.header.mobile")
          );

          const firstName = toTrimmedString(getCellValue(row, "table.header.first-name"));
          const lastName = toTrimmedString(getCellValue(row, "table.header.last-name"));

          const validation = validateUserImportData({
            nationalId,
            phoneNumber,
            firstName,
            lastName,
            ouData,
            t,
          });

          const errorDetail: string[] = [];

          if (!bhData) {
            errorDetail.push(t("text.invalid-bh"));
          }
          if (!bkData) {
            errorDetail.push(t("text.invalid-bk"));
          }
          if (!orgData) {
            errorDetail.push(t("text.invalid-org"));
          }

          if (validation.shouldSkip) {
            return null;
          }

          const isInvalid = validation.isInvalid || errorDetail.length > 0;

          return {
            prefixName: pickLocalizedLabel(
              titleData?.title_th,
              titleData?.title_en,
              prefixRow,
              isThai
            ),
            prefixNameId: titleData?.id?.toString() || "",

            firstName,
            lastName,
            nationalNumber: nationalId,
            phoneNumber,
            email: toTrimmedString(getCellValue(row, "table.header.email")),

            position: pickLocalizedLabel(
              positionData?.position_th,
              positionData?.position_en,
              posRow,
              isThai
            ),
            positionId: positionData?.id?.toString() || "",

            ou_name: pickLocalizedLabel(
              ouData?.ou_abbr_th,
              ouData?.ou_abbr_en,
              ouRow,
              isThai
            ),
            ou_id: ouData?.ou_code?.toString() || "",

            bh_name: pickLocalizedLabel(
              bhData?.bh_abbr_th,
              bhData?.bh_abbr_en,
              bhRow,
              isThai
            ),
            bh_name_id: bhData?.bh_code?.toString() || "",

            bk_name: pickLocalizedLabel(
              bkData?.bk_abbr_th,
              bkData?.bk_abbr_en,
              bkRow,
              isThai
            ),
            bk_name_id: bkData?.bk_code?.toString() || "",

            org_name: pickLocalizedLabel(
              orgData?.org_abbr_th,
              orgData?.org_abbr_en,
              orgRow,
              isThai
            ),
            org_name_id: orgData?.org_code?.toString() || "",

            status: isInvalid ? SAVE_BUT_NOT_APPROVE_STATE : WAITING_STATE,
            error: isInvalid ? validation.error || errorDetail.join(", ") : "",
            isSendToUnApprove: isInvalid,
            member_of_groups: null,
            police_profile_status:
              ouData?.ou_code?.toString() === "1" ? "wait-wait-approve" : "",
          };
        })
        .filter(Boolean) as ImportRow[];

      return jsonData;
    },
    // i18n.language is a real dependency: prefixName/position/ou_name/... pick
    // between *_th and *_en based on it, so a language switch must invalidate
    // this callback or an import right after switching language would use
    // stale labels.
    [getCellValue, t, i18n.language, agency, bh, title, position]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploadedFile = acceptedFiles?.[0];

      if (!uploadedFile) return;

      setFile(uploadedFile);
      setIsReadingFile(true);
      setFileError("");
      setAllImportData([]);
      setPage(1);

      try {
        const [bkList, orgList] = await Promise.all([
          fetchBkList(),
          fetchOrgList(),
        ]);

        const jsonData = await parseExcelFile(uploadedFile, bkList, orgList);

        if (jsonData.length === 0) {
          setFileError(t("text.invalid-file"));
          return;
        }

        const allSameOu = jsonData.every(
          (row) => row.ou_id && row.ou_id === jsonData[0].ou_id
        );

        if (allSameOu) {
          setFormData((prev) => ({
            ...prev,
            agency_id: jsonData[0].ou_id,
          }));
        }

        setAllImportData(jsonData);
      } catch (error) {
        console.error("Excel parsing error:", error);
        setFileError(t("text.invalid-file"));
      } finally {
        setIsReadingFile(false);
      }
    },
    [fetchBkList, fetchOrgList, parseExcelFile, t]
  );

  const onDropRejected = useCallback(() => {
    setFile(null);
    setAllImportData([]);
    setFileError(t("text.invalid-file"));
    setIsReadingFile(false);
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    multiple: false,
    maxSize: MAX_FILE_SIZE,
    disabled: isReadingFile,
  });

  const handleRemoveData = useCallback((index: number) => {
    setAllImportData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleChangePage = useCallback(
    (_event: ChangeEvent<unknown>, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  const handleDeleteFile = useCallback(() => {
    resetState();
  }, [resetState]);

  const getRowColor = (status: number): { color: string; bgColor: string } => {
    switch (status) {
      case WAITING_STATE:
        return { color: "var(--secondary-color)", bgColor: "var(--tertiary-color-rgb)" };
      case SUCCESS_STATE:
        return { color: "#1A1A1A", bgColor: "#F1FBE4" };
      case SAVE_BUT_NOT_APPROVE_STATE:
        return { color: "#1A1A1A", bgColor: "#F9DFDF" };
      case SUSPEND_STATE:
        return { color: "#1A1A1A", bgColor: "#FEBE43" };
      default:
        return { color: "#1A1A1A", bgColor: "#BDBDBD" };
    }
  };

  const renderStatusIcon = (row: ImportRow, originalIndex: number) => {
    if (row.status === SUCCESS_STATE) {
      return <FaRegCheckCircle color="green" size={18} />;
    }

    if (
      (uploadData && (row.status === ERROR_STATE || row.status === SAVE_BUT_NOT_APPROVE_STATE))
    ) {
      return (
        <IoIosInformationCircleOutline
          color="blue"
          size={21}
          title={row.error}
        />
      );
    }

    if (row.status === SUSPEND_STATE) {
      return (
        <IoIosInformationCircleOutline
          color="red"
          size={21}
          title={row.error}
        />
      );
    }

    if (!uploadData) {
      return (
        <FaRegCircleXmark
          color="red"
          size={18}
          className="cursor-pointer"
          onClick={() => handleRemoveData(originalIndex)}
        />
      );
    }

    return null;
  };

  const handleUploadClick = async () => {
    if (isUploading) return;

    setIsUploading(true);
    setUploadData(true);

    const sendToUnApprovedList: UserDetail[] = [];
    const sendToUnApprovedIndexes: number[] = [];

    try {
      const userGroupData = userGroup.find(
        (item) => item.group_id === formData.userGroup
      );

      for (const [index, data] of allImportData.entries()) {
        if (
          data.status !== WAITING_STATE &&
          data.status !== SAVE_BUT_NOT_APPROVE_STATE
        ) {
          continue;
        }

        try {
          const shouldSendToRejected =
            data.status === SAVE_BUT_NOT_APPROVE_STATE;

          // Built up field-by-field so absent/invalid columns are simply
          // omitted rather than sent as empty strings. Rows can legitimately
          // reach here missing some of CreateUser's fields (e.g. an
          // incomplete row still gets sent so it can be routed to the
          // "rejected" approve flow below), so the object is cast to
          // CreateUser rather than widening the API's declared contract.
          const createPayload = {
            ...(userGroupData && { user_group_id: userGroupData.group_id }),
            ...(data.prefixNameId && { title_id: Number(data.prefixNameId) }),
            ...(data.position && { position: data.position }),
            ...(data.bh_name_id && { bh_code: data.bh_name_id }),
            ...(data.bk_name_id && { bk_code: data.bk_name_id }),
            ...(data.org_name_id && { org_code: data.org_name_id }),
            ...(data.nationalNumber && { username: data.nationalNumber }),
            ...(data.firstName && { firstname: data.firstName }),
            ...(data.lastName && { lastname: data.lastName }),
            ...(data.nationalNumber && { idcard: data.nationalNumber }),
            ...(data.phoneNumber && { phone: data.phoneNumber }),
            ...(data.email && { email: data.email }),
            ...(data.ou_id && { ou_code: data.ou_id }),
            ...(userGroupData && { permissions: userGroupData.permissions }),
            password: "",
          } as CreateUser;

          const res = await createUserApi(createPayload);
          const createdUserId = res.data?.user_id;

          if (createdUserId && shouldSendToRejected) {
            sendToUnApprovedList.push({
              user_id: createdUserId,
              details: data.error,
            });
            sendToUnApprovedIndexes.push(index);
          }

          if (shouldSendToRejected) continue;
          updateStatus(index, SUCCESS_STATE);
        } catch (error: unknown) {
          updateStatus(
            index,
            ERROR_STATE,
            getApiErrorMessage(error, t("popup.save-error"))
          );
        }
      }

      if (sendToUnApprovedList.length > 0) {
        try {
          await approveUserApi({
            users: sendToUnApprovedList,
            approve_status: "rejected",
            approve_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
            approve_by: user?.user_id || "",
          });
        } catch (error: unknown) {
          const message = getApiErrorMessage(error, t("popup.save-error"));
          sendToUnApprovedIndexes.forEach((index) => {
            updateStatus(index, ERROR_STATE, message);
          });
        }
      }

      setTargetTabAfterClose(sendToUnApprovedList.length > 0 ? 2 : 0);
      setIsUploadComplete(true);
    } finally {
      setIsUploading(false);
    }
  };

  const updateStatus = (index: number, status: number, error?: string) => {
    setAllImportData((prev) => {
      const newData = [...prev];
      newData[index] = { 
          ...newData[index], 
          status,
          error: error ? error : newData[index].error ? newData[index].error : "",
      };
      return newData;
    })
  }

  const handleCloseDialog = () => {
    if (isUploading) return;

    if (isUploadComplete) {
      onUploadComplete?.(targetTabAfterClose);
    }

    onClose();
  };

  return (
    <Dialog
      open={open}
      // Dialog's handleClose is required (not optional); a no-op preserves
      // the previous "closing disabled while uploading" behavior without
      // passing undefined for a required prop.
      handleClose={isUploading ? noop : handleCloseDialog}
      dialogTitle={t("dialog.import-file")}
      width={allImportData.length > 0 && file ? "1650px" : "900px"}
      disabled={isUploading}
    >
      <form className="flex flex-col gap-4 p-2" onSubmit={handleSubmit(handleUploadClick)}>
        {!file ? (
          <Box className="flex flex-col gap-4 p-4">
            <Box className="w-full px-20 pt-5 flex flex-col gap-5">
              <Box
                {...getRootProps()}
                className="w-full h-60 flex flex-col justify-center items-center gap-6 px-6 rounded-lg shadow-md border-2 border-(--primary-color) border-dashed cursor-pointer hover:scale-[1.01] transition-transform duration-150"
              >
                <input {...getInputProps()} />

                {isReadingFile ? (
                  <CircularProgress />
                ) : (
                  <img
                    src={FileUploadIcon}
                    alt="File upload"
                    className="w-20 h-20 object-contain"
                  />
                )}

                <Typography variant="h6" sx={{ color: "var(--primary-color)" }}>
                  {isReadingFile
                    ? t("text.loading")
                    : isDragActive
                      ? t('text.drag-file-here')
                      : t('text.drag-and-drop-file-here')}
                </Typography>
              </Box>

              {fileError && (
                <Typography variant="subtitle2" color="error">
                  {fileError}
                </Typography>
              )}

              <Box className="w-full flex justify-between">
                <Typography
                  variant="subtitle2"
                  sx={{ color: "var(--primary-color)" }}
                >
                  {t("text.excel-support-file")}
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{ color: "var(--primary-color)" }}
                >
                  {t("text.excel-support-row")}
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : isReadingFile ? (
          <Box className="w-full h-80 flex flex-col justify-center items-center gap-4">
            <CircularProgress />
            <Typography sx={{ color: "var(--primary-color)" }}>
              {t("text.file-reading")}
            </Typography>
            <Typography variant="subtitle2" sx={{ color: "var(--secondary-color)" }}>
              {file.name}
            </Typography>
          </Box>
        ) : allImportData.length > 0 ? (
          <Box>
            <Box className="grid grid-cols-[1fr_1fr_200px_1fr] w-full px-20 py-2 gap-5">
              <AutoComplete
                id="agency-select"
                sx={{ marginTop: "5px" }}
                value={formData.agency_id}
                onChange={(event, value) =>
                  handleDropdownChange(event, "agency_id", value)
                }
                options={agencyOptions}
                label={t("component.agency")}
                placeholder={t("placeholder.agency")}
                labelFontSize="16px"
                disablePortal={true}
              />

              <AutoComplete
                id="user-group-select"
                sx={{ marginTop: "5px" }}
                value={formData.userGroup}
                onChange={(event, value) =>
                  handleDropdownChange(event, "userGroup", value)
                }
                options={userGroupOptions}
                label={t("component.user-group")}
                placeholder={t("placeholder.user-group")}
                required
                labelFontSize="16px"
                helperText={errors.userGroup?.message?.toString() ?? ""}
                register={register("userGroup", {
                  required: t("text.text-required", { textField: t("component.user-group") }),
                })}
                error={!!errors.userGroup}
                disablePortal={true}
              />

              <TextBox
                sx={{ marginTop: "5px" }}
                type="number"
                id="user-life-time"
                label={t("component.life-date")}
                placeholder={t("placeholder.life-date")}
                labelFontSize="16px"
                value={formData.userLifeTime}
                onChange={(event) =>
                  handleTextChange("userLifeTime", event.target.value)
                }
                helperText={errors.userLifeTime?.message?.toString() ?? ""}
                register={register("userLifeTime", {
                  required: t("text.text-required", { textField: t("component.life-date") }),
                })}
                error={!!errors.userLifeTime}
              />

              <Box className="relative">
                <TextBox
                  sx={{ marginTop: "5px" }}
                  id="document-name"
                  label={t("component.document-name")}
                  labelFontSize="16px"
                  value={file.name}
                  disabled
                />

                <Box className="absolute top-10.5 right-3 cursor-pointer"
                >
                  <FaX
                    color="#777777"
                    size={15}
                    className={isUploading ? `cursor-not-allowed` : `cursor-pointer`}
                    onClick={isUploading ? undefined : handleDeleteFile}
                  />
                </Box>
              </Box>
            </Box>

            <Box className="w-full px-3 mt-5">
              <Box className="w-full flex justify-between gap-36 mb-3">
                <Box className="flex justify-between w-full">
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "var(--primary-color)" }}
                  >
                    {`${t("text.count-all-list")} : ${summary.total}`}
                  </Typography>

                  <Typography
                    variant="subtitle2"
                    sx={{ color: "var(--primary-color)" }}
                  >
                    {`${t("text.count-all-left-list")} : ${summary.waiting}`}
                  </Typography>

                  <Box className="flex space-x-1">
                    <Box className="w-5 h-5 bg-[#F1FBE4]" />
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "var(--primary-color)" }}
                    >
                      {`${t("text.count-all-checked-list")} : ${summary.success}`}
                    </Typography>
                  </Box>

                  <Box className="flex space-x-1">
                    <Box className="w-5 h-5 bg-[#F9DFDF]" />
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "var(--primary-color)" }}
                    >
                      {`${t("text.count-all-uncheck-list")} : ${summary.saveButNotApprove}`}
                    </Typography>
                  </Box>

                  <Box className="flex space-x-1">
                    <Box className="w-5 h-5 bg-[#BDBDBD]" />
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "var(--primary-color)" }}
                    >
                      {`${t("text.count-all-cannot-import")} : ${summary.error}`}
                    </Typography>
                  </Box>

                  <Box className="flex space-x-1">
                    <Box className="w-5 h-5 bg-[#FEBE43]" />
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "var(--primary-color)" }}
                    >
                      {`${t("text.count-all-suspend-list")} : ${summary.suspend}`}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <TableContainer sx={{ maxHeight: "58vh", minHeight: "55vh" }}>
                <Table stickyHeader sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      {[
                        "",
                        t("table.header.no"),
                        t("table.header.pid"),
                        t("table.header.prefix"),
                        t("table.header.first-name"),
                        t("table.header.last-name"),
                        t("table.header.position"),
                        t("table.header.agency"),
                        t("table.header.bh"),
                        t("table.header.bk"),
                        t("table.header.org"),
                        t("table.header.email"),
                        t("table.header.mobile"),
                      ].map((header, index) => (
                        <TableCell
                          key={`${header}-${index}`}
                          align="center"
                          sx={{
                            color: "var(--tertiary-color)",
                            backgroundColor: "var(--primary-color)",
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedRows.map(({ row, originalIndex }) => {
                      const rowColor = getRowColor(row.status);

                      return (
                        <TableRow
                          key={`${row.nationalNumber}-${originalIndex}`}
                          sx={{
                            backgroundColor: rowColor.bgColor,
                            transition: "background-color 0.3s ease-in-out",
                            "& .MuiTableCell-root": {
                              color: rowColor.color,
                              borderBottom: "1px solid var(--primary-color)",
                            },
                          }}
                        >
                          <TableCell align="center">
                            {renderStatusIcon(row, originalIndex)}
                          </TableCell>
                          <TableCell align="center">{originalIndex + 1}</TableCell>
                          <TableCell align="center">
                            {formatThaiID(row.nationalNumber) || "-"}
                          </TableCell>
                          <TableCell align="center">{row.prefixName || "-"}</TableCell>
                          <TableCell align="center">{row.firstName || "-"}</TableCell>
                          <TableCell align="center">{row.lastName || "-"}</TableCell>
                          <TableCell align="center">{row.position || "-"}</TableCell>
                          <TableCell align="center">{row.ou_name || "-"}</TableCell>
                          <TableCell align="center">{row.bh_name || "-"}</TableCell>
                          <TableCell align="center">{row.bk_name || "-"}</TableCell>
                          <TableCell align="center">{row.org_name || "-"}</TableCell>
                          <TableCell align="center">{row.email || "-"}</TableCell>
                          <TableCell align="center">
                            {formatPhone(row.phoneNumber) || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Pagination
                count={totalPage}
                page={currentPage}
                onChange={handleChangePage}
                variant="outlined"
                shape="rounded"
                color="primary"
                sx={{
                  mt: 2,
                  "& .MuiPaginationItem-page": {
                    color: "var(--secondary-color)",
                    backgroundColor: "var(--tertiary-color)",
                    border: "1px solid var(--primary-color)",
                  },
                  "& .MuiPaginationItem-page:hover": {
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                  },
                  "& .MuiPaginationItem-previousNext": {
                    color: "var(--secondary-color)",
                    backgroundColor: "var(--tertiary-color)",
                    border: "1px solid var(--primary-color)",
                  },
                  "& .MuiPaginationItem-previousNext:hover": {
                    color: "var(--tertiary-color)",
                    backgroundColor: "var(--primary-color)",
                  },
                  "& .MuiPaginationItem-page.Mui-selected": {
                    backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                    color: "var(--tertiary-color)",
                  },
                }}
              />
            </Box>
          </Box>
        ) : (
          <Box className="w-full px-20 pt-5 flex flex-col gap-5">
            <Box className="w-full h-17.5 flex justify-between items-center p-3 gap-3 border rounded-lg border-red-400 bg-red-50 hover:scale-[1.01] transition-transform duration-150">
              <Box className="flex justify-start items-center gap-2">
                <FaRegCircleXmark color="red" size={18} />
                <Typography
                  variant="subtitle1"
                  sx={{ color: "var(--primary-color)" }}
                >
                  {file.name}
                </Typography>
              </Box>

              <FaX
                color="var(--primary-color)"
                size={20}
                className="cursor-pointer"
                onClick={handleDeleteFile}
              />
            </Box>

            <Typography variant="subtitle2" sx={{ color: "var(--primary-color)" }}>
              {fileError || t("text.invalid-file")}
            </Typography>
          </Box>
        )}

        <Box className="flex items-center justify-end gap-2">
          <Button
            variant="outlined"
            onClick={handleCloseDialog}
            disabled={isReadingFile || isUploading}
            sx={{
              width: 80,
              height: 35,
              backgroundColor: "var(--tertiary-color)",
              border: "1px solid var(--primary-color)",
              color: "var(--primary-color)",
              textTransform: "capitalize",
              "&.Mui-disabled": {
                backgroundColor: "var(--tertiary-color)",
                color: "var(--primary-color)",
                border: "1px solid var(--primary-color)",
                opacity: 0.5,
              },
            }}
          >
            {t("button.cancel")}
          </Button>

          <Button
            variant="contained"
            type="submit"
            disabled={isReadingFile || allImportData.length === 0 || isUploading}
            sx={{
              width: 110,
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              textTransform: "capitalize",
              "&.Mui-disabled": {
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                opacity: 0.5,
              },
            }}
            startIcon={
              isReadingFile || isUploading ? <CircularProgress size={15} sx={{ color: "var(--tertiary-color)" }} /> : <FaUpload size={15} />
            }
          >
            {t("button.upload")}
          </Button>
        </Box>
      </form>
    </Dialog>
  );
};

export default UploadFile;
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";
import ExcelJS from "exceljs";
import { useSelector } from "react-redux";
import { useForm } from "react-hook-form";

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
import { isValidThaiID, buildOptions, formatPhone, formatThaiID, normalizeText } from "../../utils/commonFunctions";

// Types
import type { OptionType, NsbBk, NsbOrg, CreateUser } from "../../types/common";
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

const ROWS_PER_PAGE = 1000;
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const UploadFile = ({ open, onClose, onUploadComplete }: Props) => {

  // i18n
  const { t, i18n } = useTranslation();

  // Redux
  const { 
    agency,
    bh,
    title,
    position,
    userGroup,
  } = useSelector(
    (state: RootState) => state.dropdown
  );

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

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return visibleRows.slice(start, start + ROWS_PER_PAGE);
  }, [visibleRows, page]);

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

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open, resetState]);

  useEffect(() => {
    if (page > totalPage) {
      setPage(totalPage);
    }
  }, [page, totalPage]);

  useEffect(() => {
    if (formData.userGroup) {
      const userGroupData = userGroup.find((data) => data.group_id === formData.userGroup);
      handleTextChange("userLifeTime", userGroupData?.login_lifetime.toString());
      clearErrors("userLifeTime");
    }
    else {
      handleTextChange("userLifeTime", "");
    }
  }, [formData.userGroup])

  const handleTextChange = useCallback(
    (key: keyof FormData, value: string) => {
      setFormData((prev) => ({ ...prev, [key]: value }));
      setValue(key, value);
    },
    []
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
      }
    },
    []
  );

  const getCellValue = useCallback(
    (row: Record<string, any>, key: string) => row[t(key)],
    [t]
  );

  const normalizePhone = (value: any) => {
    let phone = value?.toString().trim() ?? "";

    if (!phone) return "";

    phone = phone.replace(/[^0-9]/g, "");

    if (phone.startsWith("66")) {
      phone = `0${phone.slice(2)}`;
    } else if (!phone.startsWith("0")) {
      phone = `0${phone}`;
    }

    return phone;
  };

  const normalizeNationalId = (value: any) => {
    return value?.toString().trim().replace(/[^0-9]/g, "") ?? "";
  };

  const findAgency = (name: any) => {
    const keyword = normalizeText(name);

    return agency.find((item) =>
      [
        item.ou_abbr_th,
        item.ou_abbr_en,
        item.ou_name_th,
        item.ou_name_en,
        item.ou_code,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const findBh = (name: any) => {
    const keyword = normalizeText(name);

    return bh.find((item) =>
      [
        item.bh_name_th,
        item.bh_name_en,
        item.bh_abbr_th,
        item.bh_abbr_en,
        item.bh_code,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const findBk = (name: any, bkList: NsbBk[]) => {
    const keyword = normalizeText(name);

    return bkList.find((item) =>
      [
        item.bk_name_th,
        item.bk_name_en,
        item.bk_abbr_th,
        item.bk_abbr_en,
        item.bk_code,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const findOrg = (name: any, orgList: NsbOrg[]) => {
    const keyword = normalizeText(name);

    return orgList.find((item) =>
      [
        item.org_name_th,
        item.org_name_en,
        item.org_abbr_th,
        item.org_abbr_en,
        item.org_code,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const findTitle = (name: any) => {
    const keyword = normalizeText(name);

    return title.find((item) =>
      [
        item.title_th,
        item.title_en,
        item.title_abbr_th,
        item.title_abbr_en,
        item.id,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const findPosition = (name: any) => {
    const keyword = normalizeText(name);

    return position.find((item) =>
      [
        item.position_en,
        item.position_th,
        item.id,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const parseExcelFile = useCallback(
    async (
      uploadedFile: File,
      bkList: NsbBk[],
      orgList: NsbOrg[]
    ) => {
      const arrayBuffer = await uploadedFile.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        throw new Error("Worksheet not found");
      }

      const rawRows: any[][] = [];

      worksheet.eachRow((row) => {
        const values = row.values as any[];
        rawRows.push(values.slice(1));
      });

      const [headerRow, ...dataRows] = rawRows;

      if (!headerRow || dataRows.length === 0) {
        throw new Error("Empty file");
      }

      const headers = headerRow.map((header: any) =>
        typeof header === "string" ? header.trim() : header
      );

      const mappedRows = dataRows.map((row) => {
        const obj: Record<string, any> = {};

        headers.forEach((key: string, index: number) => {
          obj[key] = row[index];
        });

        return obj;
      });

      const jsonData = mappedRows
        .map((row): ImportRow | null => {
          const bhRow = getCellValue(row, "table.header.bh");
          const bkRow = getCellValue(row, "table.header.bk");
          const orgRow = getCellValue(row, "table.header.org");
          const prefixRow = getCellValue(row, "table.header.prefix");
          const posRow = getCellValue(row, "table.header.position");
          const ouRow = getCellValue(row, "table.header.agency");

          const ouData = findAgency(ouRow);
          const bhData = findBh(bhRow);
          const bkData = findBk(bkRow, bkList);
          const orgData = findOrg(orgRow, orgList);
          const titleData = findTitle(prefixRow);
          const positionData = findPosition(posRow);

          const nationalId = normalizeNationalId(
            getCellValue(row, "table.header.pid")
          );

          const phoneNumber = normalizePhone(
            getCellValue(row, "table.header.mobile")
          );

          const firstName = getCellValue(row, "table.header.first-name") || "";
          const lastName = getCellValue(row, "table.header.last-name") || "";

          const isValidNationalId =
            nationalId.length === 13 && isValidThaiID(nationalId);

          const isValidPhoneNumber =
            /^\d{10}$/.test(phoneNumber) && phoneNumber.startsWith("0");

          const isNameEmpty = !firstName;
          const isLastNameEmpty = !lastName;

          if (
            !isValidNationalId &&
            !isValidPhoneNumber &&
            isNameEmpty &&
            isLastNameEmpty
          ) {
            return null;
          }

          const errorDetail: string[] = [];

          if (!isValidNationalId) errorDetail.push(t("text.invalid-pid"));
          if (!isValidPhoneNumber) errorDetail.push(t("text.invalid-phone"));
          if (isNameEmpty) errorDetail.push(t("text.invalid-name"));
          if (isLastNameEmpty) errorDetail.push(t("text.invalid-last-name"));

          if (!ouData) errorDetail.push(t("text.invalid-agency"));
          if (!bhData) errorDetail.push(t("text.invalid-bh"));
          if (!bkData) errorDetail.push(t("text.invalid-bk"));
          if (!orgData) errorDetail.push(t("text.invalid-org"));

          const isInvalid = errorDetail.length > 0;

          return {
            prefixName:
              (i18n.language === "th" ? 
                titleData?.title_th :
                titleData?.title_en) ||
              prefixRow?.toString().trim() ||
              "",
            prefixNameId:
              titleData?.id?.toString() ||
              titleData?.id?.toString() ||
              "",

            firstName,
            lastName,
            nationalNumber: nationalId,
            phoneNumber,
            email: getCellValue(row, "table.header.email") || "",

            position:
              (i18n.language === "th" ? 
                positionData?.position_th :
                positionData?.position_en) ||
              posRow?.toString().trim() ||
              "",
            positionId: positionData?.id?.toString() || "",

            ou_name:
              (i18n.language === "th" ? 
                ouData?.ou_abbr_th :
                ouData?.ou_abbr_en) ||
              ouRow?.toString().trim() ||
              "",
            ou_id: ouData?.ou_code?.toString() || "",

            bh_name:
              (i18n.language === "th" ? 
                bhData?.bh_abbr_th :
                bhData?.bh_abbr_en) ||
              bhRow?.toString().trim() ||
              "",
            bh_name_id: bhData?.bh_code?.toString() || "",

            bk_name:
              (i18n.language === "th" ? 
                bkData?.bk_abbr_th :
                bkData?.bk_abbr_en) ||
              bkRow?.toString().trim() ||
              "",
            bk_name_id: bkData?.bk_code?.toString() || "",

            org_name:
              (i18n.language === "th" ? 
                orgData?.org_abbr_th :
                orgData?.org_abbr_en) ||
              orgRow?.toString().trim() ||
              "",
            org_name_id: orgData?.org_code?.toString() || "",

            status: isInvalid ? SAVE_BUT_NOT_APPROVE_STATE : WAITING_STATE,
            error: isInvalid ? errorDetail.join(", ") : "",
            isSendToUnApprove: isInvalid,
            member_of_groups: null,
            police_profile_status:
              ouData?.ou_code?.toString() === "1" ? "wait-wait-approve" : "",
          };
        })
        .filter(Boolean) as ImportRow[];

      return jsonData;
    },
    [
      getCellValue,
      t,
      agency,
      bh,
      title,
      position,
    ]
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

  const getRowColor = (status: number) => {
    let color = "";
    let bgColor = "";
    switch (status) {
      case WAITING_STATE:
        color = "var(--secondary-color)";
        bgColor = "var(--tertiary-color-rgb)";
        break;
      case SUCCESS_STATE:
        color = "var(--tertiary-color)";
        bgColor = "#F1FBE4";
        break;
      case SAVE_BUT_NOT_APPROVE_STATE:
        color = "var(--tertiary-color)";
        bgColor = "#F9DFDF";
        break;
      case SUSPEND_STATE:
        color = "var(--tertiary-color)";
        bgColor = "#FEBE43";
        break;
      default:
        color = "var(--tertiary-color)";
        bgColor = "#BDBDBD";
        break;
    }
    return { color, bgColor }
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

    const sendToUnApprovedList: string[] = [];
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

          const createPayload: CreateUser = {
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
          };

          const res = await createUserApi(createPayload);
          const createdUserId = res.data?.user_id;

          if (createdUserId && shouldSendToRejected) {
            sendToUnApprovedList.push(createdUserId);
            sendToUnApprovedIndexes.push(index);
          }

          updateStatus(index, SUCCESS_STATE);
        } catch (error: any) {
          updateStatus(
            index,
            ERROR_STATE,
            error?.response?.data?.message ||
              error?.message ||
              t("popup.save-error")
          );
        }
      }

      if (sendToUnApprovedList.length > 0) {
        try {
          await approveUserApi({
            user_id_list: sendToUnApprovedList,
            approve_status: "rejected",
          });
        } catch (error: any) {
          sendToUnApprovedIndexes.forEach((index) => {
            updateStatus(
              index,
              ERROR_STATE,
              error?.response?.data?.message ||
                error?.message ||
                t("popup.save-error")
            );
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
      handleClose={isUploading ? undefined : handleCloseDialog}
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
                className="w-full h-60 flex flex-col justify-center items-center gap-6 px-6 rounded-lg shadow-md border-2 border-(--primary-color) border-dashed cursor-pointer hover:scale-[1.01] transition-transform duration-300"
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
                    {paginatedRows.map(({ row, originalIndex }) => (
                      <TableRow
                        key={`${row.nationalNumber}-${originalIndex}`}
                        sx={{
                          backgroundColor: getRowColor(row.status).bgColor,
                          transition: "background-color 0.3s ease-in-out",
                          "& .MuiTableCell-root": {
                            color: getRowColor(row.status).color,
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
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Pagination
                count={totalPage}
                page={page}
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
            <Box className="w-full h-17.5 flex justify-between items-center p-3 gap-3 border rounded-lg border-red-400 bg-red-50 hover:scale-[1.01] transition-transform duration-300">
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
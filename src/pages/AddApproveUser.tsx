import React, { useState, useEffect, useCallback, useMemo } from 'react'
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TablePagination from '@mui/material/TablePagination';
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from "@mui/icons-material/Clear";

// Components
import MainTitle from '../components/main-title/MainTitle';
import AutoComplete from '../components/auto-complete/AutoComplete';
import TextBox from '../components/text-box/TextBox';
import ApproveActionBar from '../components/approve-action-bar/ApproveActionBar';
import UploadFile from '../components/upload-file/UploadFile';
import TableSkeleton from '../components/table-skeleton/TableSkeleton';
import LoadingScreen from '../components/loading-screen/LoadingScreen';
import SubAgency from '../components/sub-agency/SubAgency';

// i18n
import { useTranslation } from 'react-i18next';

// Types
import type { OptionType, User, NsbBk, NsbOrg, UpdateUser } from "../types/common";
import type { Column } from "../hooks/useColumnItems";
import type { ActivationConfirmData } from '../components/activation-modal/ActivationModal';

// Hooks
import useColumnItems from "../hooks/useColumnItems";
import usePageTitle from "../hooks/usePageTitle";

// API
import { searchUserApi, deleteUserApi, approveUserApi, updateUserApi } from "../features/users/api/UsersApi";
import { getBk, getOrg } from "../features/dropdown/api/DropdownApi";

// Icons
import EditIcon from "../assets/icons/pen.png";

// Utils
import { buildOptions, formatPhone, formatThaiID, capitalizeWords, validateUserImportData } from "../utils/commonFunctions";
import { PopupMessage } from "../utils/popupMessage";

// Store
import type { RootState } from "../store/store";

interface FormData {
  pid: string;
  name: string;
  agency_id: string;
  bh_id: string;
  bk_id: string;
  org_id: string;
  sub_unit: string[]
};

const AddApproveUser = () => {
  const navigate = useNavigate();
  const columns = useColumnItems();

  // i18n
  const { t, i18n } = useTranslation();

  // Set Page Title
  usePageTitle(t('pages.statistics'));
  
  // State
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [openApproveConfirmDialog, setOpenApproveConfirmDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [tabValue, setTabValue] = useState(0);
  const [visibleColumns, setVisibleColumns] = useState<Column[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [userData, setUserData] = useState<User[]>([]);
  const [bk, setBk] = useState<NsbBk[]>([]);
  const [org, setOrg] = useState<NsbOrg[]>([]);
  const [userSelected, setUserSelected] = useState<string[]>([]);

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    pid: "",
    name: "",
    agency_id: "",
    bh_id: "0",
    bk_id: "0",
    org_id: "0",
    sub_unit: [],
  });

  // Slice
  const { agency, bh, title, userGroup } = useSelector((state: RootState) => state.dropdown);
  const { user } = useSelector((state: RootState) => state.authUser);

  const agencyOptions = useMemo(() => {
    const langKeyAgency = i18n.language === "th" ? "ou_abbr_th" : "ou_abbr_en";
    return buildOptions(agency, t("dropdown.all-agency"), langKeyAgency, "ou_code", true, "");
  }, [agency, i18n.language, i18n.isInitialized]);

  const bhOptions = useMemo(() => {
    const langKeyBh = i18n.language === "th" ? "bh_abbr_th" : "bh_abbr_en";
    const filteredBh = formData.agency_id
      ? bh.filter((item) => item.ou_code === formData.agency_id)
      : bh;

    return buildOptions(filteredBh, t("dropdown.all-bh"), langKeyBh, "bh_code");
  }, [bh, i18n.language, formData.agency_id, i18n.isInitialized]);

  const bkOptions = useMemo(() => {
    const langKeyBk = i18n.language === "th" ? "bk_abbr_th" : "bk_abbr_en";
    const filteredBk = formData.bh_id
      ? bk.filter((item) => item.bh_code === formData.bh_id)
      : bk;

    return buildOptions(filteredBk, t("dropdown.all-bk"), langKeyBk, "bk_code");
  }, [bk, i18n.language, formData.bh_id, i18n.isInitialized]);

  const orgOptions = useMemo(() => {
    const langKeyOrg = i18n.language === "th" ? "org_abbr_th" : "org_abbr_en";
    const filteredOrg = formData.bk_id
      ? org.filter((item) => item.bk_code === formData.bk_id)
      : org;

    return buildOptions(filteredOrg, t("dropdown.all-org"), langKeyOrg, "org_code");
  }, [org, i18n.language, formData.bk_id, i18n.isInitialized]);

  const agencyMap = new Map(
    agency.map(item => [item.ou_code, item])
  );

  const bhMap = new Map(
    bh.map(item => [item.bh_code, item])
  );

  const bkMap = new Map(
    bk.map(item => [item.bk_code, item])
  );

  const orgMap = new Map(
    org.map(item => [item.org_code, item])
  );

  const titleMap = new Map(
    title.map(item => [item.id, item])
  );

  const userGroupMap = new Map(
    userGroup.map(item => [item.group_id, item])
  );

  const internalPolice: boolean = useMemo(() => {
    const agencyData = agency.find((a) => a.ou_code === formData.agency_id);
    return agencyData?.ou_codename === "police" || false;
  }, [formData.agency_id])

  const fetchBkList = useCallback(async (bhCode?: string) => {
    try {
      const params: Record<string, string> = {
        limit: "100",
        ...(bhCode && bhCode !== "0"
          ? { bh_code: bhCode }
          : {}),
      };

      const res = await getBk(params);
      setBk(res.data ?? []);
    } catch (error) {
      setBk([]);
    }
  }, []);

  const fetchOrgList = useCallback(async (bkCode?: string) => {
    try {
      const params: Record<string, string> = {
        limit: "100",
        ...(bkCode && bkCode !== "0"
          ? { bk_code: bkCode }
          : {}),
      };

      const res = await getOrg(params);
      setOrg(res.data ?? []);
    } catch (error) {
      setOrg([]);
    }
  }, []);

  useEffect(() => {
    fetchBkList(formData.bh_id);
  }, [fetchBkList, formData.bh_id]);

  useEffect(() => {
    fetchOrgList(formData.bk_id);
  }, [fetchOrgList, formData.bk_id]);
  
  useEffect(() => {
    let filteredColumns = [];
    if (tabValue === 0) {
      filteredColumns = columns.filter((column) => 
        column.id !== "approve_date" && 
        column.id !== "un_approve_date" && 
        column.id !== "un_approve_reason" &&
        column.id !== "active_date_time" &&
        column.id !== "active_status" &&
        column.id !== "remark"
      );
    }
    else if (tabValue === 1) {
      filteredColumns = columns.filter((column) => 
        column.id !== "un_approve_date" && 
        column.id !== "un_approve_reason" &&
        column.id !== "active_date_time" &&
        column.id !== "active_status" &&
        column.id !== "remark"
      );
    }
    else {
      filteredColumns = columns.filter((column) => 
        column.id !== "approve_date" && 
        column.id !== "active_date_time" &&
        column.id !== "update_profile_status" &&
        column.id !== "latest_update_profile_date" &&
        column.id !== "active_status" &&
        column.id !== "remark"
      );
    }
    setVisibleColumns(filteredColumns);
  }, [columns, tabValue]);

  useEffect(() => {
    if (openImportDialog) return;
    fetchData(formData);
  }, [
    tabValue, 
    openImportDialog,
  ]);

  const fetchData = useCallback(
    async (filterData: FormData = formData, pageData: number = page, limit: number = rowsPerPage) => {
      try {
        setIsDataLoading(true);
        const res = await searchUserApi(undefined, {
          ...getFilters(filterData, tabValue, pageData, limit),
        });
        setTotalPages(res?.pagination?.maxPage);
        const updated = res.data.map((data) => {
          const titleData = data.title_id ? titleMap.get(data.title_id) : null;
          const titleName = titleData ? 
                              i18n.language === "th" ? titleData.title_abbr_th : titleData.title_abbr_en
                              : "-";
          const agencyData = data.ou_code ? agencyMap.get(data.ou_code) : null;
          const agencyName = agencyData ? 
                              i18n.language === "th" ? agencyData.ou_abbr_th : agencyData.ou_abbr_en
                              : "-";
          const bhData = data.bh_code ? bhMap.get(data.bh_code) : null;
          const bhName = bhData ? 
                              i18n.language === "th" ? bhData.bh_abbr_th : bhData.bh_abbr_en
                              : "-";
          const bkData = data.bk_code ? bkMap.get(data.bk_code) : null;
          const bkName = bkData ? 
                              i18n.language === "th" ? bkData.bk_abbr_th : bkData.bk_abbr_en
                              : "-";
          const orgData = data.org_code ? orgMap.get(data.org_code) : null;
          const orgName = orgData ? 
                              i18n.language === "th" ? orgData.org_abbr_th : orgData.org_abbr_en
                              : "-";
          const userGroupData = data.user_group_id ? userGroupMap.get(data.user_group_id) : null;
          return {
            ...data,
            title: titleName,
            ou_name: agencyName,
            bh_name: bhName,
            bk_name: bkName,
            org_name: orgName,
            user_group_name: capitalizeWords(userGroupData?.group_name) ?? "-",
          }
        })
        setUserData(updated);
      }
      catch (error) {
        await PopupMessage(t("popup.fetch-error"), "", "error");
        setTotalPages(1);
      } 
      finally {
        setIsDataLoading(false);
      }
    },
    [tabValue]
  );

  const visibleUserIds = useMemo(
    () => userData.map((user) => user.user_id),
    [userData]
  );

  const isAllSelected =
    visibleUserIds.length > 0 &&
    visibleUserIds.every((id) => userSelected.includes(id));

  const isSomeSelected =
    visibleUserIds.some((id) => userSelected.includes(id)) && !isAllSelected;

  const handleSelectAll = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      setUserSelected(visibleUserIds);
    } else {
      setUserSelected([]);
    }
  };

  const onCheckMemberClick = useCallback((id: string) => {
    setUserSelected((prev) =>
      prev.includes(id)
        ? prev.filter((memberId) => memberId !== id)
        : [...prev, id]
    );
  }, []);

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDropdownChange = (
    event: React.SyntheticEvent,
    key: keyof typeof formData,
    value: string | OptionType,
  ) => {
    event.preventDefault();

    const selectedValue =
      typeof value === "string" ? value : value?.value ?? "";

    setFormData((prev) => {
      const next = {
        ...prev,
        [key]: selectedValue,
      };

      if (key === "agency_id") {
        next.bh_id = "0";
        next.bk_id = "0";
        next.org_id = "0";
      }

      if (key === "bh_id") {
        next.bk_id = "0";
        next.org_id = "0";
      }

      if (key === "bk_id") {
        next.org_id = "0";
      }

      return next;
    });
  };

  const handleChangePage = async (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => {
    event.preventDefault();
    setPage(newPage);
    await fetchData(formData, newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    await fetchData(formData, 1, newRowsPerPage);
  };

  const handleClickAddUser = () => {
    navigate("/add-approve-user/add");
  }

  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMenuItemClick = (action: string) => {
    if (action === "example") {
      const fileUrl = `/files/template-import-${i18n.language === "th" ? "th" : "en"}.xlsx`;
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", "template-import.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } 
    else if (action === "import") {
      setOpenImportDialog(true);
    }
    handleMenuClose();
  };

  const handleEdit = async (user: User) => {
    navigate("/add-approve-user/add", {
      state: {
        user,
        page: "add_approve_user",
        returnTo: "/add-approve-user",
      },
    });
  };

  const handleTabSelectChange = (tabIndex: number) => {
    setTabValue(tabIndex);
    setUserSelected([]);
  };

  const handleDeleteClick = async () => {
    try {
      setIsLoading(true);
      const param = {
        user_ids: [userSelected.join(",")].toString()
      }
      await deleteUserApi(param);
      setUserSelected([]);
      await PopupMessage(t("popup.deleted-success"), "", "success");
      await fetchData();
    }
    catch (error) {
      await PopupMessage(t("popup.deleted-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleApproveClick = async (data: ActivationConfirmData) => {
    await approveUser(data.activationTime === "now" ? "approved" : "wait_approve", data);
  }

  const handleRejectClick = async () => {
    await approveUser("rejected");
  }

  const handleWaitClick = async () => {
    await approveUser("pending");
  }

  const approveUser = async (status: string, approveData?: ActivationConfirmData) => {
    
    const { validUsers } = validateSelectedRejectedUsers();

    if (validUsers.length === 0) {
      await PopupMessage(
        t("popup.update-status-failed"),
        t("popup.invalid-data-detail"),
        "error"
      );
      return;
    }

    try {
      setIsLoading(true);
      await approveUserApi({
        users: validUsers.map((user) => ({
          user_id: user.user_id,
          details: "",
        })),
        approve_status: status,
        ...(
          (status === "approved" || status === "wait_approve") && {
            active_type: approveData?.activationTime === "now" ? "now" : "schedule",
            auto_approve_at: dayjs(approveData.approveDate).format("YYYY-MM-DD")
          }
        ),
        approve_by: user.user_id || "",
        approve_at: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      });
      if (approveData?.activationTime === "now") {
        await Promise.all(
          validUsers.map((userData) => {
            const updatePayload: UpdateUser = {
              user_id: userData.user_id,
              active_status: "active",
              active_by: user.user_id,
            };
            updateUserApi(updatePayload);
          })
        )
      }
      await fetchData();
    }
    catch (error) {
      await PopupMessage(t("popup.update-status-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  }

  const renderCellValue = (columnId: Column["id"], data: User, index: number) => {
    if (columnId.startsWith("sub_agency_")) {
      const index = Number(columnId.replace("sub_agency_", ""));
      return data.sub_unit?.[index] || "-";
    }

    switch (columnId) {
      case "actions":
        return (
          <Checkbox
            checked={userSelected.includes(data.user_id)}
            onChange={() => onCheckMemberClick(data.user_id)}
            sx={{
              color: "var(--secondary-color)",
              "&.Mui-checked": {
                color: "var(--primary-color)",
              },
            }}
          />
        );

      case "edit":
        return (
          <img
            className="hover:scale-[1.2]"
            style={{ cursor: "pointer" }}
            src={EditIcon}
            width={15}
            height={15}
            onClick={() => handleEdit(data)}
            alt="Edit"
          />
        );

      case "id":
        return (page - 1) * rowsPerPage + index + 1;

      case "pid":
        return data.idcard ? formatThaiID(data.idcard) : "-";

      case "prefix":
        return data.title;

      case "name":
        return data.firstname || "-";

      case "last_name":
        return data.lastname || "-";

      case "position":
        return data.position || "-";

      case "ou":
        return data.ou_name;

      case "bh":
        return data.bh_name;

      case "bk":
        return data.bk_name;

      case "org":
        return data.org_name;

      case "email":
        return data.email || "-";

      case "mobile":
        return data.phone ? formatPhone(data.phone) : "-";

      case "user_group":
        return data.user_group_name;

      case "update_profile_status":
        return data.police_profile_status || "-";

      case "latest_update_profile_date":
        return data.police_profile_status_datetime
          ? dayjs(data.police_profile_status_datetime).format(
              i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY"
            )
          : "-";

      case "remark":
        return data.remark || "-";

      case "created_at":
        return data.created_at
          ? dayjs(data.created_at).format(
              i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY"
            )
          : "-";

      case "approve_date":
        return data.active_datetime
          ? dayjs(data.active_datetime).format(
              i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY"
            )
          : "-";

      case "un_approve_date":
        return data.approve_at
          ? dayjs(data.approve_at).format(
              i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY"
            )
          : "-";

      case "un_approve_reason":
        return data.details || "-";

      default:
        return (data as any)[columnId] ?? "-";
    }
  };

  const handleSubAgencyChange = (values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      sub_unit: values,
    }));
  };

  const handleClearClick = () => {
    setFormData({
      pid: "",
      name: "",
      agency_id: "",
      bh_id: "0",
      bk_id: "0",
      org_id: "0",
      sub_unit: [],
    });
  }

  const getFilters = useCallback((formData: FormData, tabValue: number, pageData: number, limit: number) => {
    const status = tabValue === 0 ? "pending" : tabValue === 1 ? "wait_approve" : "rejected"
    const filters: Record<string, string> = {
      filter: `approve_status=${status}`,
      page: pageData.toString(),
      limit: limit.toString(),
    };

    if (formData.pid.trim()) {
      filters.idcard = `*${formData.pid.trim()}*`;
    }

    if (formData.name.trim()) {
      filters.fullname = `*${formData.name.trim()}*`;
    }

    if (formData.agency_id !== "") {
      filters.ou_code = formData.agency_id;
    }

    if (formData.bh_id !== "0") {
      filters.bh_code = formData.bh_id;
    }

    if (formData.bk_id !== "0") {
      filters.bk_code = formData.bk_id;
    }

    if (formData.org_id !== "0") {
      filters.org_code = formData.org_id;
    }

    return filters;
  }, [
    formData.pid,
    formData.name,
    formData.agency_id,
    formData.bh_id,
    formData.bk_id,
    formData.org_id,
    formData.sub_unit,
  ]);

  const handleSearchClick = async () => {
    await fetchData(formData);
  }

  const validateSelectedRejectedUsers = () => {
    const validUsers: User[] = [];
    const invalidUsers: Array<{
      user: User;
      error: string;
    }> = [];

    userData
      .filter((user) => userSelected.includes(user.user_id))
      .forEach((user) => {
        const validation = validateUserImportData({
          nationalId: user.idcard ?? "",
          phoneNumber: user.phone ?? "",
          firstName: user.firstname ?? "",
          lastName: user.lastname ?? "",
          ouData: user.ou_code,
          t,
        });

        let errorDetail: string[] = [];

        const isBhDataExist = user.bh_code ? bhMap.get(user.bh_code) : true;
        const isBkDataExist = user.bk_code ? bkMap.get(user.bk_code) : true;
        const isOrgDataExist = user.org_code ? orgMap.get(user.org_code) : true;
        if (!isBhDataExist) {
          errorDetail.push(t("text.invalid-bh"));
        }
        if (!isBkDataExist) {
          errorDetail.push(t("text.invalid-bk"));
        }
        if (!isOrgDataExist) {
          errorDetail.push(t("text.invalid-org"));
        }

        if (validation.isInvalid || errorDetail.length > 0) {
          invalidUsers.push({
            user,
            error: validation.error || errorDetail.join(", "),
          });
        } 
        else {
          validUsers.push(user);
        }
      });

    return {
      validUsers,
      invalidUsers,
    };
  };

  return (
    <section id='add-approve-user' className="flex flex-col h-full w-full p-2">
      { isLoading && <LoadingScreen /> }
      {/* Main Title */}
      <MainTitle title={t("pages.add-approve-user")} />
      <div className='flex flex-col p-4 bg-(--main-bg-color) flex-1 min-h-0 w-full rounded-lg border border-(--primary-color) overflow-y-auto gap-2'>
        <Box className="flex justify-end items-center">
          <Box className="flex gap-2">
            <Button
              variant="contained"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": {
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize"
              }}
              startIcon={<AddIcon />}
              onClick={handleOpenMenu}
            >
              {t('button.import')}
            </Button>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={handleMenuClose}
              sx={{
                "& .MuiMenu-list": {
                  backgroundColor: "var(--tertiary-color)",
                },
              }}
            >
              <MenuItem
                sx={{
                  color: "var(--secondary-color)",
                  fontSize: "0.9rem",
                  py: 1.2,
                  px: 2,
                  display: "flex",
                  "&:hover": {
                    backgroundColor:
                      "rgba(var(--primary-color-rgb),0.15)",
                  },
                }}
                onClick={() => handleMenuItemClick("example")}
              >
                {t('button.example-file')}
              </MenuItem>
              <Divider
                sx={{
                  borderColor: "rgba(var(--primary-color-rgb),0.5)",
                }}
              />
              <MenuItem
                sx={{
                  color: "var(--secondary-color)",
                  fontSize: "0.9rem",
                  py: 1.2,
                  px: 2,
                  display: "flex",
                  "&:hover": {
                    backgroundColor:
                      "rgba(var(--primary-color-rgb),0.15)",
                  },
                }}
                onClick={() => handleMenuItemClick("import")}
              >
                {t('button.import-file')}
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": {
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize"
              }}
              startIcon={<AddIcon />}
              onClick={handleClickAddUser}
            >
              {t('button.add-user')}
            </Button>
          </Box>
        </Box>
        <Accordion
          expanded={isAccordionOpen}
          onChange={() => setIsAccordionOpen((prev) => !prev)}
          disableGutters
          elevation={0}
          sx={{
            borderRadius: "0 0 16px 16px",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(var(--primary-color-rgb), 0.08), var(--tertiary-color))",
            border: "1px solid rgba(var(--primary-color-rgb), 0.25)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          }}
        >
          <AccordionSummary
            component="div"
            expandIcon={<ArrowDropDownIcon />}
            id="search-part"
            sx={{
              minHeight: 64,
              px: 3,
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              },
              "& .MuiSvgIcon-root": {
                color: "var(--primary-color)",
              },
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{ alignItems: "center" }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.12)",
                }}
              >
                <FilterAltOutlinedIcon sx={{ color: "var(--primary-color)" }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    color: "var(--primary-color)",
                    fontWeight: 700,
                    fontSize: "1rem",
                  }}
                >
                  {t("text.search-condition")}
                </Typography>
              </Box>
            </Stack>

            <Collapse
              in={isAccordionOpen}
              orientation="horizontal"
              timeout={250}
              unmountOnExit
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{
                  justifyContent: "flex-end",
                  mr: 3,
                  opacity: isAccordionOpen ? 1 : 0,
                  transform: isAccordionOpen ? "translateX(0)" : "translateX(12px)",
                  transition: "opacity 250ms ease, transform 250ms ease",
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  sx={{
                    minWidth: 130,
                    height: 40,
                    borderRadius: "10px",
                    borderColor: "rgba(var(--primary-color-rgb), 0.5)",
                    color: "var(--primary-color)",
                    textTransform: "capitalize",
                    fontWeight: 600,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClearClick();
                  }}
                >
                  {t("button.clear")}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<SearchIcon style={{ color: "var(--tertiary-color)"}} />}
                  sx={{
                    minWidth: 140,
                    height: 40,
                    borderRadius: "10px",
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                    textTransform: "capitalize",
                    fontWeight: 700,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleSearchClick();
                  }}
                >
                  {t("button.search")}
                </Button>
              </Stack>
            </Collapse>
          </AccordionSummary>

          <AccordionDetails
            sx={{
              px: 3,
              pb: 3,
              pt: 1,
            }}
          >
            <Box
              sx={{
                p: 2.5,
                borderRadius: "14px",
                backgroundColor: "var(--tertiary-color)",
                border: "1px solid rgba(var(--primary-color-rgb), 0.16)",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <TextBox
                  sx={{ marginTop: "5px" }}
                  id="pid"
                  label={t("component.pid")}
                  placeholder={t("placeholder.pid")}
                  labelFontSize="16px"
                  value={formData.pid}
                  onChange={(event) => handleTextChange("pid", event.target.value)}
                />

                <TextBox
                  sx={{ marginTop: "5px" }}
                  id="name"
                  label={t("component.fullname")}
                  placeholder={t("placeholder.fullname")}
                  labelFontSize="16px"
                  value={formData.name}
                  onChange={(event) => handleTextChange("name", event.target.value)}
                />

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

                {internalPolice && (
                  <>
                    <AutoComplete
                      id="bh-select"
                      sx={{ marginTop: "5px" }}
                      value={formData.bh_id}
                      onChange={(event, value) =>
                        handleDropdownChange(event, "bh_id", value)
                      }
                      options={bhOptions}
                      label={t("component.bh")}
                      placeholder={t("placeholder.bh")}
                      labelFontSize="16px"
                      disabled={formData.agency_id === ""}
                    />

                    <AutoComplete
                      id="bk-select"
                      sx={{ marginTop: "5px" }}
                      value={formData.bk_id}
                      onChange={(event, value) =>
                        handleDropdownChange(event, "bk_id", value)
                      }
                      options={bkOptions}
                      label={t("component.bk")}
                      placeholder={t("placeholder.bk")}
                      labelFontSize="16px"
                      disabled={formData.bh_id === "0"}
                    />

                    <AutoComplete
                      id="org-select"
                      sx={{ marginTop: "5px" }}
                      value={formData.org_id}
                      onChange={(event, value) =>
                        handleDropdownChange(event, "org_id", value)
                      }
                      options={orgOptions}
                      label={t("component.org")}
                      placeholder={t("placeholder.org")}
                      labelFontSize="16px"
                      disabled={formData.bk_id === "0"}
                    />
                  </>
                )}

                {!internalPolice && formData.agency_id !== "" && (
                  <SubAgency onChange={handleSubAgencyChange} />
                )}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box className="flex flex-col">
          <ApproveActionBar 
            tab={tabValue}
            onTabSelectChange={handleTabSelectChange} 
            data={userData} 
            userSelected={userSelected}
            onDelete={handleDeleteClick}
            onApprove={handleApproveClick}
            onReject={handleRejectClick}
            onWait={handleWaitClick}
          />
          <Box className="p-4 bg-(--tertiary-color) border border-t-2 border-(--primary-color)">
            <TableContainer
              component={Paper}
              sx={{
                overflowX: "auto",
                overflowY: "auto",
                width: "100%",
                height: isAccordionOpen ? `calc(100vh - ${formData.agency_id ? "1000px" : "550px"})` : "58vh",
                minHeight: "260px",
                backgroundColor: "var(--tertiary-color)",
              }}
            >
              <Table
                stickyHeader
              >
                <TableHead>
                  <TableRow
                    sx={{
                      '& td, & th': { 
                        padding: '0px',
                        height: "56.5px",
                        fontSize: "15px",
                      },
                    }}
                  >
                    {
                      visibleColumns?.map((column, index) => (
                        <TableCell
                          size="medium"
                          key={`header-${column.id ?? index}`}
                          align={column.align}
                          style={{
                            minWidth: column.minWidth,
                            color: "var(--tertiary-color)",
                            backgroundColor: "var(--primary-color)",
                          }}
                        >
                          {column.id === "actions" ? (
                          <div className="flex justify-center items-center">
                            <Checkbox
                              color="default"
                              checked={isAllSelected}
                              indeterminate={isSomeSelected}
                              onChange={handleSelectAll}
                              disabled={userData.length === 0}
                              sx={{
                                color: "var(--tertiary-color)",
                                "&.Mui-checked": {
                                  color: "var(--tertiary-color)",
                                },
                                "&.MuiCheckbox-indeterminate": {
                                  color: "var(--tertiary-color)",
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            {column.label}
                          </div>
                        )}
                        </TableCell>
                      ))
                    }
                  </TableRow>
                </TableHead>
                <TableBody>
                  {isDataLoading && (
                    <TableSkeleton headerColumn={visibleColumns?.length ?? 0} />
                  )}
                  {
                    userData.length > 0 ? (
                    userData.map((data, index) => (
                      <TableRow key={data.user_id}>
                        {visibleColumns.map((column, colIndex) => (
                          <TableCell
                            key={`${index}-${column.id ?? colIndex}`}
                            align={column.align || "center"}
                            sx={{
                              backgroundColor: "var(--tertiary-color)",
                              color: "var(--secondary-color)",
                              borderBottom: "1px solid var(--primary-color)",
                              textAlign: "center",
                              px: 1,
                              py: 0.5,
                            }}
                          >
                            <div className="w-full flex items-center justify-center">
                              {renderCellValue(column.id, data, index)}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length}
                        align="center"
                        sx={{ py: 5, color: "var(--secondary-color)" }}
                      >
                        {t('text.no-data')}
                      </TableCell>
                    </TableRow>
                  )
                  }
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[100, 500, 1000]}
              component="div"
              count={totalPages}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                color: "var(--primary-color)",
                "& .MuiSvgIcon-root": {
                  color: "var(--primary-color)",
                }
              }}
            />
          </Box>
        </Box>
      </div>
      {
        openImportDialog && (
          <UploadFile
            open={openImportDialog}
            onClose={() => setOpenImportDialog(false)}
            onUploadComplete={(targetTab) => {
              setTabValue(targetTab);
              setPage(1);
            }}
          />
        )
      }
    </section>
  )
}

export default AddApproveUser;
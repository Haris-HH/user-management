import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";
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
import Stack from "@mui/material/Stack";
import Collapse from "@mui/material/Collapse";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import SearchIcon from '@mui/icons-material/Search';

// Components
import MainTitle from '../components/main-title/MainTitle';
import AutoComplete from '../components/auto-complete/AutoComplete';
import TextBox from '../components/text-box/TextBox';
import UpdateProfile from '../components/update-profile/UpdateProfile';
import TableSkeleton from '../components/table-skeleton/TableSkeleton';

// Icons
import ExcelIcon from "../assets/icons/excel.png";
import EditIcon from "../assets/icons/pen.png";

// Types
import type { OptionType, User, NsbBk, NsbOrg } from "../types/common";
import type { Column } from "../hooks/useColumnItems";

// Hooks
import useColumnItems from "../hooks/useColumnItems";
import usePageTitle from "../hooks/usePageTitle";
import { usePermission } from "../hooks/usePermission";

// i18n
import { useTranslation } from 'react-i18next';

// Utils
import { exportExcel } from '../utils/exportData';
import { capitalizeWords, buildOptions, formatPhone, formatThaiID } from "../utils/commonFunctions";

// API
import { searchUserApi } from "../features/users/api/UsersApi";
import { getBk, getOrg } from "../features/dropdown/api/DropdownApi";

// Store
import type { RootState } from "../store/store";

// Constants
import { MAX_SUB_AGENCY } from "../hooks/useColumnItems";
import { USER_MANAGEMENT_UI_KEY } from "../constants/permissions";

interface FormData {
  pid: string;
  name: string;
  agency_id: string;
  bh_id: string;
  bk_id: string;
  org_id: string;
  user_group_id: string;
  status_id: string;
  sub_unit: string;
};

const ManageUser = () => {
  const columns = useColumnItems();
  const navigate = useNavigate();

  // i18n
  const { t, i18n } = useTranslation();

  // Permission
  const { canEdit, canPrint } = usePermission(
    USER_MANAGEMENT_UI_KEY,
    "manage-user"
  );

  // Set Page Title
  usePageTitle(t('pages.manage-user'));

  // State
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [selectAll, setSelectAll] = useState(false);
  const [openUpdateProfileDialog, setOpenUpdateProfileDialog] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Guards against an older, slower search response overwriting the
  // results of a newer one (e.g. a fast page-2 fetch resolving before a
  // slow page-1 fetch that was fired first).
  const latestRequestIdRef = useRef(0);

  // Data
  const [userData, setUserData] = useState<User[]>([]);
  const [memberChecked, setMemberChecked] = useState<string[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [bk, setBk] = useState<NsbBk[]>([]);
  const [org, setOrg] = useState<NsbOrg[]>([]);

  // Pagination
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
    user_group_id: "0",
    status_id: "0",
    sub_unit: "",
  });

  // Slice
  // Selected per-field (instead of the whole dropdown slice) so this
  // component only re-renders when a field it actually reads changes,
  // rather than on every one of the ~14 dropdown thunks fired on login.
  const agency = useSelector((state: RootState) => state.dropdown.agency);
  const bh = useSelector((state: RootState) => state.dropdown.bh);
  const title = useSelector((state: RootState) => state.dropdown.title);
  const userGroup = useSelector((state: RootState) => state.dropdown.userGroup);
  const status = useSelector((state: RootState) => state.dropdown.status);

  const agencyOptions = useMemo(() => {
    const langKeyAgency = i18n.language === "th" ? "ou_abbr_th" : "ou_abbr_en";
    return buildOptions(agency, t("dropdown.all-agency"), langKeyAgency, "ou_code", true, "");
  }, [agency, t, i18n.language]);

  const bhOptions = useMemo(() => {
    const langKeyBh = i18n.language === "th" ? "bh_abbr_th" : "bh_abbr_en";
    const filteredBh = formData.agency_id
      ? bh.filter((item) => item.ou_code === formData.agency_id)
      : bh;

    return buildOptions(filteredBh, t("dropdown.all-bh"), langKeyBh, "bh_code");
    // Translations load asynchronously over XHR (see useColumnItems), so
    // language and the initialised flag are kept as explicit deps to
    // guarantee labels rebuild once the bundle arrives, even if `t` keeps
    // its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bh, t, i18n.language, formData.agency_id, i18n.isInitialized]);

  const bkOptions = useMemo(() => {
    const langKeyBk = i18n.language === "th" ? "bk_abbr_th" : "bk_abbr_en";
    const filteredBk = formData.bh_id
      ? bk.filter((item) => item.bh_code === formData.bh_id)
      : bk;

    return buildOptions(filteredBk, t("dropdown.all-bk"), langKeyBk, "bk_code");
    // See the bhOptions comment above re: async translation loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bk, t, i18n.language, formData.bh_id, i18n.isInitialized]);

  const orgOptions = useMemo(() => {
    const langKeyOrg = i18n.language === "th" ? "org_abbr_th" : "org_abbr_en";
    const filteredOrg = formData.bk_id
      ? org.filter((item) => item.bk_code === formData.bk_id)
      : org;

    return buildOptions(filteredOrg, t("dropdown.all-org"), langKeyOrg, "org_code");
    // See the bhOptions comment above re: async translation loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, t, i18n.language, formData.bk_id, i18n.isInitialized]);

  const userGroupOptions = useMemo(() => {
    const langKeyUserGroup = "group_name";
    return buildOptions(userGroup, t("dropdown.all-user-group"), langKeyUserGroup, "group_id");
    // See the bhOptions comment above re: async translation loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userGroup, t, i18n.language, i18n.isInitialized]);

  const statusOptions = useMemo(() => {
    const langKeyStatus = "name";
    return buildOptions(status, t("dropdown.all-status"), langKeyStatus, "code");
    // See the bhOptions comment above re: async translation loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, t, i18n.language, i18n.isInitialized]);

  // Memoized so identity is stable across renders that don't change the
  // underlying dropdown list — mapUserDataRows (below) depends on these
  // and would otherwise re-run on every render, or (if naively memoized
  // with an empty dep array) capture stale/empty maps forever.
  const agencyMap = useMemo(
    () => new Map(agency.map(item => [item.ou_code, item])),
    [agency]
  );

  const bhMap = useMemo(
    () => new Map(bh.map(item => [item.bh_code, item])),
    [bh]
  );

  const bkMap = useMemo(
    () => new Map(bk.map(item => [item.bk_code, item])),
    [bk]
  );

  const orgMap = useMemo(
    () => new Map(org.map(item => [item.org_code, item])),
    [org]
  );

  const titleMap = useMemo(
    () => new Map(title.map(item => [item.id, item])),
    [title]
  );

  const userGroupMap = useMemo(
    () => new Map(userGroup.map(item => [item.group_id, item])),
    [userGroup]
  );

  const internalPolice: boolean = useMemo(() => {
    const agencyData = agency.find((a) => a.ou_code === formData.agency_id);
    return agencyData?.ou_codename === "police" || false;
  }, [agency, formData.agency_id])

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
      console.log(error);
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
      console.log(error);
      setOrg([]);
    }
  }, []);

  useEffect(() => {
    // fetchBkList synchronizes the bk dropdown with the selected bh — a
    // genuine "fetch when a reactive value changes" effect. The lint rule
    // flags it because it can't see that the resulting setBk happens after
    // an await, not synchronously; there's no way to fetch this from a
    // cascading-dropdown filter without an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBkList(formData.bh_id);
  }, [fetchBkList, formData.bh_id]);

  useEffect(() => {
    // Same rationale as the bk effect above, for the org dropdown.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrgList(formData.bk_id);
  }, [fetchOrgList, formData.bk_id]);

  // Derived purely from `columns` — computed during render instead of via
  // an effect+state pair, which used to leave the table headerless for one
  // extra render after mount.
  const visibleColumns = useMemo(() => {
    const filtered = columns.filter(
      (column) =>
        column.id !== "created_at" &&
        column.id !== "approve_date" &&
        column.id !== "un_approve_date" &&
        column.id !== "un_approve_reason" &&
        column.id !== "active_date_time" &&
        // The edit column is nothing but a link into the user form.
        (column.id !== "edit" || canEdit)
    );

    const first = ["actions", "edit", "id", "account_status", "last_login", "pid"];

    return [
      ...first
        .map((id) => filtered.find((column) => column.id === id))
        .filter(Boolean) as Column[],
      ...filtered.filter((column) => !first.includes(column.id)),
    ];
  }, [columns, canEdit]);

  const mapUserDataRows = useCallback((data: User[]) => {
    return data.map((item) => {
      const titleData = item.title_id ? titleMap.get(item.title_id) : null;
      const titleName = titleData ?
                          (i18n.language === "th" ? titleData.title_abbr_th : titleData.title_abbr_en) ?? "-"
                          : "-";
      const agencyData = item.ou_code ? agencyMap.get(item.ou_code) : null;
      const agencyName = agencyData ?
                          (i18n.language === "th" ? agencyData.ou_abbr_th : agencyData.ou_abbr_en) ?? "-"
                          : "-";
      const bhData = item.bh_code ? bhMap.get(item.bh_code) : null;
      const bhName = bhData ?
                          (i18n.language === "th" ? bhData.bh_abbr_th : bhData.bh_abbr_en) ?? "-"
                          : "-";
      const bkData = item.bk_code ? bkMap.get(item.bk_code) : null;
      const bkName = bkData ?
                          (i18n.language === "th" ? bkData.bk_abbr_th : bkData.bk_abbr_en) ?? "-"
                          : "-";
      const orgData = item.org_code ? orgMap.get(item.org_code) : null;
      const orgName = orgData ?
                          (i18n.language === "th" ? orgData.org_abbr_th : orgData.org_abbr_en) ?? "-"
                          : "-";
      const userGroupData = item.user_group_id ? userGroupMap.get(item.user_group_id) : null;

      return {
        ...item,
        title: titleName,
        ou_name: agencyName,
        bh_name: bhName,
        bk_name: bkName,
        org_name: orgName,
        user_group_name: capitalizeWords(userGroupData?.group_name ?? ""),
      }
    })
  }, [titleMap, agencyMap, bhMap, bkMap, orgMap, userGroupMap, i18n.language])

  // Pure — `formData` is a parameter here (shadowing the outer state), so
  // this function has no external reactive dependencies at all.
  const getFilters = useCallback((formData: FormData, pageData: number, limit: number) => {
    const filters: Record<string, string> = {
      filter: `approve_status=approved`,
      page: pageData.toString(),
      limit: limit.toString(),
    };

    const pid = formData.pid.trim();
    const name = formData.name.trim();
    const subUnit = formData.sub_unit.trim();

    if (pid) {
      filters.idcard = `*${formData.pid}*`;
    }

    if (name) {
      filters.fullname = `*${formData.name.trim()}*`;
    }

    if (formData.agency_id) {
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

    if (formData.user_group_id !== "0") {
      filters.user_group_id = formData.user_group_id;
    }

    if (formData.status_id !== "0") {
      filters.active_status = formData.status_id;
    }

    if (subUnit) {
      filters.sub_unit_list = `*${subUnit}*`;
    }

    return filters;
  }, []);

  const fetchData = useCallback(
    async (filterData: FormData, pageData: number, limit: number) => {
      // Tags this call so a response that resolves after a newer call has
      // already landed (e.g. a slow page-1 fetch resolving after a fast
      // page-2 fetch) is discarded instead of overwriting fresher results.
      const requestId = ++latestRequestIdRef.current;

      try {
        setIsDataLoading(true);

        const res = await searchUserApi(undefined, {
          ...getFilters(filterData, pageData, limit),
        });

        if (requestId !== latestRequestIdRef.current) return;

        setUserData(mapUserDataRows(res.data ?? []));
        setTotalUsers(res.pagination?.countAll ?? 0);
      } catch (error) {
        if (requestId !== latestRequestIdRef.current) return;

        console.log(error);
        setUserData([]);
        setTotalUsers(0);
      } finally {
        if (requestId === latestRequestIdRef.current) {
          setSelectAll(false);
          setMemberChecked([]);
          setIsDataLoading(false);
        }
      }
    },
    [mapUserDataRows, getFilters]
  );

  useEffect(() => {
    // Runs once on mount to load the initial (unfiltered) result page. This
    // is a genuine fetch-on-mount effect; there's no way to do this outside
    // an effect without a data-fetching library.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData(formData, page, rowsPerPage);
    // fetchData/formData/page/rowsPerPage are intentionally omitted:
    // fetchData is recreated whenever mapUserDataRows changes (i.e.
    // whenever dropdown reference data loads), and every other trigger for
    // a search (search/clear button, page/rows-per-page change) already
    // calls fetchData explicitly — depending on it here would re-run this
    // effect and fire a duplicate search each time the dropdown data
    // resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDropdownChange = (
    // AutoComplete emits null when the selection is cleared.
    event: React.SyntheticEvent,
    key: keyof typeof formData,
    value: string | OptionType | null,
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

  const handleSelectAll = () => {
    if (selectAll) {
      setMemberChecked([]);
    } 
    else {
      setMemberChecked(userData.map((user) => user.user_id));
    }

    setSelectAll((prev) => !prev);
  };

  /*
    MUI's TablePagination is zero-based, while `page` state is one-based (it
    is sent straight to the backend's `page` filter and used for the row
    numbering column), so the event's newPage is converted here. MUI also
    passes null as the event when the page changes without a click (e.g.
    after the rows-per-page control clamps the page), so the event is
    optional-chained rather than dereferenced.
  */
  const handleChangePage = async (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    event?.preventDefault();
    const nextPage = newPage + 1;
    setPage(nextPage);
    await fetchData(formData, nextPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(1);
    await fetchData(formData, 1, newRowsPerPage);
  };

  const onCheckMemberClick = useCallback(
    (id: string) => {
      if (memberChecked.includes(id)) {
        setMemberChecked((prev) => prev.filter((memberId) => memberId !== id));
      } 
      else {
        setMemberChecked((prev) => [...prev, id]);
      }
    },
    [memberChecked]
  );

  const handleExportExcel = async () => {
    const dateFormat = i18n.language === "th" ? "BBBB-MM-DD" : "YYYY-MM-DD";
    const dataDateFormat = i18n.language === "th" ? "DD/MM/BBBB HH:mm:ss" : "DD/MM/YYYY HH:mm:ss";
    const subAgencyHeaders = Array.from({ length: MAX_SUB_AGENCY }, (_, index) =>
      t("table.header.sub-agency", { number: index + 1 })
    );
    await exportExcel({
      sheetName: `${t('file-name.manage-user')}`,
      fileName: `${t('file-name.manage-user')}_${dayjs().format(dateFormat)}.xlsx`,
      headers: [
        t('table.header.no'),
        t('table.header.pid'),
        t('table.header.prefix'),
        t('table.header.first-name'),
        t('table.header.last-name'),
        t('table.header.position'),
        t('table.header.agency'),
        t('table.header.bh'),
        t('table.header.bk'),
        t('table.header.org'),
        ...subAgencyHeaders,
        t('table.header.email'),
        t('table.header.mobile'),
        t('table.header.group-name'),
        t('table.header.update-profile-status'),
        t('table.header.latest-update-profile-date'),
        t('table.header.remark'),
      ],
      data: userData,
      mapRow: (data, index) => [
        index + 1,
        data.idcard || "-",
        data.title || "-",
        data.firstname,
        data.lastname,
        data.position || "-",
        data.ou_name || "-",
        data.bh_name || "-",
        data.bk_name || "-",
        data.org_name || "-",
        ...(Array.from({ length: MAX_SUB_AGENCY }, (_, index) => data.sub_unit?.[index] || "-")),
        data.email || "-",
        data.phone || "-",
        data.user_group_name || "-",
        data.police_profile_status || "-",
        data.police_profile_status_datetime ? 
          dayjs(data.police_profile_status_datetime).format(dataDateFormat)
          : "-",
        data.remark || "-",
      ],
      columnStyles: {
        2: { alignment: { horizontal: "center" } },
      },
    });
  };

  const handleEdit = async (user: User) => {
    navigate("/add-approve-user/add", {
      state: {
        user,
        page: "manage_user",
        returnTo: "/manage-user",
      },
    });
  };

  const handleSearchClick = async () => {
    setPage(1);
    await fetchData(formData, 1, rowsPerPage);
  };

  const handleClearClick = async () => {
    setFormData({
      pid: "",
      name: "",
      agency_id: "",
      bh_id: "0",
      bk_id: "0",
      org_id: "0",
      user_group_id: "0",
      status_id: "0",
      sub_unit: "",
    });

    setPage(1);
  };

  const renderCellValue = (
    columnId: Column["id"],
    data: User,
    index: number
  ) => {
    if (columnId.startsWith("sub_agency_")) {
      const subAgencyIndex = Number(columnId.replace("sub_agency_", ""));
      return data.sub_unit?.[subAgencyIndex] || "-";
    }

    switch (columnId) {
      case "actions":
        return (
          <Checkbox
            checked={memberChecked.includes(data.user_id)}
            onClick={(event) => event.stopPropagation()}
            onChange={() => onCheckMemberClick(data.user_id)}
            sx={{ color: "var(--secondary-color)" }}
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
            onClick={(event) => {
              event.stopPropagation();
              handleEdit(data);
            }}
            alt="Edit"
          />
        );

      case "id":
        return (page - 1) * rowsPerPage + index + 1;

      case "pid":
        return data.idcard ? formatThaiID(data.idcard) : "-";

      case "prefix":
        return data.title || "-";

      case "name":
        return data.firstname || "-";

      case "last_name":
        return data.lastname || "-";

      case "position":
        return data.position || "-";

      case "ou":
        return data.ou_name || "-";

      case "bh":
        return data.bh_name || "-";

      case "bk":
        return data.bk_name || "-";

      case "org":
        return data.org_name || "-";

      case "email":
        return data.email || "-";

      case "mobile":
        return data.phone ? formatPhone(data.phone) : "-";

      case "user_group":
        return data.user_group_name || "-";

      case "update_profile_status":
        return data.police_profile_status || "-";

      case "latest_update_profile_date":
        return data.police_profile_status_datetime
          ? dayjs(data.police_profile_status_datetime).format(
              i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY"
            )
          : "-";

      case "account_status":
        return capitalizeWords(data.account_status) || "-";
      
      case "last_login":
        return data.last_login
          ? dayjs(data.last_login).format(
              i18n.language === "th" ? "DD/MM/BBBB HH:mm:ss" : "DD/MM/YYYY HH:mm:ss"
            )
          : "-";

      case "remark":
        return data.remark || "-";

      default:
        // Unreachable: visibleColumns only ever contains ids handled above
        // (the remaining AddApproveData-derived ids are filtered out before
        // rendering), so there's no column id left needing a dynamic,
        // unsafely-typed lookup into `data` here.
        return "-";
    }
  };

  const getCellCopyValue = (
    columnId: Column["id"],
    data: User,
    index: number
  ) => {
    if (columnId.startsWith("sub_agency_")) {
      const subAgencyIndex = Number(columnId.replace("sub_agency_", ""));
      return data.sub_unit?.[subAgencyIndex] || "-";
    }

    switch (columnId) {
      case "actions":
      case "edit":
        return "";

      case "id":
        return String((page - 1) * rowsPerPage + index + 1);

      case "pid":
        return data.idcard || "-";

      case "prefix":
        return data.title || "-";

      case "name":
        return data.firstname || "-";

      case "last_name":
        return data.lastname || "-";

      case "position":
        return data.position || "-";

      case "ou":
        return data.ou_name || "-";

      case "bh":
        return data.bh_name || "-";

      case "bk":
        return data.bk_name || "-";

      case "org":
        return data.org_name || "-";

      case "email":
        return data.email || "-";

      case "mobile":
        return data.phone || "-";

      case "user_group":
        return data.user_group_name || "-";

      case "update_profile_status":
        return data.police_profile_status || "-";

      case "latest_update_profile_date":
        return data.police_profile_status_datetime
          ? dayjs(data.police_profile_status_datetime).format(
              i18n.language === "th" ? "DD/MM/BBBB" : "DD/MM/YYYY"
            )
          : "-";

      case "account_status":
        return capitalizeWords(data.active_status) || "-";

      case "last_login":
        return data.last_login
          ? dayjs(data.last_login).format(
              i18n.language === "th"
                ? "DD/MM/BBBB HH:mm:ss"
                : "DD/MM/YYYY HH:mm:ss"
            )
          : "-";

      case "remark":
        return data.remark || "-";

      default:
        // Unreachable — see the matching comment in renderCellValue.
        return "-";
    }
  };

  const handleCopy = async (value: string) => {
    if (!value || value === "-") return;

    try {
      await navigator.clipboard.writeText(value);
      setIsAlertOpen(true);

      setTimeout(() => {
        setIsAlertOpen(false);
      }, 1500)
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section id="manage-user" className="flex flex-col h-full w-full p-2">
      {/* Main Title */}
      <MainTitle title={t('pages.manage-user')} />
      <Box className='flex flex-col p-4 bg-(--main-bg-color) flex-1 min-h-0 w-full rounded-lg border border-(--primary-color) overflow-y-auto gap-2'>
        <Accordion
          expanded={isAccordionOpen}
          onChange={() => setIsAccordionOpen((prev) => !prev)}
          disableGutters
          elevation={0}
          sx={{
            borderRadius: "16px",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, var(--primary-color-a08), var(--tertiary-color))",
            border: "1px solid var(--primary-color-a25)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: 0 },
          }}
        >
          <AccordionSummary
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
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "var(--primary-color-a12)",
                }}
              >
                <FilterAltOutlinedIcon sx={{ color: "var(--primary-color)" }} />
              </Box>

              <Typography
                sx={{
                  color: "var(--primary-color)",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                {t("text.search-condition")}
              </Typography>
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
                    borderColor: "var(--primary-color-a50)",
                    color: "var(--primary-color)",
                    textTransform: "capitalize",
                    fontWeight: 600,
                  }}
                  onClick={handleClearClick}
                >
                  {t("button.clear")}
                </Button>

                <Button
                  variant="contained"
                  startIcon={
                    <SearchIcon style={{ color: "var(--tertiary-color)" }} />
                  }
                  sx={{
                    minWidth: 140,
                    height: 40,
                    borderRadius: "10px",
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                    textTransform: "capitalize",
                    fontWeight: 700,
                  }}
                  onClick={handleSearchClick}
                >
                  {t("button.search")}
                </Button>
              </Stack>
            </Collapse>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 3, pb: 3, pt: 1 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: "14px",
                backgroundColor: "var(--tertiary-color)",
                border: "1px solid var(--primary-color-a16)",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <TextBox
                  sx={{ marginTop: "5px" }}
                  id="pid"
                  label={t('component.pid')}
                  placeholder={t('placeholder.pid')}
                  labelFontSize="16px"
                  value={formData.pid}
                  onChange={(event) =>
                    handleTextChange("pid", event.target.value)
                  }
                />

                <TextBox
                  sx={{ marginTop: "5px" }}
                  id="name"
                  label={t('component.fullname')}
                  placeholder={t('placeholder.fullname')}
                  labelFontSize="16px"
                  value={formData.name}
                  onChange={(event) =>
                    handleTextChange("name", event.target.value)
                  }
                />

                <AutoComplete 
                  id="user-group-select"
                  sx={{ marginTop: "5px" }}
                  value={formData.user_group_id}
                  onChange={(event, value) => handleDropdownChange(event, "user_group_id", value)}
                  options={userGroupOptions}
                  label={t('component.user-group')}
                  placeholder={t('placeholder.user-group')}
                  labelFontSize="16px"
                />

                <AutoComplete 
                  id="status-select"
                  sx={{ marginTop: "5px" }}
                  value={formData.status_id}
                  onChange={(event, value) => handleDropdownChange(event, "status_id", value)}
                  options={statusOptions}
                  label={t('component.active-status')}
                  placeholder={t('placeholder.active-status')}
                  labelFontSize="16px"
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
                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="sub-unit"
                    label={t('component.only-sub-agency')}
                    placeholder={t('placeholder.only-sub-agency')}
                    labelFontSize="16px"
                    value={formData.sub_unit}
                    onChange={(event) =>
                      handleTextChange("sub_unit", event.target.value)
                    }
                  />
                )}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box className="flex flex-col gap-3">
          <Box className="flex justify-between items-center">
            <Typography variant="body1" sx={{ fontSize: "1rem", color: "var(--primary-color)" }}>
              {`${t('text.all')} ${totalUsers} ${t('text.name-list')}`}
            </Typography>
            <Box className="flex gap-2">
              {canEdit && (
                <Button
                  variant="contained"
                  sx={{
                    width: 140,
                    height: 35,
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                    "&:hover": {
                      backgroundColor:  "var(--primary-color-a80)",
                    },
                    textTransform: "capitalize"
                  }}
                  onClick={() => setOpenUpdateProfileDialog(true)}
                >
                  {t('button.update-profile')}
                </Button>
              )}
              {canPrint && (
                <Button
                  variant="outlined"
                  sx={{
                    width: 130,
                    height: 35,
                    backgroundColor: "var(--tertiary-color)",
                    color: "var(--primary-color)",
                    border: "1px solid var(--primary-color)",
                    "&:hover": {
                      backgroundColor:  "var(--tertiary-color-a80)",
                    },
                    textTransform: "capitalize"
                  }}
                  startIcon={
                    <img src={ExcelIcon} alt='Excel' className='w-5 h-6' />
                  }
                  onClick={handleExportExcel}
                >
                  {t('button.export')}
                </Button>
              )}
            </Box>
          </Box>
          <TableContainer
            component={Paper}
            sx={{
              overflowX: "scroll",
              overflowY: "auto",
              direction: "ltr",
              height: isAccordionOpen ? `calc(100vh - ${formData.sub_unit.length > 3 ? "800px" : "600px"})` : "65vh",
              minHeight: formData.sub_unit.length <= 3 ? "42vh" : "34vh",
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
                    visibleColumns?.map((column) => (
                      <TableCell
                        size="medium"
                        key={column.id}
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
                            checked={selectAll}
                            onChange={handleSelectAll}
                            indeterminate={
                              memberChecked.length > 0 &&
                              memberChecked.length < userData.length
                            }
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
                {isDataLoading ? (
                  <TableSkeleton headerColumn={visibleColumns?.length ?? 0} />
                ) : userData.length > 0 ? (
                  userData.map((data, index) => (
                    <TableRow
                      key={data.user_id}
                      sx={{
                        "& .MuiTableCell-root": {
                          backgroundColor: "var(--tertiary-color)",
                          color: "var(--secondary-color)",
                          borderBottom: "1px solid var(--primary-color)",
                        },
                      }}
                    >
                      {visibleColumns.map((column, colIndex) => (
                        <TableCell
                          key={`${data.user_id}-${column.id ?? colIndex}`}
                          align={column.align || "center"}
                          sx={{
                            px: 1,
                            py: 0.5,
                            textAlign: "center",
                          }}
                          onClick={() => {
                            const copyValue = getCellCopyValue(column.id, data, index);

                            if (copyValue) {
                              handleCopy(copyValue);
                            }
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
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[100, 500, 1000]}
            component="div"
            count={totalUsers}
            rowsPerPage={rowsPerPage}
            page={page - 1}
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
      {
        openUpdateProfileDialog && (
          <UpdateProfile
            open={openUpdateProfileDialog}
            onClose={() => setOpenUpdateProfileDialog(false)}
          />
        )
      }

      <Snackbar
        open={isAlertOpen}
        autoHideDuration={2000}
        onClose={() => setIsAlertOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setIsAlertOpen(false)}
          sx={{
            color: "var(--primary-color)",
            border: "1px solid var(--primary-color)",
            backgroundColor: "var(--tertiary-color)",
            "& .MuiSvgIcon-root": {
              color: "var(--primary-color)",
            }
          }}
        >
          {t('text.copy-to-clipboard')}
        </Alert>
      </Snackbar>
    </section>
  )
}

export default ManageUser;
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

// Components
import DialogComponent from "../dialog/Dialog";
import AutoComplete from "../auto-complete/AutoComplete";
import TextBox from "../text-box/TextBox";
import TableSkeleton from "../table-skeleton/TableSkeleton";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { OptionType, User } from "../../types/common";

// API
import { searchUserApi } from "../../features/users/api/UsersApi";

// Utils
import { buildOptions, formatThaiID } from "../../utils/commonFunctions";
import { PopupMessageWithCancel } from "../../utils/popupMessage";

// Store
import type { RootState } from "../../store/store";

type SearchForm = {
  username: string;
  name: string;
  idcard: string;
  agency: string;
  bh: string;
};

const EMPTY_FORM: SearchForm = {
  username: "",
  name: "",
  idcard: "",
  agency: "",
  bh: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  groupName: string;
  /** Users already in the group; excluded from the results. */
  assignedUserIds: readonly string[];
  onConfirm: (users: User[]) => Promise<void>;
};

const AssignUserDialog = ({
  open,
  onClose,
  groupName,
  assignedUserIds,
  onConfirm,
}: Props) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [formData, setFormData] = useState<SearchForm>(EMPTY_FORM);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const [userData, setUserData] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Guards against a stale response overwriting a newer search.
  const fetchRequestRef = useRef(0);

  // Slice — per field so the dialog does not re-render on unrelated updates.
  const agency = useSelector((state: RootState) => state.dropdown.agency);
  const bh = useSelector((state: RootState) => state.dropdown.bh);

  const assignedIdSet = useMemo(
    () => new Set(assignedUserIds),
    [assignedUserIds]
  );

  const agencyOptions = useMemo(() => {
    const langKey = i18n.language === "th" ? "ou_abbr_th" : "ou_abbr_en";
    return buildOptions(agency, t("dropdown.all-agency"), langKey, "ou_code", true, "");
  }, [agency, t, i18n.language]);

  const bhOptions = useMemo(() => {
    const langKey = i18n.language === "th" ? "bh_abbr_th" : "bh_abbr_en";
    const filtered = formData.agency
      ? bh.filter((item) => item.ou_code === formData.agency)
      : bh;

    return buildOptions(filtered, t("dropdown.all-bh"), langKey, "bh_code", true, "");
  }, [bh, t, i18n.language, formData.agency]);

  const buildFilters = useCallback(
    (filterData: SearchForm, pageData: number, limit: number) => {
      const filters: Record<string, string> = {
        filter: "approve_status=approved",
        page: pageData.toString(),
        limit: limit.toString(),
      };

      if (filterData.username.trim()) filters.username = `*${filterData.username.trim()}*`;
      if (filterData.name.trim()) filters.fullname = `*${filterData.name.trim()}*`;
      if (filterData.idcard.trim()) filters.idcard = `*${filterData.idcard.trim()}*`;
      if (filterData.agency) filters.ou_code = filterData.agency;
      if (filterData.bh) filters.bh_code = filterData.bh;

      return filters;
    },
    []
  );

  const fetchData = useCallback(
    async (filterData: SearchForm, pageData: number, limit: number) => {
      const requestId = ++fetchRequestRef.current;

      try {
        setIsDataLoading(true);

        const res = await searchUserApi(undefined, {
          ...buildFilters(filterData, pageData, limit),
        });

        if (fetchRequestRef.current !== requestId) return;

        setUserData(res.data ?? []);
        setTotalUsers(res.pagination?.countAll ?? 0);
      }
      catch (error) {
        if (fetchRequestRef.current !== requestId) return;

        console.error("Failed to search users:", error);
        setUserData([]);
        setTotalUsers(0);
      }
      finally {
        if (fetchRequestRef.current === requestId) setIsDataLoading(false);
      }
    },
    [buildFilters]
  );

  /*
    Reset and load whenever the dialog opens, so a previous session's filters
    and selection never leak into the next one.
  */
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setFormData(EMPTY_FORM);
      setSelectedUsers([]);
      setPage(1);
    }
  }

  useEffect(() => {
    if (!open) return;

    void (async () => {
      await fetchData(EMPTY_FORM, 1, rowsPerPage);
    })();
    // Deliberately keyed on `open` only: re-running on formData/page would turn
    // the explicit Search button into search-as-you-type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Users already in the group must never be offered again.
  const selectableUsers = useMemo(
    () => userData.filter((user) => !assignedIdSet.has(user.user_id)),
    [userData, assignedIdSet]
  );

  const selectedIdSet = useMemo(
    () => new Set(selectedUsers.map((user) => user.user_id)),
    [selectedUsers]
  );

  const allOnPageSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((user) => selectedIdSet.has(user.user_id));

  const handleTextChange = (key: keyof SearchForm, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDropdownChange = (
    key: keyof SearchForm,
    value: string | OptionType | null
  ) => {
    const selected = typeof value === "string" ? value : value?.value ?? "";

    setFormData((prev) => {
      const next = { ...prev, [key]: selected };

      // Clearing the agency invalidates the dependent bh selection.
      if (key === "agency") next.bh = "";

      return next;
    });
  };

  const handleSearch = async () => {
    setPage(1);
    await fetchData(formData, 1, rowsPerPage);
  };

  const handleToggleUser = (user: User, checked: boolean) => {
    setSelectedUsers((prev) =>
      checked
        ? [...prev, user]
        : prev.filter((item) => item.user_id !== user.user_id)
    );
  };

  const handleToggleAll = (checked: boolean) => {
    setSelectedUsers((prev) => {
      if (!checked) {
        const pageIds = new Set(selectableUsers.map((user) => user.user_id));
        return prev.filter((user) => !pageIds.has(user.user_id));
      }

      const merged = new Map(prev.map((user) => [user.user_id, user]));
      selectableUsers.forEach((user) => merged.set(user.user_id, user));

      return Array.from(merged.values());
    });
  };

  const handleChangePage = async (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    event?.preventDefault();
    setPage(newPage);
    await fetchData(formData, newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const limit = parseInt(event.target.value, 10);

    setRowsPerPage(limit);
    setPage(1);
    await fetchData(formData, 1, limit);
  };

  const handleConfirm = async () => {
    // Double-submission guard: the confirm popup is awaited, so without this
    // a second click while it is open would queue another assignment.
    if (isSubmitting || selectedUsers.length === 0) return;

    const confirmed = await PopupMessageWithCancel(
      t("popup.assign-user-title"),
      t("popup.assign-user-message", {
        count: selectedUsers.length,
        group: groupName,
      }),
      t("button.confirm"),
      t("button.cancel"),
      "question"
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await onConfirm(selectedUsers);
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogComponent
      open={open}
      handleClose={isSubmitting ? () => undefined : onClose}
      dialogTitle={t("dialog.assign-user")}
      width="1100px"
      disabled={isSubmitting}
    >
      <Box className="flex flex-col gap-3 p-2">
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <TextBox
            label={t("component.full-name")}
            value={formData.name}
            onChange={(event) => handleTextChange("name", event.target.value)}
          />
          <TextBox
            label={t("component.pid")}
            value={formData.idcard}
            onChange={(event) => handleTextChange("idcard", event.target.value)}
          />
          <AutoComplete
            value={formData.agency}
            onChange={(_event, value) => handleDropdownChange("agency", value)}
            options={agencyOptions}
            label={t("component.agency")}
          />
          <AutoComplete
            value={formData.bh}
            onChange={(_event, value) => handleDropdownChange("bh", value)}
            options={bhOptions}
            label={t("component.bh")}
          />
        </Box>

        <Box className="flex items-center justify-between">
          <Typography sx={{ fontSize: "14px", color: "var(--theme-accent)" }}>
            {t("text.selected-count", { count: selectedUsers.length })}
          </Typography>

          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={isDataLoading}
            sx={{
              backgroundColor: "var(--theme-accent)",
              color: "var(--theme-panel)",
            }}
          >
            {t("button.search")}
          </Button>
        </Box>

        <TableContainer
          component={Paper}
          sx={{
            height: "45vh",
            borderRadius: "0px",
            backgroundColor: "var(--theme-panel)",
          }}
        >
          <Table stickyHeader size="small">
            <TableHead
              sx={{
                "& .MuiTableCell-root": {
                  color: "var(--theme-accent-soft)",
                  border: "none",
                  backgroundColor: "rgba(var(--theme-accent-rgb), 0.50)",
                }
              }}
            >
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{ backgroundColor: "var(--theme-panel)" }}
                >
                  <Checkbox
                    size="small"
                    checked={allOnPageSelected}
                    indeterminate={!allOnPageSelected && selectableUsers.some((user) => selectedIdSet.has(user.user_id))}
                    onChange={(event) => handleToggleAll(event.target.checked)}
                    sx={{ color: "var(--theme-accent)", "&.Mui-checked": { color: "var(--theme-accent)" } }}
                  />
                </TableCell>
                {[
                  t("table.header.username"),
                  t("table.header.full-name"),
                  t("table.header.pid-2"),
                  t("table.header.agency"),
                  t("table.header.position"),
                ].map((header) => (
                  <TableCell
                    key={header}
                    sx={{
                      backgroundColor: "var(--theme-panel)",
                      color: "var(--theme-accent)",
                      fontWeight: 600,
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody
              sx={{
                "& .MuiTableCell-root": {
                  color: "var(--theme-accent-soft)",
                  borderBottom: "1px dashed var(--theme-accent)"
                }
              }}
            >
              {isDataLoading ? (
                <TableSkeleton headerColumn={6} />
              ) : selectableUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ color: "var(--theme-accent)" }}
                  >
                    {t("text.data-not-found")}
                  </TableCell>
                </TableRow>
              ) : (
                selectableUsers.map((user) => {
                  const checked = selectedIdSet.has(user.user_id);

                  return (
                    <TableRow key={user.user_id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={checked}
                          onChange={(event) => handleToggleUser(user, event.target.checked)}
                          sx={{ color: "var(--theme-accent)", "&.Mui-checked": { color: "var(--theme-accent)" } }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: "var(--theme-accent)" }}>{user.username}</TableCell>
                      <TableCell sx={{ color: "var(--theme-accent)" }}>
                        {`${user.firstname ?? ""} ${user.lastname ?? ""}`.trim() || "-"}
                      </TableCell>
                      <TableCell sx={{ color: "var(--theme-accent)" }}>
                        {formatThaiID(user.idcard) || "-"}
                      </TableCell>
                      <TableCell sx={{ color: "var(--theme-accent)" }}>{user.ou_name ?? "-"}</TableCell>
                      <TableCell sx={{ color: "var(--theme-accent)" }}>{user.position ?? "-"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[50, 100, 200]}
          sx={{ 
            color: "var(--theme-accent)",
            "& .MuiSvgIcon-root": {
              color: "var(--theme-accent)",
            }
          }}
        />

        <Box className="flex justify-end gap-2">
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{ color: "var(--theme-accent)", borderColor: "var(--theme-accent)" }}
          >
            {t("button.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isSubmitting || selectedUsers.length === 0}
            sx={{
              backgroundColor: "var(--theme-accent)",
              color: "var(--theme-panel)",
              "&.Mui-disabled": {
                backgroundColor: "var(--theme-accent)",
                color: "var(--theme-panel)",
                opacity: 0.5,
              },
            }}
          >
            {t("button.assign")}
          </Button>
        </Box>
      </Box>
    </DialogComponent>
  );
};

export default AssignUserDialog;

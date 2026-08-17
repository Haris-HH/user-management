import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Checkbox from "@mui/material/Checkbox";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";

// Components
import Dialog from "../dialog/Dialog";
import SearchFilter from "../search-filter/SearchFilter";
import TableSkeleton from "../../components/table-skeleton/TableSkeleton";

// API
import { searchUserApi } from "../../features/users/api/UsersApi";

// Types
import type { User } from "../../types/common";
import type { FormData } from "../search-filter/SearchFilter";
import type { RootState } from "../../store/store";

// i18n
import { useTranslation } from "react-i18next";

// Utils
import { capitalizeWords, formatPhone, formatThaiID } from "../../utils/commonFunctions";
import { PopupMessage } from "../../utils/popupMessage";

const initialFormData: FormData = {
  pid: "",
  name: "",
  agency: "",
  bh: "",
  bk: "",
  org: "",
  sub_unit: [],
};

type Props = {
  open: boolean;
  onClose: () => void;
  // The already-selected users arrive as whole rows, not just ids: the dialog
  // has to hand every checked user back on save, including ones sitting on a
  // page the table never loaded, and an id alone can't rebuild a row.
  selectedUsers?: User[];
  onSave?: (users: User[]) => void;
};

// "Select all" walks every page of the current search, so it asks for far
// bigger pages than the table itself uses.
const SELECT_ALL_PAGE_LIMIT = 1500;

const AddUser = ({
  open,
  onClose,
  selectedUsers = [],
  onSave,
}: Props) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);
  // Set once "select all" has pulled every page, so the header checkbox stays
  // ticked while the user pages through the result.
  const [allPagesSelected, setAllPagesSelected] = useState(false);

  // Data
  const [userData, setUserData] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);

  // Checked users are kept as whole rows keyed by id rather than as a list of
  // ids: a selection spans pages `userData` no longer holds, so the rows on
  // screen are not enough to rebuild what has to be saved.
  const [memberChecked, setMemberChecked] = useState<Map<string, User>>(
    new Map()
  );

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;

  // Form Data
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Redux
  // One selector per field so this dialog doesn't re-render on every
  // unrelated dropdown slice update (a burst of thunks fires on login).
  const title = useSelector((state: RootState) => state.dropdown.title);
  const agency = useSelector((state: RootState) => state.dropdown.agency);
  const bh = useSelector((state: RootState) => state.dropdown.bh);
  const bk = useSelector((state: RootState) => state.dropdown.bk);
  const org = useSelector((state: RootState) => state.dropdown.org);
  const userGroup = useSelector((state: RootState) => state.dropdown.userGroup);

  const titleMap = useMemo(
    () => new Map(title.map((item) => [item.id, item])),
    [title]
  );

  const agencyMap = useMemo(
    () => new Map(agency.map((item) => [item.ou_code, item])),
    [agency]
  );

  const bhMap = useMemo(
    () => new Map(bh.map((item) => [item.bh_code, item])),
    [bh]
  );

  const bkMap = useMemo(
    () => new Map(bk.map((item) => [item.bk_code, item])),
    [bk]
  );

  const orgMap = useMemo(
    () => new Map(org.map((item) => [item.org_code, item])),
    [org]
  );

  const userGroupMap = useMemo(
    () => new Map(userGroup.map((item) => [item.group_id, item])),
    [userGroup]
  );

  const selectedUserIdSet = useMemo(
    () => new Set(selectedUsers.map((user) => user.user_id)),
    [selectedUsers]
  );

  // Ticked once every page is covered; otherwise it falls back to "is this
  // page fully ticked" so the box still reflects a manual page selection.
  const selectAll =
    allPagesSelected ||
    (userData.length > 0 &&
      userData.every((user) => memberChecked.has(user.user_id)));

  const isIndeterminate = !selectAll && memberChecked.size > 0;

  const getFilters = useCallback(
    (filterData: FormData, pageData: number, limit: number) => {
      const filters: Record<string, string> = {
        filter: "approve_status=approved",
        page: pageData.toString(),
        limit: limit.toString(),
      };

      if (filterData.pid.trim()) {
        filters.idcard = `*${filterData.pid.trim()}*`;
      }

      if (filterData.name.trim()) {
        filters.fullname = `*${filterData.name.trim()}*`;
      }

      if (filterData.agency) {
        filters.ou_code = filterData.agency;
      }

      if (filterData.bh) {
        filters.bh_code = filterData.bh;
      }

      if (filterData.bk) {
        filters.bk_code = filterData.bk;
      }

      if (filterData.org) {
        filters.org_code = filterData.org;
      }

      return filters;
    },
    []
  );

  const mapUserDataRows = useCallback(
    (data: User[]) => {
      return data.map((item) => {
        const titleData = item.title_id ? titleMap.get(item.title_id) : null;
        const agencyData = item.ou_code ? agencyMap.get(item.ou_code) : null;
        const bhData = item.bh_code ? bhMap.get(item.bh_code) : null;
        const bkData = item.bk_code ? bkMap.get(item.bk_code) : null;
        const orgData = item.org_code ? orgMap.get(item.org_code) : null;
        const userGroupData = item.user_group_id ? userGroupMap.get(item.user_group_id) : null;

        return {
          ...item,
          title:
            titleData
              ? (i18n.language === "th"
                ? titleData.title_abbr_th
                : titleData.title_abbr_en) ?? "-"
              : "-",
          ou_name:
            agencyData
              ? (i18n.language === "th"
                ? agencyData.ou_abbr_th
                : agencyData.ou_abbr_en) ?? "-"
              : "-",
          bh_name:
            bhData
              ? (i18n.language === "th"
                ? bhData.bh_abbr_th
                : bhData.bh_abbr_en) ?? "-"
              : "-",
          bk_name:
            bkData
              ? (i18n.language === "th"
                ? bkData.bk_abbr_th
                : bkData.bk_abbr_en) ?? "-"
              : "-",
          org_name:
            orgData
              ? (i18n.language === "th"
                ? orgData.org_abbr_th
                : orgData.org_abbr_en) ?? "-"
              : "-",
          user_group_name: capitalizeWords(userGroupData?.group_name ?? ""),
        };
      });
    },
    [titleMap, agencyMap, bhMap, bkMap, orgMap, userGroupMap, i18n.language]
  );

  // Guards against a slow, stale search/page response overwriting a newer
  // one when the user changes the filter or page again before it resolves.
  const fetchRequestRef = useRef(0);

  const fetchData = useCallback(
    async (filterData: FormData, pageData: number, limit: number = rowsPerPage) => {
      const requestId = ++fetchRequestRef.current;

      try {
        setIsDataLoading(true);

        const res = await searchUserApi(undefined, {
          ...getFilters(filterData, pageData, limit),
        });

        if (fetchRequestRef.current !== requestId) return;

        setUserData(mapUserDataRows(res.data ?? []));
        setTotalPages(res.pagination?.maxPage ?? 1);
        setTotalUsers(res.pagination?.countAll ?? 0);
      }
      catch {
        if (fetchRequestRef.current !== requestId) return;
        setUserData([]);
        setTotalPages(1);
        setTotalUsers(0);
      }
      finally {
        if (fetchRequestRef.current === requestId) setIsDataLoading(false);
      }
    },
    [rowsPerPage, getFilters, mapUserDataRows]
  );

  useEffect(() => {
    if (!open) return;

    // fetchData sets state after its internal `await`, not synchronously in
    // the effect body; the IIFE keeps that async boundary explicit for the
    // compiler's effect lint.
    void (async () => {
      await fetchData(formData, page);
    })();
  }, [open, formData, page, fetchData]);

  // Re-seeds the user-editable checkbox state from the incoming selection when
  // the dialog opens or that selection changes. This is a deliberate "adjust
  // state from props" sync, not a derived value, since the user toggles
  // checkboxes independently afterwards — eslint-disable is intentional here.
  //
  // NOTE: it must NOT depend on `userData`. It used to, which meant every page
  // change reset the checkboxes back to the incoming selection and made a
  // selection spanning pages impossible to build.
  useEffect(() => {
    if (!open) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemberChecked(
      new Map(selectedUsers.map((user) => [user.user_id, user]))
    );
    setAllPagesSelected(false);
  }, [open, selectedUsers]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    event.preventDefault();

    setPage(newPage);
  };

  // Walks every page of the current search so the checked set covers rows the
  // table never loaded — the backend caps a page at 1500 rows.
  const fetchAllMatchingUsers = useCallback(async () => {
    const collected: User[] = [];

    let currentPage = 1;

    for (;;) {
      const res = await searchUserApi(undefined, {
        ...getFilters(formData, currentPage, SELECT_ALL_PAGE_LIMIT),
      });

      const users = res.data ?? [];

      if (users.length === 0) break;

      collected.push(...users);

      const maxPage = res.pagination?.maxPage ?? 1;

      if (currentPage >= maxPage) break;

      currentPage++;
    }

    return mapUserDataRows(collected);
  }, [formData, getFilters, mapUserDataRows]);

  const handleSelectAll = async (checked: boolean) => {
    // Unticking clears the whole selection, not just this page — the box
    // stands for every row behind the current search.
    if (!checked) {
      setAllPagesSelected(false);
      setMemberChecked(new Map());
      return;
    }

    try {
      setIsSelectingAll(true);

      const allUsers = await fetchAllMatchingUsers();

      setMemberChecked((prev) => {
        const next = new Map(prev);

        allUsers.forEach((user) => next.set(user.user_id, user));

        return next;
      });

      setAllPagesSelected(true);
    }
    catch {
      await PopupMessage(t("popup.fetch-error"), "", "error");
    }
    finally {
      setIsSelectingAll(false);
    }
  };

  const handleCheckMember = (user: User, checked: boolean) => {
    // Any manual untick means the selection is no longer "everything".
    if (!checked) {
      setAllPagesSelected(false);
    }

    setMemberChecked((prev) => {
      const next = new Map(prev);

      if (checked) {
        next.set(user.user_id, user);
      } else {
        next.delete(user.user_id);
      }

      return next;
    });
  };

  const resetAddUser = () => {
    setFormData(initialFormData);
    setPage(1);
    setUserData([]);
    setTotalUsers(0);
    setTotalPages(1);
    setAllPagesSelected(false);
    setMemberChecked(new Map());
    setIsSearchFilterOpen(false);
  };

  const handleCloseAddUser = () => {
    resetAddUser();
    onClose();
  };

  const handleCancel = () => {
    handleCloseAddUser();
  };

  const handleSearch = (data: FormData) => {
    setFormData(data);
    setPage(1);
    // A new search means a different "all", so the flag can't carry over.
    setAllPagesSelected(false);
  };

  const handleSave = () => {
    onSave?.(Array.from(memberChecked.values()));
  };

  return (
    <Dialog
      open={open}
      handleClose={handleCloseAddUser}
      dialogTitle={t("dialog.add-user")}
      width="1500px"
    >
      <Box className="flex flex-col gap-4 pt-3 h-[75dvh]">
        <div className="flex justify-between items-end">
          <p className="text-[14px] text-(--theme-accent-soft) font-medium">
            {`${totalUsers} ${t("text.list")}`}
            {memberChecked.size > 0 &&
              ` | ${t("text.select")} ${memberChecked.size} ${t("text.list")}`}
          </p>

          <Button
            variant="contained"
            sx={{
              width: t("button.search-condition-size"),
              height: 35,
              backgroundColor: "var(--theme-accent)",
              color: "var(--theme-panel)",
              "&:hover": {
                backgroundColor: "rgba(var(--theme-accent-rgb), 0.80)",
              },
              textTransform: "capitalize",
            }}
            onClick={() => setIsSearchFilterOpen(true)}
          >
            {t("button.search-condition")}
          </Button>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            height: "65vh",
            borderRadius: 0,
            border: "none",
            boxShadow: "none",
            backgroundImage: "none",
            backgroundColor: "var(--theme-panel)",

            "&.MuiPaper-root": {
              border: "none",
              boxShadow: "none",
              backgroundImage: "none",
            },

            "& .MuiTableCell-root": {
              borderBottom: "none",
            },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    height: "56.5px",
                    fontSize: "16px",
                    backgroundColor: "var(--theme-accent)",
                    color: "var(--theme-panel)",
                  },
                }}
              >
                <TableCell sx={{ width: "4%" }}>
                  {t("table.header.no")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.full-name")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.pid")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.agency")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.bh-sub-agency")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.bk-sub-agency")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.org-sub-agency")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.mobile")}
                </TableCell>
                <TableCell sx={{ width: "8%" }}>
                  {t("table.header.user-group")}
                </TableCell>
                <TableCell align="center" sx={{ padding: 0, width: "5%" }}>
                  <Checkbox
                    checked={selectAll}
                    indeterminate={isIndeterminate}
                    disabled={isSelectingAll}
                    onChange={(event) => void handleSelectAll(event.target.checked)}
                    sx={{
                      color: "var(--theme-panel)",
                      "&.Mui-checked": {
                        color: "var(--theme-panel)",
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isDataLoading || isSelectingAll ? (
                <TableSkeleton headerColumn={10} />
              ) : userData.length > 0 ? (
                userData.map((item, index) => {
                  const fullName = capitalizeWords(
                    `${item.title ?? ""} ${item.firstname ?? ""} ${
                      item.lastname ?? ""
                    }`
                  );

                  const isAlreadySelected = selectedUserIdSet.has(item.user_id);
                  const isChecked = memberChecked.has(item.user_id);
                  const agencyData = item.ou_code ? agencyMap.get(item.ou_code) : undefined;
                  const internalPolice = agencyData?.ou_codename === "police" || false;
                  return (
                    <TableRow
                      key={item.user_id}
                      sx={{
                        "&:hover td": {
                          backgroundColor: "rgba(var(--theme-accent-rgb), 0.08)",
                        },
                        "& .MuiTableCell-root": {
                          backgroundColor: isAlreadySelected
                            ? "rgba(var(--theme-accent-rgb), 0.12)"
                            : "var(--theme-panel)",
                          color: "var(--theme-accent-soft)",
                          borderBottom: "1px solid var(--theme-accent)",
                        },
                      }}
                    >
                      <TableCell>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell>{fullName || "-"}</TableCell>
                      <TableCell>{formatThaiID(item.idcard) || "-"}</TableCell>
                      <TableCell>{item.ou_name || "-"}</TableCell>
                      <TableCell>{internalPolice ? item.bh_name ?? "-" : item.sub_unit?.[0] ?? "-" }</TableCell>
                      <TableCell>{internalPolice ? item.bk_name ?? "-" : item.sub_unit?.[1] ?? "-"}</TableCell>
                      <TableCell>{internalPolice ? item.org_name ?? "-" : item.sub_unit?.[2] ?? "-"}</TableCell>
                      <TableCell>{formatPhone(item.phone) || "-"}</TableCell>
                      <TableCell>{item.user_group_name || "-"}</TableCell>
                      <TableCell align="center" sx={{ padding: 0 }}>
                        <Checkbox
                          checked={isChecked}
                          onChange={(event) =>
                            handleCheckMember(item, event.target.checked)
                          }
                          sx={{
                            color: isAlreadySelected
                              ? "var(--theme-accent-soft)"
                              : "var(--theme-accent)",
                            "&.Mui-checked": {
                              color: isAlreadySelected
                                ? "var(--theme-accent-soft)"
                                : "var(--theme-accent)",
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ height: 200 }}>
                    {t("text.no-data")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="flex w-full justify-between items-center">
          <Stack spacing={2}>
            <Pagination
              sx={{
                display: "flex",
                justifyContent: "end",
                "& .MuiPaginationItem-page": {
                  color: "var(--theme-accent-soft)",
                  backgroundColor: "var(--theme-panel)",
                  border: "1px solid var(--theme-accent)",
                },
                "& .MuiPaginationItem-page:hover": {
                  backgroundColor: "var(--theme-accent)",
                  color: "var(--theme-panel)",
                },
                "& .MuiPaginationItem-previousNext": {
                  color: "var(--theme-accent-soft)",
                  backgroundColor: "var(--theme-panel)",
                  border: "1px solid var(--theme-accent)",
                },
                "& .MuiPaginationItem-previousNext:hover": {
                  color: "var(--theme-panel)",
                  backgroundColor: "var(--theme-accent)",
                },
                "& .MuiPaginationItem-ellipsis": {
                  color: "var(--theme-panel)",
                },
                "& .MuiPaginationItem-page.Mui-selected": {
                  backgroundColor: "rgba(var(--theme-accent-rgb), 0.80)",
                  color: "var(--theme-panel)",
                },
              }}
              count={totalPages}
              variant="outlined"
              shape="rounded"
              page={page}
              onChange={handlePageChange}
            />
          </Stack>

          <Box className="flex items-center gap-2">
            <Button
              variant="outlined"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--theme-panel)",
                border: "1px solid var(--theme-accent)",
                color: "var(--theme-accent)",
                "&:hover": {
                  backgroundColor: "rgba(var(--theme-accent-rgb), 0.08)",
                },
                textTransform: "capitalize",
              }}
              onClick={handleCancel}
            >
              {t("button.cancel")}
            </Button>

            <Button
              variant="contained"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--theme-accent)",
                color: "var(--theme-panel)",
                "&:hover": {
                  backgroundColor: "rgba(var(--theme-accent-rgb), 0.80)",
                },
                textTransform: "capitalize",
                "&.Mui-disabled": {
                  backgroundColor: "var(--theme-accent)",
                  color: "var(--theme-panel)",
                  opacity: 0.5,
                },
              }}
              disabled={memberChecked.size === 0 || isSelectingAll}
              onClick={handleSave}
            >
              {t("button.save")}
            </Button>
          </Box>
        </div>
      </Box>

      {isSearchFilterOpen && (
        <SearchFilter
          open={isSearchFilterOpen}
          value={formData}
          onClose={() => setIsSearchFilterOpen(false)}
          onSearch={handleSearch}
        />
      )}
    </Dialog>
  );
};

export default AddUser;
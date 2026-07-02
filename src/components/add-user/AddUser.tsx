import { useEffect, useState, useCallback, useMemo } from "react";
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

const initialFormData: FormData = {
  pid: "",
  name: "",
  agency: "",
  bh: "",
  bk: "",
  org: "",
};

type Props = {
  open: boolean;
  onClose: () => void;
  selectedUserIds?: string[];
  onSave?: (users: User[]) => void;
};

const AddUser = ({
  open,
  onClose,
  selectedUserIds = [],
  onSave,
}: Props) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Data
  const [userData, setUserData] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [memberChecked, setMemberChecked] = useState<string[]>([]);

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;

  // Form Data
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Redux
  const { title, agency, bh, bk, org, userGroup } = useSelector(
    (state: RootState) => state.dropdown
  );

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
    () => new Set(selectedUserIds),
    [selectedUserIds]
  );

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
              ? i18n.language === "th"
                ? titleData.title_abbr_th
                : titleData.title_abbr_en
              : "-",
          ou_name:
            agencyData
              ? i18n.language === "th"
                ? agencyData.ou_abbr_th
                : agencyData.ou_abbr_en
              : "-",
          bh_name:
            bhData
              ? i18n.language === "th"
                ? bhData.bh_abbr_th
                : bhData.bh_abbr_en
              : "-",
          bk_name:
            bkData
              ? i18n.language === "th"
                ? bkData.bk_abbr_th
                : bkData.bk_abbr_en
              : "-",
          org_name:
            orgData
              ? i18n.language === "th"
                ? orgData.org_abbr_th
                : orgData.org_abbr_en
              : "-",
          user_group_name: capitalizeWords(userGroupData?.group_name) ?? "-",
        };
      });
    },
    [titleMap, agencyMap, bhMap, bkMap, orgMap, i18n.language]
  );

  const fetchData = useCallback(
    async (
      filterData: FormData = formData,
      pageData: number = page,
      limit: number = rowsPerPage
    ) => {
      try {
        setIsDataLoading(true);

        const res = await searchUserApi(undefined, {
          ...getFilters(filterData, pageData, limit),
        });

        setUserData(mapUserDataRows(res.data ?? []));
        setTotalPages(res.pagination?.maxPage ?? 1);
        setTotalUsers(res.pagination?.countAll ?? 0);
      } 
      catch (error) {
        setUserData([]);
        setTotalPages(1);
        setTotalUsers(0);
      } 
      finally {
        setIsDataLoading(false);
      }
    },
    [rowsPerPage, getFilters, mapUserDataRows]
  );

  useEffect(() => {
    if (!open) return;

    fetchData(formData, page);
  }, [open, formData, page]);

  useEffect(() => {
    if (!open) return;

    setMemberChecked(selectedUserIds);

    const selectedSet = new Set(selectedUserIds);

    setSelectAll(
      userData.length > 0 &&
      userData.every(user => selectedSet.has(user.user_id))
    );
  }, [open, selectedUserIds, userData]);

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    newPage: number
  ) => {
    event.preventDefault();

    setPage(newPage);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);

    if (checked) {
      setMemberChecked((prev) =>
        Array.from(new Set([...prev, ...userData.map((item) => item.user_id)]))
      );
      return;
    }

    setMemberChecked((prev) =>
      prev.filter((id) => !userData.some((user) => user.user_id === id))
    );
  };

  const handleCheckMember = (userId: string, checked: boolean) => {
    setMemberChecked((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, userId]));
      }

      return prev.filter((id) => id !== userId);
    });
  };

  const resetAddUser = () => {
    setFormData(initialFormData);
    setPage(1);
    setUserData([]);
    setTotalUsers(0);
    setTotalPages(1);
    setSelectAll(false);
    setMemberChecked([]);
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
  };

  const handleSave = () => {
    const selectedMap = new Map<string, User>();

    userData.forEach((user) => {
      if (memberChecked.includes(user.user_id)) {
        selectedMap.set(user.user_id, user);
      }
    });

    onSave?.(Array.from(selectedMap.values()));
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
          <p className="text-[14px] text-(--secondary-color) font-medium">
            {`${totalUsers} ${t("text.list")}`}
          </p>

          <Button
            variant="contained"
            sx={{
              width: t("button.search-condition-size"),
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              "&:hover": {
                backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
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
            backgroundColor: "var(--tertiary-color)",

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
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
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
                  {t("table.header.bh")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.bk")}
                </TableCell>
                <TableCell sx={{ width: "10%" }}>
                  {t("table.header.org")}
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
                    onChange={(event) => handleSelectAll(event.target.checked)}
                    sx={{
                      color: "var(--tertiary-color)",
                      "&.Mui-checked": {
                        color: "var(--tertiary-color)",
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {isDataLoading ? (
                <TableSkeleton headerColumn={10} />
              ) : userData.length > 0 ? (
                userData.map((item, index) => {
                  const fullName = capitalizeWords(
                    `${item.title ?? ""} ${item.firstname ?? ""} ${
                      item.lastname ?? ""
                    }`
                  );

                  const isAlreadySelected = selectedUserIdSet.has(item.user_id);
                  const isChecked = memberChecked.includes(item.user_id);

                  return (
                    <TableRow
                      key={item.user_id}
                      sx={{
                        "&:hover td": {
                          backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
                        },
                        "& .MuiTableCell-root": {
                          backgroundColor: isAlreadySelected
                            ? "rgba(var(--primary-color-rgb), 0.12)"
                            : "var(--tertiary-color)",
                          color: "var(--secondary-color)",
                          borderBottom: "1px solid var(--primary-color)",
                        },
                      }}
                    >
                      <TableCell>
                        {(page - 1) * rowsPerPage + index + 1}
                      </TableCell>
                      <TableCell>{fullName || "-"}</TableCell>
                      <TableCell>{formatThaiID(item.idcard) || "-"}</TableCell>
                      <TableCell>{item.ou_name || "-"}</TableCell>
                      <TableCell>{item.bh_name || "-"}</TableCell>
                      <TableCell>{item.bk_name || "-"}</TableCell>
                      <TableCell>{item.org_name || "-"}</TableCell>
                      <TableCell>{formatPhone(item.phone) || "-"}</TableCell>
                      <TableCell>{item.user_group_name || "-"}</TableCell>
                      <TableCell align="center" sx={{ padding: 0 }}>
                        <Checkbox
                          checked={isChecked}
                          onChange={(event) =>
                            handleCheckMember(item.user_id, event.target.checked)
                          }
                          sx={{
                            color: isAlreadySelected
                              ? "var(--secondary-color)"
                              : "var(--primary-color)",
                            "&.Mui-checked": {
                              color: isAlreadySelected
                                ? "var(--secondary-color)"
                                : "var(--primary-color)",
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
                "& .MuiPaginationItem-ellipsis": {
                  color: "var(--tertiary-color)",
                },
                "& .MuiPaginationItem-page.Mui-selected": {
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                  color: "var(--tertiary-color)",
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
                backgroundColor: "var(--tertiary-color)",
                border: "1px solid var(--primary-color)",
                color: "var(--primary-color)",
                "&:hover": {
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
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
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": {
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize",
                "&.Mui-disabled": {
                  backgroundColor: "var(--primary-color)",
                  color: "var(--tertiary-color)",
                  opacity: 0.5,
                },
              }}
              disabled={memberChecked.length === 0}
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
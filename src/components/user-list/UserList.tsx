import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSelector } from 'react-redux';

// Store
import type { RootState } from "../../store/store";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";

// Components
import SearchInput from "../search-input/SearchInput";
import AddUser from "../add-user/AddUser";
import TableSkeleton from '../table-skeleton/TableSkeleton';
import LoadingScreen from '../loading-screen/LoadingScreen';

// Icons
import DeleteIcon from "@mui/icons-material/Delete";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type {
  User,
  NsbBk,
  NsbOrg,
  MembersWatchListGroupRequest,
} from "../../types/common";

// Utils
import { capitalizeWords, formatPhone } from "../../utils/commonFunctions";
import { PopupMessage } from "../../utils/popupMessage";

// API
import { getUserApi } from "../../features/users/api/UsersApi";
import { getBk, getOrg } from "../../features/dropdown/api/DropdownApi";
import {
  addMembersWatchListGroups,
  deleteMembersWatchListGroups,
} from "../../features/core-data/api/CoreDataApi";

interface FormData {
  search: string;
}

type Prop = {
  group_type: "watchlist" | "plate" | "checkpoint",
  userList: string[];
  isDisable: boolean;
  group_id: string | null;
  /** "edit" on the owning page; at "active" the list is read-only. */
  canEdit: boolean;
  onDataChange: () => void;
}

const UserList = ({
  userList,
  isDisable = true,
  group_id,
  canEdit,
  onDataChange,
}: Prop) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [totalUser, setTotalUser] = useState(0);
  const [bk, setBk] = useState<NsbBk[]>([]);
  const [org, setOrg] = useState<NsbOrg[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  // Slice
  // Select only the fields this component reads (not the whole `dropdown`
  // slice) so it doesn't re-render on every unrelated dropdown thunk.
  const agency = useSelector((state: RootState) => state.dropdown.agency);
  const bh = useSelector((state: RootState) => state.dropdown.bh);
  const title = useSelector((state: RootState) => state.dropdown.title);
  const userGroup = useSelector((state: RootState) => state.dropdown.userGroup);

  const filterSelectedUsers = useMemo(() => {
    const keyword = formData.search.trim().toLowerCase();

    if (!keyword) return selectedUsers;

    return selectedUsers.filter((user) => {
      const searchable = [
        capitalizeWords(
          `${user.title ?? ""} ${user.firstname ?? ""} ${user.lastname ?? ""}`
        ),
        user.org_name,
        user.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [formData.search, selectedUsers]);

  // Maps are memoized so their identity is stable across renders that don't
  // change the underlying lists (e.g. typing in the search box), which lets
  // fetchData below depend on them safely.
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

  const titleMap = useMemo(
    () => new Map(title.map((item) => [item.id, item])),
    [title]
  );

  const userGroupMap = useMemo(
    () => new Map(userGroup.map((item) => [item.group_id, item])),
    [userGroup]
  );

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
    } catch {
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
    } catch {
      setOrg([]);
    }
  }, []);

  // Guards against a slow, stale request overwriting a newer one when
  // group_id/userList change again before the previous fetch resolves.
  const fetchRequestRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++fetchRequestRef.current;

    if (!group_id || userList.length === 0) {
      setSelectedUsers([]);
      setTotalUser(0);
      setIsDataLoading(false);
      return;
    }

    try {
      setIsDataLoading(true);

      const response = await getUserApi({
        page: "1",
        limit: "100",
        filter: `user_id=${userList.join("|")}`,
      });

      if (fetchRequestRef.current !== requestId) return;

      setTotalUser(response?.pagination?.countAll ?? 0);
      const updated = response.data.map((data) => {
        const titleData = data.title_id ? titleMap.get(data.title_id) : null;
        const titleName = titleData ?
                            (i18n.language === "th" ? titleData.title_abbr_th : titleData.title_abbr_en) ?? "-"
                            : "-";
        const agencyData = data.ou_code ? agencyMap.get(data.ou_code) : null;
        const agencyName = agencyData ?
                            (i18n.language === "th" ? agencyData.ou_abbr_th : agencyData.ou_abbr_en) ?? "-"
                            : "-";
        const bhData = data.bh_code ? bhMap.get(data.bh_code) : null;
        const bhName = bhData ?
                            (i18n.language === "th" ? bhData.bh_abbr_th : bhData.bh_abbr_en) ?? "-"
                            : "-";
        const bkData = data.bk_code ? bkMap.get(data.bk_code) : null;
        const bkName = bkData ?
                            (i18n.language === "th" ? bkData.bk_abbr_th : bkData.bk_abbr_en) ?? "-"
                            : "-";
        const orgData = data.org_code ? orgMap.get(data.org_code) : null;
        const orgName = orgData ?
                            (i18n.language === "th" ? orgData.org_abbr_th : orgData.org_abbr_en) ?? "-"
                            : "-";
        const userGroupData = data.user_group_id ? userGroupMap.get(data.user_group_id) : null;
        return {
          ...data,
          title: titleName,
          ou_name: agencyName,
          bh_name: bhName,
          bk_name: bkName,
          org_name: orgName,
          user_group_name: capitalizeWords(userGroupData?.group_name ?? ""),
        }
      })
      setSelectedUsers(updated);
    }
    catch {
      if (fetchRequestRef.current !== requestId) return;
      setSelectedUsers([]);
      setTotalUser(0);
      await PopupMessage(t("popup.fetch-error"), "", "error");
    } finally {
      if (fetchRequestRef.current === requestId) setIsDataLoading(false);
    }
  }, [group_id, userList, titleMap, agencyMap, bhMap, bkMap, orgMap, userGroupMap, i18n.language, t]);

  useEffect(() => {
    // fetchBkList/fetchOrgList set state after their own internal `await`,
    // not synchronously in the effect body; the IIFE keeps that async
    // boundary explicit for the compiler's effect lint.
    void (async () => {
      await fetchBkList();
    })();
  }, [fetchBkList]);

  useEffect(() => {
    void (async () => {
      await fetchOrgList();
    })();
  }, [fetchOrgList]);

  useEffect(() => {
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const handleSaveUsers = async (users: User[]) => {
    // No group selected means there is nothing to add members to; without
    // this the request went out with group_id: null.
    if (!group_id) return;

    try {
      setIsAddUserOpen(false);
      setIsLoading(true);
      const body: MembersWatchListGroupRequest = {
        group_id: group_id,
        member_list: users.map((user) => user.user_id),
      }
      await addMembersWatchListGroups(body);
      await PopupMessage(t("popup.add-user-success"), "", "success");
      setSelectedUsers(users);
      onDataChange();
    }
    catch {
      await PopupMessage(t("popup.add-user-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const success = await deleteUser([userId]);
    if (!success) return;
    setSelectedUsers((prev) => prev.filter((user) => user.user_id !== userId));
    onDataChange();
  };

  const handleDeleteAllUsers = async () => {
    const success = await deleteUser(selectedUsers.map((user) => user.user_id));
    if (!success) return;
    setSelectedUsers([]);
    onDataChange();
  }

  const deleteUser = async (userId: string[]): Promise<boolean> => {
    if (!group_id) return false;

    try {
      setIsLoading(true);
      const body: MembersWatchListGroupRequest = {
        group_id: group_id,
        member_list: userId,
      }
      await deleteMembersWatchListGroups(body);
      await PopupMessage(t("popup.delete-user-success"), "", "success");
      return true;
    }
    catch {
      await PopupMessage(t("popup.delete-user-failed"), "", "success");
      return false;
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /* The delete column only exists at "edit", so skeleton rows and the
     empty-state row have to follow it. */
  const columnCount = canEdit ? 6 : 5;

  return (
    <section id="user-list">
      { isLoading && <LoadingScreen /> }
      <Box className="flex flex-col gap-2">
        <Box className="flex justify-between items-center">
          <Typography
            component="span"
            style={{ color: "var(--primary-color)", fontWeight: 500 }}
          >
            {t("text.user-list")}
          </Typography>

          {canEdit && (
            <Button
              variant="contained"
              sx={{
                width: 140,
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
                  cursor: "not-allowed"
                },
              }}
              startIcon={<AddIcon />}
              onClick={() => setIsAddUserOpen(true)}
              disabled={isDisable}
            >
              {t("button.add-user-2")}
            </Button>
          )}
        </Box>

        <Box className="flex flex-col bg-(--main-bg-color) p-2 gap-2">
          <Box className="flex justify-between items-center">
            <p className="text-[14px] text-(--secondary-color) font-medium">
              {`${totalUser} ${t("text.list")}`}
            </p>
            <SearchInput 
              value={formData.search}
              onChange={(event) =>
                handleTextChange("search", event.target.value)
              }
            />
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              height: "70vh",
              borderRadius: 0,
              backgroundColor: "var(--tertiary-color)",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& td, & th": {
                      padding: "0px",
                      height: "56.5px",
                      fontSize: "15px",
                      borderBottom: "1px solid var(--primary-color)",
                    },
                    "& .MuiTableCell-root": {
                      backgroundColor: "var(--tertiary-color)",
                      color: "var(--secondary-color)",
                      borderBottom: "1px solid var(--primary-color)",
                    },
                  }}
                >
                  <TableCell sx={{ width: "10%", textAlign: "center" }}>
                    {t("table.header.no")}
                  </TableCell>
                  <TableCell sx={{ width: "15%", textAlign: "center" }}>
                    {t("table.header.full-name")}
                  </TableCell>
                  <TableCell sx={{ width: "15%", textAlign: "center" }}>
                    {t("table.header.agency")}
                  </TableCell>
                  <TableCell sx={{ width: "20%", textAlign: "center" }}>
                    {t("table.header.mobile")}
                  </TableCell>
                  <TableCell sx={{ width: "20%", textAlign: "center" }}>
                    {t("table.header.user-group")}
                  </TableCell>
                  {canEdit && (
                    <TableCell sx={{ width: "10%", textAlign: "center" }}>
                      <IconButton onClick={() => handleDeleteAllUsers()}>
                        <DeleteIcon
                          sx={{
                            fontSize: 20,
                            color: selectedUsers.length > 0 ? "var(--trash-active-icon)" : "var(--trash-icon)",
                            "&:hover": {
                              scale: 1.3,
                            }
                          }}
                          />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {isDataLoading && (
                  <TableSkeleton headerColumn={columnCount} />
                )}
                {filterSelectedUsers.length > 0 ? (
                  filterSelectedUsers.map((user, index) => {
                    const fullName = capitalizeWords(
                      `${user.title ?? ""} ${user.firstname ?? ""} ${user.lastname ?? ""}`
                    );

                    return (
                      <TableRow
                        key={user.user_id}
                        sx={{
                          "& .MuiTableCell-root": {
                            color: "var(--secondary-color)",
                            borderBottom: "1px solid var(--primary-color)",
                          },
                        }}
                      >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">{fullName || "-"}</TableCell>
                        <TableCell align="center">{user.ou_name || "-"}</TableCell>
                        <TableCell align="center">{formatPhone(user.phone) || "-"}</TableCell>
                        <TableCell align="center">{user.user_group_name || "-"}</TableCell>
                        {canEdit && (
                          <TableCell align="center">
                            <IconButton onClick={() => handleDeleteUser(user.user_id)}>
                              <DeleteIcon
                                sx={{
                                  fontSize: 20,
                                  color: "var(--trash-active-icon)",
                                  "&:hover": {
                                    scale: 1.3,
                                  }
                                }}
                              />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow
                    sx={{
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid rgba(var(--primary-color-rgb), 0.5)",
                      }
                    }}
                  >
                    <TableCell colSpan={columnCount} align="center" sx={{ color: "var(--secondary-color)" }}>
                      {t("text.no-data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {isAddUserOpen && (
        <AddUser
          open={isAddUserOpen}
          selectedUsers={selectedUsers}
          onSave={handleSaveUsers}
          onClose={() => setIsAddUserOpen(false)}
        />
      )}
    </section>
  );
};

export default UserList;
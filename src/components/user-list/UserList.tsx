import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  MembersWatchListGroupRequest,
} from "../../types/common";
import type { DisplayUser } from "../../hooks/useUserDisplayMapper";

// Hooks
import { useUserDisplayMapper } from "../../hooks/useUserDisplayMapper";

// Utils
import { PopupMessage } from "../../utils/popupMessage";

// API
import { getUserApi } from "../../features/users/api/UsersApi";
import {
  addMembersWatchListGroups,
  deleteMembersWatchListGroups,
} from "../../features/core-data/api/CoreDataApi";

// The member list is fetched as a single page, same cap the group editor uses.
const MEMBER_PAGE_LIMIT = "100";

/*
  Static `sx` objects live at module scope so MUI's style engine sees the same
  object identity on every render instead of re-serialising a fresh one per
  row.
*/
const containerSx = {
  height: "70vh",
  borderRadius: 0,
  backgroundColor: "var(--theme-panel)",
} as const;

const headRowSx = {
  "& td, & th": {
    padding: "0px",
    height: "56.5px",
    fontSize: "15px",
    borderBottom: "1px solid var(--theme-accent)",
  },
  "& .MuiTableCell-root": {
    backgroundColor: "var(--theme-panel)",
    color: "var(--theme-accent-soft)",
    borderBottom: "1px solid var(--theme-accent)",
  },
} as const;

const bodyRowSx = {
  "& .MuiTableCell-root": {
    color: "var(--theme-accent-soft)",
    borderBottom: "1px solid var(--theme-accent)",
  },
} as const;

const emptyRowSx = {
  "& .MuiTableCell-root": {
    borderBottom: "1px solid rgba(var(--theme-accent-rgb), 0.50)",
  },
} as const;

const deleteIconSx = {
  fontSize: 20,
  color: "var(--trash-active-icon)",
  "&:hover": {
    scale: 1.3,
  },
} as const;

const addButtonSx = {
  width: 140,
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
    cursor: "not-allowed",
  },
} as const;

type RowProps = {
  user: DisplayUser;
  index: number;
  canEdit: boolean;
  onDelete: (userId: string) => void;
};

/*
  Memoised so typing in the search box, or removing one member, re-renders only
  the rows that actually changed rather than every MUI cell on the page.
*/
const UserRow = memo(({ user, index, canEdit, onDelete }: RowProps) => (
  <TableRow sx={bodyRowSx}>
    <TableCell align="center">{index + 1}</TableCell>
    <TableCell align="center">{user.full_name || "-"}</TableCell>
    <TableCell align="center">{user.ou_name || "-"}</TableCell>
    <TableCell align="center">{user.phone_display || "-"}</TableCell>
    <TableCell align="center">{user.user_group_name || "-"}</TableCell>
    {canEdit && (
      <TableCell align="center">
        <IconButton onClick={() => onDelete(user.user_id)}>
          <DeleteIcon sx={deleteIconSx} />
        </IconButton>
      </TableCell>
    )}
  </TableRow>
));

UserRow.displayName = "UserRow";

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
  const { t } = useTranslation();

  // State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /*
    The member rows exactly as the API returned them. Everything the table
    shows is derived from these, so a language switch or a masterdata list
    that resolves after mount re-maps what is already in memory instead of
    re-issuing the request.
  */
  const [members, setMembers] = useState<User[]>([]);
  const [totalUser, setTotalUser] = useState(0);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  const mapUsers = useUserDisplayMapper();

  const selectedUsers = useMemo(() => mapUsers(members), [mapUsers, members]);

  /*
    Filtering trails typing by a frame under load, so keystrokes stay
    responsive while a long member list re-filters and re-renders.
  */
  const deferredSearch = useDeferredValue(formData.search);

  const filterSelectedUsers = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    if (!keyword) return selectedUsers;

    return selectedUsers.filter((user) => user.search_index.includes(keyword));
  }, [deferredSearch, selectedUsers]);

  /*
    `t` is only needed for the popups; keeping it out of the callbacks'
    dependencies stops a language switch from re-requesting the member list
    and from invalidating the memoised rows.
  */
  const tRef = useRef(t);

  useEffect(() => {
    tRef.current = t;
  }, [t]);

  /*
    The member ids in the shape the API filter wants, and at the same time the
    fetch's cache key: the same member set arriving as a fresh array (a group
    list refresh re-creates it) no longer triggers a refetch.
  */
  const memberFilter = useMemo(() => userList.join("|"), [userList]);

  // Guards against a slow, stale request overwriting a newer one when
  // group_id/userList change again before the previous fetch resolves.
  const fetchRequestRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++fetchRequestRef.current;

    if (!group_id || !memberFilter) {
      setMembers([]);
      setTotalUser(0);
      setIsDataLoading(false);
      return;
    }

    try {
      setIsDataLoading(true);

      const response = await getUserApi({
        page: "1",
        limit: MEMBER_PAGE_LIMIT,
        filter: `user_id=${memberFilter}`,
      });

      if (fetchRequestRef.current !== requestId) return;

      setTotalUser(response?.pagination?.countAll ?? 0);
      setMembers(response.data ?? []);
    }
    catch {
      if (fetchRequestRef.current !== requestId) return;
      setMembers([]);
      setTotalUser(0);
      await PopupMessage(tRef.current("popup.fetch-error"), "", "error");
    } finally {
      if (fetchRequestRef.current === requestId) setIsDataLoading(false);
    }
  }, [group_id, memberFilter]);

  useEffect(() => {
    // fetchData sets state after its own internal `await`, not synchronously
    // in the effect body; the IIFE keeps that async boundary explicit for the
    // compiler's effect lint.
    void (async () => {
      await fetchData();
    })();
  }, [fetchData]);

  const deleteUser = useCallback(
    async (userId: string[]): Promise<boolean> => {
      if (!group_id) return false;

      try {
        setIsLoading(true);
        const body: MembersWatchListGroupRequest = {
          group_id: group_id,
          member_list: userId,
        }
        await deleteMembersWatchListGroups(body);
        await PopupMessage(tRef.current("popup.delete-user-success"), "", "success");
        return true;
      }
      catch {
        await PopupMessage(tRef.current("popup.delete-user-failed"), "", "success");
        return false;
      }
      finally {
        setIsLoading(false);
      }
    },
    [group_id]
  );

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
      setMembers(users);
      onDataChange();
    }
    catch {
      await PopupMessage(t("popup.add-user-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  };

  /*
    Stable across renders so a new handler identity does not invalidate every
    memoised row on each keystroke.
  */
  const handleDeleteUser = useCallback(
    (userId: string) => {
      void (async () => {
        const success = await deleteUser([userId]);
        if (!success) return;
        setMembers((prev) => prev.filter((user) => user.user_id !== userId));
        onDataChange();
      })();
    },
    [deleteUser, onDataChange]
  );

  const handleDeleteAllUsers = async () => {
    const success = await deleteUser(members.map((user) => user.user_id));
    if (!success) return;
    setMembers([]);
    onDataChange();
  }

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
            style={{ color: "var(--theme-accent)", fontWeight: 500 }}
          >
            {t("text.user-list")}
          </Typography>

          {canEdit && (
            <Button
              variant="contained"
              sx={addButtonSx}
              startIcon={<AddIcon />}
              onClick={() => setIsAddUserOpen(true)}
              disabled={isDisable}
            >
              {t("button.add-user-2")}
            </Button>
          )}
        </Box>

        <Box className="flex flex-col bg-(--theme-bg-body) p-2 gap-2">
          <Box className="flex justify-between items-center">
            <p className="text-[14px] text-(--theme-accent-soft) font-medium">
              {`${totalUser} ${t("text.list")}`}
            </p>
            <SearchInput
              value={formData.search}
              onChange={(event) =>
                handleTextChange("search", event.target.value)
              }
            />
          </Box>

          <TableContainer component={Paper} sx={containerSx}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={headRowSx}>
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
                            color: members.length > 0 ? "var(--trash-active-icon)" : "var(--trash-icon)",
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
                {isDataLoading ? (
                  <TableSkeleton headerColumn={columnCount} />
                ) : filterSelectedUsers.length > 0 ? (
                  filterSelectedUsers.map((user, index) => (
                    <UserRow
                      key={user.user_id}
                      user={user}
                      index={index}
                      canEdit={canEdit}
                      onDelete={handleDeleteUser}
                    />
                  ))
                ) : (
                  <TableRow sx={emptyRowSx}>
                    <TableCell colSpan={columnCount} align="center" sx={{ color: "var(--theme-accent-soft)" }}>
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
          selectedUsers={members}
          onSave={handleSaveUsers}
          onClose={() => setIsAddUserOpen(false)}
        />
      )}
    </section>
  );
};

export default UserList;

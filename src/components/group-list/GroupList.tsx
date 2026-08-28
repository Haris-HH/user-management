import {
  memo,
  useState,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
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
import DeleteIcon from "@mui/icons-material/Delete";

// Components
import SearchInput from "../search-input/SearchInput";
import AddGroup from "../add-group/AddGroup";
import TableSkeleton from "../table-skeleton/TableSkeleton";
import LoadingScreen from "../loading-screen/LoadingScreen";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { WatchlistGroup } from "../../types/common";
import type { AddGroupFormData } from "../add-group/AddGroup";

// API
import {
  getWatchListGroups,
  deleteWatchListGroups,
  createWatchListGroups,
} from "../../features/core-data/api/CoreDataApi";

// Utils
import { PopupMessage } from "../../utils/popupMessage";
import { showSuccessToast } from "../../utils/toast";

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
    height: "56.5px",
    padding: 0,
    fontSize: "15px",
  },
  "& .MuiTableCell-root": {
    backgroundColor: "var(--theme-panel)",
    color: "var(--theme-accent-soft)",
    borderBottom: "1px solid var(--theme-accent)",
  },
} as const;

const bodyRowSx = {
  cursor: "pointer",
  "&:hover td": {
    backgroundColor: "rgba(var(--theme-accent-rgb), 0.08)",
  },
  "&.Mui-selected td": {
    backgroundColor: "rgba(var(--theme-accent-rgb), 0.20)",
  },
  "&.Mui-selected:hover td": {
    backgroundColor: "rgba(var(--theme-accent-rgb), 0.25)",
  },
  "& .MuiTableCell-root": {
    color: "var(--theme-accent-soft)",
    borderBottom: "1px solid var(--theme-accent)",
  },
} as const;

const emptyCellSx = {
  color: "var(--theme-accent-soft)",
  borderBottom: "1px solid rgba(var(--theme-accent-rgb), 0.50)",
} as const;

const deleteIconSx = {
  fontSize: 20,
  color: "var(--trash-active-icon)",
  "&:hover": {
    transform: "scale(1.3)",
  },
} as const;

interface FormData {
  search: string;
}

type GroupType = "watchlist" | "plate" | "checkpoint";

/*
  A group row with the values the table reads already resolved: the member
  count and the lowercased name the search filters on are derived once per
  fetch rather than per row per keystroke.
*/
type GroupRowData = {
  group: WatchlistGroup;
  memberCount: number;
  searchIndex: string;
};

type RowProps = {
  row: GroupRowData;
  index: number;
  isSelected: boolean;
  canEdit: boolean;
  onSelect: (group: WatchlistGroup) => void;
  onDelete: (groupId: string) => void;
};

/*
  Memoised so selecting a group re-renders the two rows whose selected state
  changed, not the whole list.
*/
const GroupRow = memo(
  ({ row, index, isSelected, canEdit, onSelect, onDelete }: RowProps) => (
    <TableRow
      hover
      selected={isSelected}
      onClick={() => onSelect(row.group)}
      sx={bodyRowSx}
    >
      <TableCell align="center">{index + 1}</TableCell>

      <TableCell align="center">{row.group.group_name || "-"}</TableCell>

      <TableCell align="center">{row.memberCount}</TableCell>

      {canEdit && (
        <TableCell align="center">
          <IconButton
            onClick={(event) => {
              event.stopPropagation();
              onDelete(row.group.group_id);
            }}
          >
            <DeleteIcon sx={deleteIconSx} />
          </IconButton>
        </TableCell>
      )}
    </TableRow>
  )
);

GroupRow.displayName = "GroupRow";

type Props = {
  group_type: GroupType;
  selectedGroupId: string | null;
  refreshKey: number;
  /** "edit" on the owning page; at "active" the list is read-only. */
  canEdit: boolean;
  onSelectChanged: (group: WatchlistGroup | null) => void;
};

const GroupList = ({
  group_type,
  selectedGroupId,
  refreshKey,
  canEdit,
  onSelectChanged,
}: Props) => {
  const { t } = useTranslation();

  // State
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [groupList, setGroupList] = useState<GroupRowData[]>([]);
  const [totalGroup, setTotalGroup] = useState(0);

  // Form
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  const selectedGroupIdRef = useRef(selectedGroupId);
  const onSelectChangedRef = useRef(onSelectChanged);

  useEffect(() => {
    selectedGroupIdRef.current = selectedGroupId;
  }, [selectedGroupId]);

  useEffect(() => {
    onSelectChangedRef.current = onSelectChanged;
  }, [onSelectChanged]);

  /* The delete column only exists at "edit", so skeleton rows and the
     empty-state row have to follow it. */
  const columnCount = canEdit ? 4 : 3;

  /*
    Filtering trails typing by a frame under load, so keystrokes stay
    responsive while a long group list re-filters and re-renders.
  */
  const deferredSearch = useDeferredValue(formData.search);

  const filteredGroups = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    if (!keyword) return groupList;

    return groupList.filter((row) => row.searchIndex.includes(keyword));
  }, [deferredSearch, groupList]);

  const fetchData = useCallback(async () => {
    try {
      setIsDataLoading(true);

      const response = await getWatchListGroups({
        filter: `group_type=${group_type},deleted=false`,
        limit: "100",
        page: "1",
      });

      const groups = response.data ?? [];

      setGroupList(
        groups.map((group) => ({
          group,
          memberCount: Array.isArray(group.members) ? group.members.length : 0,
          searchIndex: group.group_name?.toLowerCase() ?? "",
        }))
      );
      setTotalGroup(response.pagination?.countAll ?? 0);

      const currentSelectedGroupId = selectedGroupIdRef.current;

      if (currentSelectedGroupId) {
        const refreshedSelectedGroup =
          groups.find(
            (group) => group.group_id === currentSelectedGroupId
          ) ?? null;

        onSelectChangedRef.current(refreshedSelectedGroup);
      }
    } catch {
      setGroupList([]);
      setTotalGroup(0);
      onSelectChangedRef.current(null);
    } finally {
      setIsDataLoading(false);
    }
  }, [group_type]);

  useEffect(() => {
    // fetchData sets state after its own internal `await`, not synchronously
    // in the effect body; the IIFE keeps that async boundary explicit for the
    // compiler's effect lint.
    void (async () => {
      await fetchData();
    })();
  }, [fetchData, refreshKey]);

  const handleTextChange = (
    key: keyof FormData,
    value: string
  ) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      try {
        setIsLoading(true);

        await deleteWatchListGroups({
          group_ids: [groupId],
        });

        if (selectedGroupIdRef.current === groupId) {
          selectedGroupIdRef.current = null;
          onSelectChangedRef.current(null);
        }

        showSuccessToast(t("popup.deleted-success"));

        await fetchData();
      } catch {
        await PopupMessage(
          t("popup.deleted-failed"),
          "",
          "error"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchData, t]
  );

  /*
    Stable handlers so a selection change or a keystroke does not invalidate
    every memoised row.
  */
  const handleSelectRow = useCallback((group: WatchlistGroup) => {
    onSelectChangedRef.current(group);
  }, []);

  const handleDeleteRow = useCallback(
    (groupId: string) => {
      void handleDeleteGroup(groupId);
    },
    [handleDeleteGroup]
  );

  const handleCreateGroup = async (data: AddGroupFormData) => {
    try {
      setIsLoading(true);

      const body = {
        group_name: data.groupName,
        group_type,
        ...(data.botToken
          ? { telegram_token: data.botToken }
          : {}),
        ...(data.chatId
          ? { telegram_chat_id: data.chatId }
          : {}),
        ...(data.webHookUrl
          ? { discord_webhook_url: data.webHookUrl }
          : {}),
      };

      await createWatchListGroups(body);

      showSuccessToast(t("popup.create-watchlist-group-success"));

      setIsAddGroupOpen(false);
      await fetchData();
    } catch {
      await PopupMessage(
        t("popup.create-watchlist-group-failed"),
        "",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="group-list">
      {isLoading && <LoadingScreen />}

      <Box className="flex flex-col gap-2">
        <Box className="flex items-center justify-between">
          <Typography
            component="span"
            sx={{
              color: "var(--theme-accent)",
              fontWeight: 500,
            }}
          >
            {t("text.group-list")}
          </Typography>

          {canEdit && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setIsAddGroupOpen(true)}
              sx={{
                width: t("button.add-group-size"),
                height: 35,
                backgroundColor: "var(--theme-accent)",
                color: "var(--theme-panel)",
                textTransform: "capitalize",
                "&:hover": {
                  backgroundColor:
                    "rgba(var(--theme-accent-rgb), 0.80)",
                },
              }}
            >
              {t("button.add-group")}
            </Button>
          )}
        </Box>

        <Box className="flex flex-col gap-2 bg-(--theme-bg-body) p-2">
          <Box className="flex items-center justify-between">
            <p className="text-[14px] font-medium text-(--theme-accent-soft)">
              {`${totalGroup} ${t("text.list")}`}
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
                  <TableCell align="center" sx={{ width: "10%" }}>
                    {t("table.header.no")}
                  </TableCell>

                  <TableCell align="center" sx={{ width: "15%" }}>
                    {t("table.header.group-name")}
                  </TableCell>

                  <TableCell align="center" sx={{ width: "10%" }}>
                    {t("table.header.member-count")}
                  </TableCell>

                  {canEdit && (
                    <TableCell align="center" sx={{ width: "10%" }}>
                      {t("table.header.delete")}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>

              <TableBody>
                {isDataLoading ? (
                  <TableSkeleton headerColumn={columnCount} />
                ) : filteredGroups.length > 0 ? (
                  filteredGroups.map((row, index) => (
                    <GroupRow
                      key={row.group.group_id}
                      row={row}
                      index={index}
                      isSelected={selectedGroupId === row.group.group_id}
                      canEdit={canEdit}
                      onSelect={handleSelectRow}
                      onDelete={handleDeleteRow}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      align="center"
                      sx={emptyCellSx}
                    >
                      {t("text.no-data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

      {isAddGroupOpen && (
        <AddGroup
          open={isAddGroupOpen}
          onClose={() => setIsAddGroupOpen(false)}
          onConfirm={(data) => void handleCreateGroup(data)}
        />
      )}
    </section>
  );
};

export default GroupList;

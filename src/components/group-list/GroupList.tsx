import {
  useState,
  useCallback,
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

interface FormData {
  search: string;
}

type GroupType = "watchlist" | "plate" | "checkpoint";

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
  const [groupList, setGroupList] = useState<WatchlistGroup[]>([]);
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

  const filteredGroups = useMemo(() => {
    const keyword = formData.search.trim().toLowerCase();

    if (!keyword) return groupList;

    return groupList.filter((group) =>
      group.group_name?.toLowerCase().includes(keyword)
    );
  }, [formData.search, groupList]);

  const fetchData = useCallback(async () => {
    try {
      setIsDataLoading(true);

      const response = await getWatchListGroups({
        filter: `group_type=${group_type},deleted=false`,
        limit: "100",
        page: "1",
      });

      const groups = response.data ?? [];

      setGroupList(groups);
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
    void fetchData();
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

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setIsLoading(true);

      await deleteWatchListGroups({
        group_ids: [groupId],
      });

      if (selectedGroupIdRef.current === groupId) {
        selectedGroupIdRef.current = null;
        onSelectChangedRef.current(null);
      }

      await PopupMessage(
        t("popup.deleted-success"),
        "",
        "success"
      );

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
  };

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

      await PopupMessage(
        t("popup.create-watchlist-group-success"),
        "",
        "success"
      );

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
              color: "var(--primary-color)",
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
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                textTransform: "capitalize",
                "&:hover": {
                  backgroundColor:
                    "var(--primary-color-a80)",
                },
              }}
            >
              {t("button.add-group")}
            </Button>
          )}
        </Box>

        <Box className="flex flex-col gap-2 bg-(--main-bg-color) p-2">
          <Box className="flex items-center justify-between">
            <p className="text-[14px] font-medium text-(--secondary-color)">
              {`${totalGroup} ${t("text.list")}`}
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
                      height: "56.5px",
                      padding: 0,
                      fontSize: "15px",
                    },
                    "& .MuiTableCell-root": {
                      backgroundColor: "var(--tertiary-color)",
                      color: "var(--secondary-color)",
                      borderBottom:
                        "1px solid var(--primary-color)",
                    },
                  }}
                >
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
                  filteredGroups.map((group, index) => (
                    <TableRow
                      key={group.group_id}
                      hover
                      selected={selectedGroupId === group.group_id}
                      onClick={() => onSelectChanged(group)}
                      sx={{
                        cursor: "pointer",
                        "&:hover td": {
                          backgroundColor:
                            "var(--primary-color-a08)",
                        },
                        "&.Mui-selected td": {
                          backgroundColor:
                            "var(--primary-color-a20)",
                        },
                        "&.Mui-selected:hover td": {
                          backgroundColor:
                            "var(--primary-color-a25)",
                        },
                        "& .MuiTableCell-root": {
                          color: "var(--secondary-color)",
                          borderBottom:
                            "1px solid var(--primary-color)",
                        },
                      }}
                    >
                      <TableCell align="center">
                        {index + 1}
                      </TableCell>

                      <TableCell align="center">
                        {group.group_name || "-"}
                      </TableCell>

                      <TableCell align="center">
                        {Array.isArray(group.members)
                          ? group.members.length
                          : 0}
                      </TableCell>

                      {canEdit && (
                        <TableCell align="center">
                          <IconButton
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDeleteGroup(group.group_id);
                            }}
                          >
                            <DeleteIcon
                              sx={{
                                fontSize: 20,
                                color: "var(--trash-active-icon)",
                                "&:hover": {
                                  transform: "scale(1.3)",
                                },
                              }}
                            />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      align="center"
                      sx={{
                        color: "var(--secondary-color)",
                        borderBottom:
                          "1px solid var(--primary-color-a50)",
                      }}
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
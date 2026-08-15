import { useState, useMemo, useCallback, useEffect, useRef } from "react";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from "@mui/material/IconButton";

// Components
import SearchInput from '../search-input/SearchInput';
import AddGroup from "../add-group/AddGroup";
import TableSkeleton from "../table-skeleton/TableSkeleton";
import LoadingScreen from '../loading-screen/LoadingScreen';

// i18n
import { useTranslation } from 'react-i18next';

// Types
import type { CheckpointGroup, CreateWatchlistGroup } from "../../types/common";
import type { AddGroupFormData } from "../add-group/AddGroup";

// Icons
import DeleteIcon from '@mui/icons-material/Delete';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// API
import {
  createCameraGroup,
  deleteCameraGroup,
  getAllCameraGroup,
} from "../../features/core-data/api/CoreDataApi";

// Utils
import { PopupMessage } from "../../utils/popupMessage";

interface FormData {
  search: string;
}

type Props = {
  onSelectChanged: (group: CheckpointGroup | null) => void;
  selectedGroupId: string | null;
  refreshKey: number;
  /** "edit" on the owning page; at "active" the list is read-only. */
  canEdit: boolean;
  /** Camera groups are scoped to a project; null means none is selected yet. */
  projectId: string | null;
};

const GroupList = ({
  onSelectChanged,
  selectedGroupId,
  refreshKey,
  canEdit,
  projectId,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  // State
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [groupList, setGroupList] = useState<CheckpointGroup[]>([]);
  const [totalGroup, setTotalGroup] = useState(0);

  // Form Data
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
    if (!projectId) {
      setGroupList([]);
      setTotalGroup(0);
      onSelectChangedRef.current(null);
      return;
    }

    try {
      setIsDataLoading(true);

      const groupsResponse = await getAllCameraGroup({
        filter: "deleted=false",
      });

      const allGroups = groupsResponse.data ?? [];

      // A group belongs to whichever project it was created under - matched
      // on its own project_id only, regardless of what project its cameras
      // have since moved to.
      const groups = allGroups
        .filter((group) => group.project_id === projectId)
        .sort((a, b) => a.group_name.localeCompare(b.group_name));

      setGroupList(groups);
      setTotalGroup(groups.length);

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
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleConfirm = (data: AddGroupFormData) => {
    createNewGroup(data.groupName);
  };

  const createNewGroup = async (groupName: string) => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      const body: CreateWatchlistGroup = {
        group_name: groupName,
        project_id: projectId,
      }
      await createCameraGroup(body);
      await PopupMessage(t("popup.create-watchlist-group-success"), "", "success");
      await fetchData();
    }
    catch {
      await PopupMessage(t("popup.create-watchlist-group-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      setIsLoading(true);

      await deleteCameraGroup([groupId]);

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

  const handleTextChange = (key: keyof FormData, value: string) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  return (
    <section id='checkpoint-group-list'>
      { isLoading && <LoadingScreen /> }
      <Box className="flex flex-col gap-2">
        <Box className="flex justify-between items-center">
          <Typography component="span" style={{ color: "var(--primary-color)", fontWeight: 500 }}>
            {t('text.checkpoint-list')}
          </Typography>
          {canEdit && (
            <Button
              variant="contained"
              disabled={!projectId}
              sx={{
                width: t('button.add-group'),
                height: 35,
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": {
                  backgroundColor:  "var(--primary-color-a80)",
                },
                textTransform: "capitalize",
                "&.Mui-disabled": {
                  backgroundColor: "var(--primary-color)",
                  color: "var(--tertiary-color)",
                  opacity: 0.5,
                  cursor: "not-allowed",
                },
              }}
              startIcon={<AddIcon />}
              onClick={() => setIsAddGroupOpen(true)}
            >
              {t('button.add-group')}
            </Button>
          )}
        </Box>
        <Box className="flex flex-col bg-(--main-bg-color) p-2 gap-2">
          <Box className="flex justify-between items-center">
            <p className='text-[14px] text-(--secondary-color) font-medium'>{`${totalGroup} ${t('text.list')}`}</p>
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
              borderRadius: "0px",
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
                      borderBottom: "1px solid var(--primary-color)"
                    },
                    "& .MuiTableCell-root": {
                      backgroundColor: "var(--tertiary-color)",
                      color: "var(--secondary-color)",
                      borderBottom: "1px solid var(--primary-color)",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      width: "10%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.no')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "15%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.group-name')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.checkpoint-count')}
                  </TableCell>
                  {canEdit && (
                    <TableCell
                      sx={{
                        width: "10%",
                        textAlign: "center",
                      }}
                    >
                      {t('table.header.delete')}
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataLoading ? (
                  <TableSkeleton headerColumn={columnCount} />
                ) : !projectId ? (
                  <TableRow>
                    <TableCell
                      colSpan={columnCount}
                      align="center"
                      sx={{
                        height: "55vh",
                        borderBottom: "none",
                        backgroundColor: "var(--tertiary-color)",
                      }}
                    >
                      <Box className="flex flex-col items-center gap-2">
                        <InfoOutlinedIcon
                          sx={{
                            fontSize: 44,
                            color: "var(--primary-color-a40)",
                          }}
                        />
                        <Typography
                          sx={{ color: "var(--secondary-color)", fontWeight: 500 }}
                        >
                          {t("text.select-project-first")}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
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
                        {Array.isArray(group.cameras)
                          ? group.cameras.length
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
                  <TableRow
                    sx={{
                      "& .MuiTableCell-root": {
                        backgroundColor: "var(--tertiary-color)",
                        color: "var(--secondary-color)",
                        borderBottom: "1px solid var(--primary-color-a50)",
                      },
                    }}
                  >
                    <TableCell colSpan={columnCount} align="center">
                      {t("text.no-data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      {
        isAddGroupOpen && (
          <AddGroup
            open={isAddGroupOpen}
            onClose={() => setIsAddGroupOpen(false)}
            onConfirm={handleConfirm}
            isWatchList={false}
          />
        )
      }
    </section>
  )
}

export default GroupList;
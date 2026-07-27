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
import type { CheckpointGroup } from "../../types/common";
import type { AddGroupFormData } from "../add-group/AddGroup";

// Icons
import DeleteIcon from '@mui/icons-material/Delete';

// API
import { 
  createCameraGroup,
  deleteCameraGroup,
  getCameraGroup,
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
};

const GroupList = ({
  onSelectChanged,
  selectedGroupId,
  refreshKey,
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

      const response = await getCameraGroup({
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  const handleConfirm = (data: AddGroupFormData) => {
    createNewGroup(data.groupName);
  };

  const createNewGroup = async (groupName: string) => {
    try {
      setIsLoading(true);
      const body = {
        group_name: groupName,
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
          <Button
            variant="contained"
            sx={{
              width: t('button.add-group'),
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              "&:hover": {
                backgroundColor:  "rgba(var(--primary-color-rgb), 0.8)",
              },
              textTransform: "capitalize",
            }}
            startIcon={<AddIcon />}
            onClick={() => setIsAddGroupOpen(true)}
          >
            {t('button.add-group')}
          </Button>
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
                  <TableCell
                    sx={{
                      width: "10%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.delete')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataLoading ? (
                  <TableSkeleton headerColumn={4} />
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
                            "rgba(var(--primary-color-rgb), 0.08)",
                        },
                        "&.Mui-selected td": {
                          backgroundColor:
                            "rgba(var(--primary-color-rgb), 0.2)",
                        },
                        "&.Mui-selected:hover td": {
                          backgroundColor:
                            "rgba(var(--primary-color-rgb), 0.25)",
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
                    </TableRow>
                  ))
                ) : (
                  <TableRow
                    sx={{
                      "& .MuiTableCell-root": {
                        backgroundColor: "var(--tertiary-color)",
                        color: "var(--secondary-color)",
                        borderBottom: "1px solid rgba(var(--primary-color-rgb), 0.5)",
                      },
                    }}
                  >
                    <TableCell colSpan={4} align="center">
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
          />
        )
      }
    </section>
  )
}

export default GroupList;
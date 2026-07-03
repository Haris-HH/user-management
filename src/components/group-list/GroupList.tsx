import { useState, useCallback, useEffect, useMemo } from "react";

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
import type { WatchlistGroup } from "../../types/common";

// Icons
import DeleteIcon from '@mui/icons-material/Delete';

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

type Prop = {
  group_type: "watchlist" | "plate" | "checkpoint",
  onSelectChanged: (group: WatchlistGroup) => void;
  refreshKey: number;
}

const GroupList = ({
  group_type,
  onSelectChanged,
  refreshKey,
}: Prop) => {
  // i18n
  const { t } = useTranslation();

  // State
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [watchListData, setWatchListData] = useState<WatchlistGroup[]>([]);
  const [totalWatchList, setTotalWatchList] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<WatchlistGroup | null>(null);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  const filterWatchlistGroup = useMemo(() => {
    const search = formData.search.trim().toLowerCase();

    if (!search) return watchListData;

    return watchListData.filter((item) =>
      item.group_name?.toLowerCase().includes(search)
    );
  }, [watchListData, formData.search]);

  const fetchData = useCallback(
    async () => {
      try {
        setIsDataLoading(true);

        const res = await getWatchListGroups({
          filter: `group_type=${group_type}`,
          limit: "100",
          page: "1"
        });

        setWatchListData(res.data ?? []);
        setTotalWatchList(res.pagination?.countAll ?? 0);
      } 
      catch (error) {
        setWatchListData([]);
        setTotalWatchList(0);
      } 
      finally {
        setIsDataLoading(false);
      }
    },
    [group_type, refreshKey]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteWatchlistGroup = async (groupId: string) => {
    try {
      setIsLoading(true);
      const param = {
        group_ids: [groupId]
      }
      await deleteWatchListGroups(param);
      await PopupMessage(t("popup.deleted-success"), "", "success");
      await fetchData();
    }
    catch (error) {
      await PopupMessage(t("popup.deleted-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirm = (groupName: string) => {
    createNewGroup(groupName);
  };

  const createNewGroup = async (groupName: string) => {
    try {
      setIsLoading(true);
      const body = {
        group_name: groupName,
        group_type,
      }
      await createWatchListGroups(body);
      await PopupMessage(t("popup.create-watchlist-group-success"), "", "success");
      await fetchData();
    }
    catch (error) {
      await PopupMessage(t("popup.create-watchlist-group-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleSelectChange = (group: WatchlistGroup) => {
    setSelectedGroup(group);
    onSelectChanged(group);
  };
  
  return (
    <section id='group-list'>
      { isLoading && <LoadingScreen /> }
      <Box className="flex flex-col gap-2">
        <Box className="flex justify-between items-center">
          <Typography component="span" style={{ color: "var(--primary-color)", fontWeight: 500 }}>
            {t('text.group-list')}
          </Typography>
          <Button
            variant="contained"
            sx={{
              width: t('button.add-group-size'),
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              "&:hover": {
                backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
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
            <p className='text-[14px] text-(--secondary-color) font-medium'>{`${totalWatchList} ${t('text.list')}`}</p>
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
                      width: "10%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.member-count')}
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
                ) : filterWatchlistGroup.length > 0 ? (
                  filterWatchlistGroup.map((item, index) => {
                    return (
                      <TableRow
                        key={item.group_id}
                        sx={{
                          "&:hover td": {
                            backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
                          },
                          "& .MuiTableCell-root": {
                            backgroundColor: selectedGroup?.group_id === item.group_id ? "rgba(var(--primary-color-rgb), 0.2)" : "var(--tertiary-color)",
                            color: "var(--secondary-color)",
                            borderBottom: "1px solid var(--primary-color)",
                            cursor: "pointer",
                          },
                        }}
                        onClick={() => handleSelectChange(item)}
                      >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">{item.group_name || "-"}</TableCell>
                        <TableCell align="center">
                          {Array.isArray(item.members) ? item.members.length : 0}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDeleteWatchlistGroup(item.group_id)}>
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
                      </TableRow>
                    )
                  })
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
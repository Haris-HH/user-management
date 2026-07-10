import { useState, useMemo, useEffect, useCallback } from "react";
import { useSelector } from 'react-redux';

// Store
import type { RootState } from "../../store/store";

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
import AddCheckpoint from "../add-checkpoint/AddCheckpoint";
import TableSkeleton from '../table-skeleton/TableSkeleton';
import LoadingScreen from '../loading-screen/LoadingScreen';

// Icons
import DeleteIcon from '@mui/icons-material/Delete';

// i18n
import { useTranslation } from 'react-i18next';

// Types
import type { Camera, MembersWatchListGroupRequest } from "../../types/common";

// API
import { getPoliceStation } from "../../features/dropdown/api/DropdownApi";
import { 
  searchCameras, 
  getCheckpoints,
  deleteMembersWatchListGroups,
  addMembersWatchListGroups,
} from "../../features/core-data/api/CoreDataApi";

// Utils
import {
  PopupMessage,
} from "../../utils/popupMessage";

interface FormData {
  search: string;
}

type Prop = {
  checkpointList: string[];
  isDisable: boolean;
  group_id: string | null;
  onDataChange: () => void;
}

const CheckpointList = ({
  checkpointList,
  isDisable = true,
  group_id,
  onDataChange,
}: Prop) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [isAddCheckpointOpen, setIsAddCheckpointOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<Camera[]>([]);
  const [totalCheckpoint, setTotalCheckpoint] = useState(0);

   // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  // Slice
  const { area, province } = useSelector((state: RootState) => state.dropdown);

  const selectedCheckpointIds = useMemo(
    () => selectedCheckpoints.map((checkpoint) => checkpoint.camera_id),
    [selectedCheckpoints]
  );

  const filterSelectedCheckpoints = useMemo(() => {
    const keyword = formData.search.trim().toLowerCase();

    if (!keyword) return selectedCheckpoints;

    return selectedCheckpoints.filter((checkpoint) => {
      const searchable = [
        checkpoint.police_region_name,
        checkpoint.province_name,
        checkpoint.police_station_name,
        checkpoint.camera_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [formData.search, selectedCheckpoints]);

  const fetchData = useCallback(async (filterData: FormData = formData) => {
    setIsDataLoading(true);
    try {
      const res = await searchCameras({
        ...getFilters(filterData),
      })

      const cameras = res.data ?? [];

      const updated = await mapCameraRows(cameras);
      setSelectedCheckpoints(updated);
      setTotalCheckpoint(res.pagination?.countAll ?? 0);
    }
    catch (error) {
      await PopupMessage(
        t("popup.fetch-error"),
        "",
        "error"
      );

      setSelectedCheckpoints([]);
      setTotalCheckpoint(0);
    }
    finally {
      setIsDataLoading(false);
    }
  }, []
  );

  useEffect(() => {
    if (!group_id) return;
    fetchData();
  }, [group_id, checkpointList])

  const mapCameraRows = useCallback(
    async (cameras: Camera[]) => {
      const stationCache = new Map<string, any>();
      const checkpointCache = new Map<string, any>();

      await Promise.all(
        cameras.map(async (item) => {
          const stationKey = String(item.police_station_id);
          const checkpointKey = String(item.checkpoint_id);

          const requests: Promise<void>[] = [];

          if (!stationCache.has(stationKey)) {
            requests.push(
              getPoliceStation({
                filter: `id=${item.police_station_id}`,
              }).then((res) => {
                stationCache.set(
                  stationKey,
                  res.data?.[0]
                );
              })
            );
          }

          if (!checkpointCache.has(checkpointKey)) {
            requests.push(
              getCheckpoints({
                filter: `checkpoint_id=${item.checkpoint_id}`,
              }).then((res) => {
                checkpointCache.set(
                  checkpointKey,
                  res.data?.[0]
                );
              })
            );
          }

          await Promise.all(requests);
        })
      );

      const updated = cameras.map((item) => {
        const station =
          stationCache.get(
            String(item.police_station_id)
          );

        const provinceData = province.find(
          (p) => p.province_code === item.province_code
        );

        const areaData = area.find(
          (a) =>
            a.id === Number(item.police_region_id)
        );

        return {
          ...item,
          province_name:
            i18n.language === "th"
              ? provinceData?.name_th ?? "-"
              : provinceData?.name_en ?? "-",

          police_region_name:
            i18n.language === "th"
              ? areaData?.title_abbr_th ?? "-"
              : areaData?.title_abbr_en ?? "-",

          police_station_name:
            station?.station_name ?? "-",
        };
      });

      return updated;
    },
    [
      area,
      province,
      i18n.language,
    ]
  )

  const getFilters = useCallback((formData: FormData) => {
    const body: Record<string, string> = {};

    if (formData.search) {
      body.filter = `camera_name~*${formData.search}*`;
    }
    return body;
  }, [
    formData.search,
  ])

  const handleSaveCheckpoint = async (checkpoint: Camera[]) => {
    try {
      setIsAddCheckpointOpen(false);
      setIsLoading(true);
      const body: MembersWatchListGroupRequest = {
        group_id: group_id,
        member_id_list: checkpoint.map((cp) => cp.camera_id),
      }
      await addMembersWatchListGroups(body);
      await PopupMessage(t("popup.add-checkpoint-success"), "", "success");
      setSelectedCheckpoints(checkpoint);
      onDataChange();
    }
    catch (error) {
      await PopupMessage(t("popup.add-checkpoint-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCheckpoint = async (cameraId: string) => {
    await deleteCheckpoint([cameraId]);
    setSelectedCheckpoints((prev) => prev.filter((checkpoint) => checkpoint.camera_id !== cameraId));
    onDataChange();
  };
  
  const handleDeleteAllCheckpoints = async () => {
    await deleteCheckpoint(selectedCheckpoints.map((checkpoint) => checkpoint.camera_id));
    setSelectedCheckpoints([]);
    onDataChange();
  };

  const deleteCheckpoint = async (checkpointId: string[]) => {
    try {
      setIsLoading(true);
      const body: MembersWatchListGroupRequest = {
        group_id: group_id,
        member_id_list: checkpointId,
      }
      await deleteMembersWatchListGroups(body);
      await PopupMessage(t("popup.delete-checkpoint-success"), "", "success");
    }
    catch (error) {
      await PopupMessage(t("popup.delete-checkpoint-failed"), "", "success");
    }
    finally {
      setIsLoading(false);
    }
  }

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section id='checkpoint-list'>
      { isLoading && <LoadingScreen /> }
      <Box className="flex flex-col gap-2">
        <Box className="flex justify-between items-center">
          <Typography component="span" style={{ color: "var(--primary-color)", fontWeight: 500 }}>
            {t('text.checkpoint-list')}
          </Typography>
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
            onClick={() => setIsAddCheckpointOpen(true)}
            disabled={isDisable}
          >
            {t('button.add-checkpoint')}
          </Button>
        </Box>
        <Box className="flex flex-col bg-(--main-bg-color) p-2 gap-2">
          <Box className="flex justify-between items-center">
            <p className='text-[14px] text-(--secondary-color) font-medium'>{`${totalCheckpoint} ${t('text.list')}`}</p>
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
                    {t('table.header.area-region')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "15%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.province')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.station')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.checkpoint')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "10%",
                      textAlign: "center",
                    }}
                  >
                    <IconButton onClick={() => handleDeleteAllCheckpoints()}>
                      <DeleteIcon 
                        sx={{ 
                          fontSize: 20, 
                          color: selectedCheckpointIds.length > 0 ? "var(--trash-active-icon)" : "var(--trash-icon)",
                          "&:hover": {
                            scale: 1.3,
                          }
                        }} 
                        />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isDataLoading && (
                  <TableSkeleton headerColumn={6} />
                )}
                {filterSelectedCheckpoints.length > 0 ? (
                  filterSelectedCheckpoints.map((checkpoint, index) => {
                    return (
                      <TableRow
                        key={checkpoint.camera_id}
                        sx={{
                          "& .MuiTableCell-root": {
                            color: "var(--secondary-color)",
                            borderBottom: "1px solid var(--primary-color)",
                          },
                        }}
                      >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">{checkpoint.police_region_name || "-"}</TableCell>
                        <TableCell align="center">{checkpoint.province_name || "-"}</TableCell>
                        <TableCell align="center">{checkpoint.police_station_name || "-"}</TableCell>
                        <TableCell align="center">{checkpoint.camera_name || "-"}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDeleteCheckpoint(checkpoint.camera_id)}>
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
                    <TableCell colSpan={6} align="center" sx={{ color: "var(--secondary-color)" }}>
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
        isAddCheckpointOpen && (
          <AddCheckpoint
            open={isAddCheckpointOpen}
            selectedCheckpointIds={selectedCheckpointIds}
            onSave={handleSaveCheckpoint}
            onClose={() => setIsAddCheckpointOpen(false)}
          />
        )
      }
    </section>
  )
}

export default CheckpointList;
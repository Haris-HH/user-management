import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import type { Camera, CameraInGroup, PoliceStation } from "../../types/common";

// API
import { getPoliceStation } from "../../features/dropdown/api/DropdownApi";
import {
  searchCameras,
  addCameraInGroup,
  removeCameraInGroup,
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
  const area = useSelector((state: RootState) => state.dropdown.area);
  const province = useSelector((state: RootState) => state.dropdown.province);

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

  const mapCameraRows = useCallback(
    async (cameras: Camera[]) => {
      const stationCache = new Map<string, PoliceStation | undefined>();

      await Promise.all(
        cameras.map(async (item) => {
          const stationKey = String(item.police_station_id);

          if (!stationCache.has(stationKey)) {
            const res = await getPoliceStation({
              filter: `id=${item.police_station_id}`,
            });
            stationCache.set(stationKey, res.data?.[0]);
          }
        })
      );

      // Build lookup maps once instead of calling `.find()` per row.
      const provinceMap = new Map(
        province.map((p) => [p.province_code, p])
      );
      const areaMap = new Map(
        area.map((a) => [a.id, a])
      );

      const updated = cameras.map((item) => {
        const station =
          stationCache.get(
            String(item.police_station_id)
          );

        const provinceData = provinceMap.get(item.province_code);

        const areaData = areaMap.get(Number(item.police_region_id));

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
  );

  // Guards against a slower, stale request (e.g. from a previously
  // selected group) overwriting the result of a newer one when the user
  // switches groups quickly.
  const fetchRequestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;

    if (!group_id || checkpointList.length === 0) {
      setSelectedCheckpoints([]);
      setTotalCheckpoint(0);
      setIsDataLoading(false);
      return;
    }

    try {
      setIsDataLoading(true);

      const response = await searchCameras({
        page: "1",
        limit: "100",
        filter: `camera_id=${checkpointList.join("|")},deleted=false`,
      });

      const cameras = response.data ?? [];
      const mappedCameras = await mapCameraRows(cameras);

      if (requestId !== fetchRequestIdRef.current) return;

      setSelectedCheckpoints(mappedCameras);
      setTotalCheckpoint(response.pagination?.countAll ?? 0);
    } catch {
      if (requestId !== fetchRequestIdRef.current) return;

      setSelectedCheckpoints([]);
      setTotalCheckpoint(0);

      await PopupMessage(
        t("popup.fetch-error"),
        "",
        "error"
      );
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsDataLoading(false);
      }
    }
  }, [
    group_id,
    checkpointList,
    mapCameraRows,
    t,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveCheckpoint = async (checkpoint: Camera[]) => {
    try {
      setIsAddCheckpointOpen(false);
      setIsLoading(true);
      await addListOfCamera(checkpoint);
      await PopupMessage(t("popup.add-checkpoint-success"), "", "success");
      setSelectedCheckpoints(checkpoint);
      onDataChange();
    }
    catch {
      await PopupMessage(t("popup.add-checkpoint-failed"), "", "error");
    }
    finally {
      setIsLoading(false);
    }
  };

  const addListOfCamera = async (cameras: Camera[]) => {
    // No group selected means there is nothing to attach cameras to;
    // without this the request went out with group_id: null.
    if (!group_id) return;

    const body: CameraInGroup = {
      group_id: group_id,
      camera_id_list: cameras.map((camera) => camera.camera_id),
    };

    await addCameraInGroup(body);
  };

  const handleDeleteCheckpoint = async (cameraId: string) => {
    // deleteCheckpoint rethrows on failure so the local list is only
    // updated once the removal is confirmed by the API — previously the
    // checkbox was removed from view even when the request failed.
    try {
      await deleteCheckpoint([cameraId]);
    } catch {
      return;
    }
    setSelectedCheckpoints((prev) => prev.filter((checkpoint) => checkpoint.camera_id !== cameraId));
    onDataChange();
  };

  const handleDeleteAllCheckpoints = async () => {
    try {
      await deleteCheckpoint(selectedCheckpoints.map((checkpoint) => checkpoint.camera_id));
    } catch {
      return;
    }
    setSelectedCheckpoints([]);
    onDataChange();
  };

  const deleteCheckpoint = async (checkpointId: string[]) => {
    try {
      setIsLoading(true);
      await removeListOfCamera(checkpointId);
      await PopupMessage(t("popup.delete-checkpoint-success"), "", "success");
    }
    catch (error) {
      await PopupMessage(t("popup.delete-checkpoint-failed"), "", "success");
      throw error;
    }
    finally {
      setIsLoading(false);
    }
  };

  const removeListOfCamera = async (checkpointId: string[]) => {
    if (!group_id) return;

    const body: CameraInGroup = {
      group_id: group_id,
      camera_id_list: checkpointId,
    };

    await removeCameraInGroup(body);
  };

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
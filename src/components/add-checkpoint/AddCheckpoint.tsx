import { useCallback, useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux';

// Store
import type { RootState } from "../../store/store";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Checkbox from "@mui/material/Checkbox";

// Components
import Dialog from '../dialog/Dialog';
import SearchInput from '../search-input/SearchInput';
import HeaderCell from '../header-cell/HeaderCell';
import TableSkeleton from '../table-skeleton/TableSkeleton';

// i18n
import { useTranslation } from 'react-i18next';

// API
import { getPoliceStation } from "../../features/dropdown/api/DropdownApi";
import { searchCameras, getCheckpoints } from "../../features/core-data/api/CoreDataApi";

// Utils
import {
  PopupMessage,
} from "../../utils/popupMessage";

// Types
import type { Camera } from "../../types/common"; 

interface FormData {
  search: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  selectedCheckpointIds?: string[];
  onSave?: (users: Camera[]) => void;
}

const AddCheckpoint = ({ 
  open, 
  onClose,
  selectedCheckpointIds = [],
  onSave,
}: Props) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [openedFilter, setOpenedFilter] = useState<string | null>(null);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Data
  const [selectedAreaRegion, setSelectedAreaRegion] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string[]>([]);
  const [rows, setRows] = useState<Camera[]>([]);
  const [checkpointChecked, setCheckpointChecked] = useState<string[]>([]);

  // Pagination
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const rowsPerPage = 100;

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  // Slice
  const { area, province } = useSelector((state: RootState) => state.dropdown);

  const selectedCheckpointIdSet = useMemo(
    () => new Set(selectedCheckpointIds),
    [selectedCheckpointIds]
  );

  useEffect(() => {
    if (!open) return;

    setCheckpointChecked(selectedCheckpointIds);

    const selectedSet = new Set(selectedCheckpointIds);

    setSelectAll(
      rows.length > 0 &&
      rows.every(camera => selectedSet.has(camera.camera_id))
    );
  }, [open, selectedCheckpointIds, rows]);

  const fetchData = useCallback(async (filterData: FormData = formData) => {
    setIsDataLoading(true);
    try {
      const res = await searchCameras({
        ...getFilters(filterData),
      })

      const cameras = res.data ?? [];

      const updated = await mapCameraRows(cameras);
      setRows(updated);
      setTotalItems(res.pagination?.countAll ?? 0);
      setTotalPages(res.pagination?.maxPage ?? 1);
    }
    catch (error) {
      await PopupMessage(
        t("popup.fetch-error"),
        "",
        "error"
      );

      setRows([]);
      setTotalItems(0);
      setTotalPages(1);
    }
    finally {
      setIsDataLoading(false);
    }
  }, [
    page,
    rowsPerPage,
    searchTrigger,
  ]);

  useEffect(() => {
    fetchData();
  }, [
    fetchData,
    page,
    rowsPerPage,
    searchTrigger,
  ]);

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

  const onChange = (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => {
    event.preventDefault();
    setPage(newPage);
  };

  const getFilters = useCallback((formData: FormData) => {
    const body: Record<string, string> = {
      page: page.toString(),
      limit: rowsPerPage.toString(),
    };

    if (formData.search) {
      body.filter = `camera_name~*${formData.search}*`;
    }
    return body;
  }, [
    formData.search,
    page,
    rowsPerPage
  ])

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchOnEnter = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      setPage(1);
      setSearchTrigger((prev) => prev + 1);
    }
  };

  const handleCheckCheckpoint = (userId: string, checked: boolean) => {
    setCheckpointChecked((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, userId]));
      }

      return prev.filter((id) => id !== userId);
    });
  };

  const handleSave = () => {
    const selectedMap = new Map<string, Camera>();

    rows.forEach((camera) => {
      if (checkpointChecked.includes(camera.camera_id)) {
        selectedMap.set(camera.camera_id, camera);
      }
    });

    onSave?.(Array.from(selectedMap.values()));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);

    if (checked) {
      setCheckpointChecked((prev) =>
        Array.from(new Set([...prev, ...rows.map((item) => item.camera_id)]))
      );
      return;
    }

    setCheckpointChecked((prev) =>
      prev.filter((id) => !rows.some((camera) => camera.camera_id === id))
    );
  };

  const resetAddCheckpoint = () => {
    setFormData({
      search: "",
    });
    setPage(1);
    setTotalPages(1);
    setCheckpointChecked([]);
  };

  const handleCloseAddCheckpoint = () => {
    resetAddCheckpoint();
    onClose();
  };

  const handleCancel = () => {
    handleCloseAddCheckpoint();
  };

  return (
    <Dialog
      open={open}
      handleClose={onClose}
      dialogTitle={t('dialog.add-checkpoint')}
      width="1400px"
    >
      <Box className="flex flex-col gap-4 pt-3 h-[75dvh]">
        <div className='flex justify-between items-end'>
          <p className='text-[14px] text-(--secondary-color) font-medium'>{`${totalItems} ${t('text.list')}`}</p>
          <SearchInput
            value={formData.search}
            onChange={(event) =>
              handleTextChange("search", event.target.value)
            }
            onKeyDown={handleSearchOnEnter}
          />
        </div>
        <TableContainer
          component={Paper}
          sx={{ 
            height: "65vh",
            borderRadius: 0,
            border: "none",
            boxShadow: "none",
            backgroundImage: "none",
            overflowX: "visible",
            overflowY: "auto",
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
          <Table stickyHeader sx={{ overflow: "visible" }}>
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
                <HeaderCell label={t("table.header.no")} width="5%" filter={false} />
                <HeaderCell 
                  label={t("table.header.area-region")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedAreaRegion}
                  onChange={setSelectedAreaRegion}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell 
                  label={t("table.header.province")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedProvince}
                  onChange={setSelectedProvince}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell 
                  label={t("table.header.station")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedStation}
                  onChange={setSelectedStation}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell 
                  label={t("table.header.checkpoint")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedCheckpoint}
                  onChange={setSelectedCheckpoint}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
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
                  <TableSkeleton headerColumn={6} />
                ) : rows.length > 0 ? (
                  rows.map((row, index) => {
                    const isAlreadySelected = selectedCheckpointIdSet.has(row.camera_id);
                    const isChecked = checkpointChecked.includes(row.camera_id);
                    return (
                      <TableRow
                        key={index}
                        sx={{
                          "&:hover td": {
                            backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
                          },
                          "& .MuiTableCell-root": {
                            backgroundColor: "var(--tertiary-color)",
                            color: "var(--secondary-color)",
                            borderBottom: "1px solid var(--primary-color)",
                            p: "8px 1px",
                          }
                        }}
                      >
                        <TableCell
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          {((page - 1) * rowsPerPage) + index + 1}
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          {row.police_region_name || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          {row.province_name || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          {row.police_station_name || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          {row.camera_name || "-"}
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            padding: 0,
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            onChange={(event) =>
                              handleCheckCheckpoint(row.camera_id, event.target.checked)
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
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      align="center"
                      sx={{ py: 5, color: "var(--secondary-color)" }}
                    >
                      {t('text.no-data')}
                    </TableCell>
                  </TableRow>
                )
              }
            </TableBody>
          </Table>
        </TableContainer>
        <div className='flex w-full justify-between items-center'>
          <Stack spacing={2}>
            <Pagination
              sx={{
                display: 'flex',
                justifyContent: 'end',
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
              onChange={onChange}
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
                  backgroundColor:  "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize"
              }}
              onClick={handleCancel}
            >
              {t('button.cancel')}
            </Button>
            <Button
              variant="contained"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": {
                  backgroundColor:  "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize"
              }}
              onClick={handleSave}
            >
              {t('button.save')}
            </Button>
          </Box>
        </div>
      </Box>
    </Dialog>
  )
}

export default AddCheckpoint;
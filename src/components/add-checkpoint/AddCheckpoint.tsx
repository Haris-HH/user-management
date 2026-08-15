import { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
import { searchCameras } from "../../features/core-data/api/CoreDataApi";

// Utils
import {
  PopupMessage,
} from "../../utils/popupMessage";
import { buildUniqueOptions } from "../../utils/commonFunctions";

// Types
import type { Camera, OptionType, PoliceStation } from "../../types/common";

interface FormData {
  search: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  // The already-selected cameras arrive as whole rows, not just ids: the
  // dialog has to hand every checked camera back on save, including ones the
  // user never scrolled to, and there is no way to rebuild a row from an id.
  selectedCheckpoints?: Camera[];
  // Scopes every camera search to this project; null leaves the dialog
  // showing nothing since the owning page never opens it without one.
  projectId?: string | null;
  onSave?: (users: Camera[]) => void;
}

// "Select all" pulls every page for the active search, so it asks for far
// bigger pages than the table itself uses.
const SELECT_ALL_PAGE_LIMIT = 1500;

// Police stations are resolved by id list; chunk it so the GET query string
// cannot grow past what the gateway accepts.
const POLICE_STATION_ID_CHUNK_SIZE = 200;

const fetchPoliceStations = async (stationIds: string[]) => {
  const uniqueIds = [...new Set(stationIds.filter((id) => id && id !== "null"))];

  if (uniqueIds.length === 0) {
    return new Map<string, PoliceStation>();
  }

  const chunks: string[][] = [];

  for (let i = 0; i < uniqueIds.length; i += POLICE_STATION_ID_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + POLICE_STATION_ID_CHUNK_SIZE));
  }

  const responses = await Promise.all(
    chunks.map((chunk) =>
      getPoliceStation({
        filter: `id=${chunk.join("|")}`,
        limit: String(chunk.length),
      })
    )
  );

  return new Map(
    responses
      .flatMap((res) => res.data ?? [])
      .map((station) => [String(station.id), station])
  );
};

const AddCheckpoint = ({
  open,
  onClose,
  selectedCheckpoints = [],
  projectId = null,
  onSave,
}: Props) => {
  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [openedFilter, setOpenedFilter] = useState<string | null>(null);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Data
  const [selectedAreaRegion, setSelectedAreaRegion] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string[]>([]);
  const [rows, setRows] = useState<Camera[]>([]);

  // Checked cameras are kept as whole rows keyed by id rather than as a list
  // of ids: a selection spans pages the table no longer holds, so `rows` is
  // not enough to rebuild what has to be saved.
  const [checkpointChecked, setCheckpointChecked] = useState<Map<string, Camera>>(
    new Map()
  );
  // Set once "select all" has pulled every page, so the header checkbox stays
  // ticked while the user pages through the result.
  const [allPagesSelected, setAllPagesSelected] = useState(false);
  const [isSelectingAll, setIsSelectingAll] = useState(false);

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
  const area = useSelector((state: RootState) => state.dropdown.area);
  const province = useSelector((state: RootState) => state.dropdown.province);
  const policeStation = useSelector(
    (state: RootState) => state.dropdown.policeStation
  );

  const selectedCheckpointIdSet = useMemo(
    () => new Set(selectedCheckpoints.map((camera) => camera.camera_id)),
    [selectedCheckpoints]
  );

  // Area/province/station are bounded masterdata lists already loaded
  // app-wide, so their filter options list every possible value instead of
  // only the ones present on the currently loaded page.
  const areaOptions = useMemo<OptionType[]>(
    () =>
      area.map((item) => ({
        value: String(item.id),
        label:
          i18n.language === "th"
            ? item.title_abbr_th || item.title_th
            : item.title_abbr_en || item.title_en,
      })),
    [area, i18n.language]
  );

  const provinceOptions = useMemo<OptionType[]>(
    () =>
      province.map((item) => ({
        value: item.province_code,
        label: i18n.language === "th" ? item.name_th : item.name_en,
      })),
    [province, i18n.language]
  );

  const stationOptions = useMemo<OptionType[]>(
    () =>
      policeStation.map((item) => ({
        value: String(item.id),
        label: item.station_name,
      })),
    [policeStation]
  );

  // Camera names are not masterdata, so their option list is built from a
  // full pagination walk of every camera matching the current text search
  // (see the checkpoint-options effect below) instead of a bounded list.
  const [checkpointOptionRows, setCheckpointOptionRows] = useState<Camera[]>([]);

  const checkpointOptions = useMemo(
    () =>
      buildUniqueOptions(
        checkpointOptionRows,
        "camera_id",
        "camera_name"
      ),
    [checkpointOptionRows]
  );

  // Ticked once every page is covered; otherwise it falls back to "is this
  // page fully ticked" so the box still reflects a manual page selection.
  const selectAll =
    allPagesSelected ||
    (rows.length > 0 &&
      rows.every((camera) => checkpointChecked.has(camera.camera_id)));

  const isIndeterminate = !selectAll && checkpointChecked.size > 0;

  useEffect(() => {
    if (!open) return;

    // Deliberate "adjust state from props" sync, not a derived value — the
    // user toggles these checkboxes independently afterwards.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCheckpointChecked(
      new Map(selectedCheckpoints.map((camera) => [camera.camera_id, camera]))
    );
    setAllPagesSelected(false);
    // NOTE: intentionally does not depend on `rows` — this effect only needs
    // to (re)seed the checked set from the incoming selection when the
    // dialog opens or the selection prop changes. Including `rows` here
    // previously caused every page/search refetch to reset any checkboxes
    // the user had ticked on other pages back to just the incoming selection.
  }, [open, selectedCheckpoints]);

  const mapCameraRows = useCallback(
    async (cameras: Camera[]) => {
      // Resolved in a couple of chunked requests rather than one per camera —
      // "select all" feeds thousands of rows through here.
      const stationCache = await fetchPoliceStations(
        cameras.map((item) => String(item.police_station_id))
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
  )

  // Shared by every request that only needs the text search applied — the
  // checkpoint filter's own option list is built from this (see
  // checkpoint-options effect below) and must not be narrowed by the column
  // filters it is about to offer as choices. Project scoping lives here too
  // so every path (paged fetch, "select all", filter options) stays scoped
  // to the project the group belongs to.
  const getSearchOnlyFilter = useCallback(
    (filterData: FormData, pageData: number, limit: number) => {
      const body: Record<string, string> = {
        page: pageData.toString(),
        limit: limit.toString(),
      };

      const filterParts: string[] = [];

      if (filterData.search) {
        filterParts.push(`camera_name~*${filterData.search}*`);
      }

      if (projectId) {
        filterParts.push(`project_id=${projectId}`);
      }

      if (filterParts.length > 0) {
        body.filter = filterParts.join(",");
      }

      return body;
    },
    [projectId]
  );

  // The header-column filters used to be applied client-side to whatever
  // page happened to be loaded, so picking a value that only existed on
  // another page produced an empty table. They are folded into the backend
  // filter here instead, so pagination/"select all" reflect a match across
  // every camera, not just the loaded page.
  const getFilters = useCallback(
    (filterData: FormData, pageData: number, limit: number) => {
      const body = getSearchOnlyFilter(filterData, pageData, limit);

      const filterParts: string[] = body.filter ? [body.filter] : [];

      if (selectedAreaRegion.length > 0) {
        filterParts.push(`police_region_id=${selectedAreaRegion.join("|")}`);
      }

      if (selectedProvince.length > 0) {
        filterParts.push(`province_code=${selectedProvince.join("|")}`);
      }

      if (selectedStation.length > 0) {
        filterParts.push(`police_station_id=${selectedStation.join("|")}`);
      }

      if (selectedCheckpoint.length > 0) {
        filterParts.push(`camera_id=${selectedCheckpoint.join("|")}`);
      }

      if (filterParts.length > 0) {
        body.filter = filterParts.join(",");
      }

      return body;
    },
    [
      getSearchOnlyFilter,
      selectedAreaRegion,
      selectedProvince,
      selectedStation,
      selectedCheckpoint,
    ]
  );

  // Guards against a slower, stale request (e.g. a previous page/search)
  // overwriting the result of a newer one when the user paginates or
  // searches again before the first request finishes.
  const fetchRequestIdRef = useRef(0);

  const fetchData = useCallback(async (filterData: FormData = formData) => {
    const requestId = ++fetchRequestIdRef.current;
    setIsDataLoading(true);
    try {
      const res = await searchCameras({
        ...getFilters(filterData, page, rowsPerPage),
      })

      const cameras = res.data ?? [];

      const updated = await mapCameraRows(cameras);

      if (requestId !== fetchRequestIdRef.current) return;

      setRows(updated);
      setTotalItems(res.pagination?.countAll ?? 0);
      setTotalPages(res.pagination?.maxPage ?? 1);
    }
    catch {
      if (requestId !== fetchRequestIdRef.current) return;

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
      if (requestId === fetchRequestIdRef.current) {
        setIsDataLoading(false);
      }
    }
  }, [
    page,
    rowsPerPage,
    searchTrigger,
    getFilters,
  ]);

  useEffect(() => {
    fetchData();
  }, [
    fetchData,
    page,
    rowsPerPage,
    searchTrigger,
  ]);

  // Loads the checkpoint filter's own option list: every camera name
  // matching the current text search, walked across every page. Deferred
  // until the dropdown is actually opened, and re-run if the search changes
  // while it stays open — the app-wide camera count is too large to walk
  // eagerly every time the dialog opens.
  const checkpointFilterLabel = t("table.header.checkpoint");
  const loadedCheckpointOptionsSearchRef = useRef<string | null>(null);

  useEffect(() => {
    if (openedFilter !== checkpointFilterLabel) return;
    if (loadedCheckpointOptionsSearchRef.current === formData.search) return;

    let cancelled = false;

    const loadCheckpointOptions = async () => {
      try {
        const collected: Camera[] = [];
        let currentPage = 1;

        for (;;) {
          const res = await searchCameras(
            getSearchOnlyFilter(formData, currentPage, SELECT_ALL_PAGE_LIMIT)
          );

          const cameras = res.data ?? [];

          if (cameras.length === 0) break;

          collected.push(...cameras);

          const maxPage = res.pagination?.maxPage ?? 1;

          if (currentPage >= maxPage) break;

          currentPage++;
        }

        if (cancelled) return;

        setCheckpointOptionRows(collected);
        loadedCheckpointOptionsSearchRef.current = formData.search;
      } catch {
        if (!cancelled) setCheckpointOptionRows([]);
      }
    };

    loadCheckpointOptions();

    return () => {
      cancelled = true;
    };
  }, [openedFilter, checkpointFilterLabel, formData, getSearchOnlyFilter]);

  // Selecting a filter value re-queries the backend across every page, so
  // the current page and "everything selected" flag - both scoped to the
  // previous result set - no longer apply.
  const handleAreaFilterChange = useCallback((values: string[]) => {
    setSelectedAreaRegion(values);
    setPage(1);
    setAllPagesSelected(false);
  }, []);

  const handleProvinceFilterChange = useCallback((values: string[]) => {
    setSelectedProvince(values);
    setPage(1);
    setAllPagesSelected(false);
  }, []);

  const handleStationFilterChange = useCallback((values: string[]) => {
    setSelectedStation(values);
    setPage(1);
    setAllPagesSelected(false);
  }, []);

  const handleCheckpointFilterChange = useCallback((values: string[]) => {
    setSelectedCheckpoint(values);
    setPage(1);
    setAllPagesSelected(false);
  }, []);

  // MUI's Pagination reports a generic ChangeEvent, not a mouse event.
  const onChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    event.preventDefault();
    setPage(newPage);
  };

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearchOnEnter = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      setPage(1);
      // A new search means a different "all", so the flag can't carry over.
      setAllPagesSelected(false);
      setSearchTrigger((prev) => prev + 1);
    }
  };

  const handleCheckCheckpoint = (camera: Camera, checked: boolean) => {
    // Any manual untick means the selection is no longer "everything".
    if (!checked) {
      setAllPagesSelected(false);
    }

    setCheckpointChecked((prev) => {
      const next = new Map(prev);

      if (checked) {
        next.set(camera.camera_id, camera);
      } else {
        next.delete(camera.camera_id);
      }

      return next;
    });
  };

  const handleSave = () => {
    onSave?.(Array.from(checkpointChecked.values()));
  };

  // Walks every page of the current search so the checked set covers rows the
  // table never loaded — the backend caps a page at 1500 rows.
  const fetchAllMatchingCameras = useCallback(async () => {
    const collected: Camera[] = [];

    let currentPage = 1;

    for (;;) {
      const res = await searchCameras(
        getFilters(formData, currentPage, SELECT_ALL_PAGE_LIMIT)
      );

      const cameras = res.data ?? [];

      if (cameras.length === 0) break;

      collected.push(...cameras);

      const maxPage = res.pagination?.maxPage ?? 1;

      if (currentPage >= maxPage) break;

      currentPage++;
    }

    return mapCameraRows(collected);
  }, [formData, getFilters, mapCameraRows]);

  const handleSelectAll = async (checked: boolean) => {
    // Unticking clears the whole selection, not just this page — the box
    // stands for every row behind the current search.
    if (!checked) {
      setAllPagesSelected(false);
      setCheckpointChecked(new Map());
      return;
    }

    try {
      setIsSelectingAll(true);

      // getFilters already applies the column filters server-side, so every
      // camera this returns is a match — no client-side re-filtering needed.
      const allCameras = await fetchAllMatchingCameras();

      setCheckpointChecked((prev) => {
        const next = new Map(prev);

        allCameras.forEach((camera) => next.set(camera.camera_id, camera));

        return next;
      });

      setAllPagesSelected(true);
    }
    catch {
      await PopupMessage(t("popup.fetch-error"), "", "error");
    }
    finally {
      setIsSelectingAll(false);
    }
  };

  const resetAddCheckpoint = () => {
    setFormData({
      search: "",
    });
    setPage(1);
    setTotalPages(1);
    setCheckpointChecked(new Map());
    setAllPagesSelected(false);
    setSelectedAreaRegion([]);
    setSelectedProvince([]);
    setSelectedStation([]);
    setSelectedCheckpoint([]);
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
          <p className='text-[14px] text-(--secondary-color) font-medium'>
            {`${totalItems} ${t('text.list')}`}
            {checkpointChecked.size > 0 &&
              ` | ${t('text.select')} ${checkpointChecked.size} ${t('text.list')}`}
          </p>
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
                  option={areaOptions}
                  filter
                  selectedValues={selectedAreaRegion}
                  onChange={handleAreaFilterChange}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell
                  label={t("table.header.province")}
                  width="10%"
                  option={provinceOptions}
                  filter={true}
                  selectedValues={selectedProvince}
                  onChange={handleProvinceFilterChange}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell
                  label={t("table.header.station")}
                  width="10%"
                  option={stationOptions}
                  filter={true}
                  selectedValues={selectedStation}
                  onChange={handleStationFilterChange}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell
                  label={t("table.header.checkpoint")}
                  width="10%"
                  option={checkpointOptions}
                  filter={true}
                  selectedValues={selectedCheckpoint}
                  onChange={handleCheckpointFilterChange}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <TableCell align="center" sx={{ padding: 0, width: "5%" }}>
                  <Checkbox
                    checked={selectAll}
                    indeterminate={isIndeterminate}
                    disabled={isSelectingAll}
                    onChange={(event) => void handleSelectAll(event.target.checked)}
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
              {isDataLoading || isSelectingAll ? (
                  <TableSkeleton headerColumn={6} />
                ) : rows.length > 0 ? (
                  rows.map((row, index) => {
                    const isAlreadySelected = selectedCheckpointIdSet.has(row.camera_id);
                    const isChecked = checkpointChecked.has(row.camera_id);
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
                              handleCheckCheckpoint(row, event.target.checked)
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
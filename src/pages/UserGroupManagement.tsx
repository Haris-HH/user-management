import { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { useForm, Controller } from "react-hook-form";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";

import AddIcon from "@mui/icons-material/Add";
import SaveIcon from "@mui/icons-material/Save";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import LockIcon from "@mui/icons-material/Lock";
import SearchIcon from "@mui/icons-material/Search";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Components
import MainTitle from "../components/main-title/MainTitle";
import TextBox from "../components/text-box/TextBox";
import AutoComplete from "../components/auto-complete/AutoComplete";
import PermissionTable from "../components/permission-table/PermissionTable";
import LoadingScreen from "../components/loading-screen/LoadingScreen";

// Types
import type {
  OptionType,
  CameraInCheckpoint,
  UserGroup,
  GroupPermissions,
} from "../types/common";

// Hooks
import usePermissionUiList from "../hooks/usePermissionUiList";
import usePageTitle from "../hooks/usePageTitle";
import { usePermission } from "../hooks/usePermission";

// Constants
import { USER_MANAGEMENT_UI_KEY } from "../constants/permissions";

// i18n
import { useTranslation } from "react-i18next";

// Store
import type { RootState } from "../store/store";

// API
import { getPoliceStation } from "../features/dropdown/api/DropdownApi";
import {
  createUserGroup,
  updateUserGroup,
  getUserGroup,
  deleteUserGroup,
} from "../features/users/api/UsersApi";
import {
  getAllCameraGroup,
  getCamerasByIds,
} from "../features/core-data/api/CoreDataApi";

// Utils
import { PopupMessage, PopupMessageWithCancelAndDeny } from "../utils/popupMessage";
import { buildOptions } from "../utils/commonFunctions";

interface AddGroupFormData {
  group_name: string;
  login_lifetime: string;
  approved_lifetime: string;
}

type EditableUserGroup = UserGroup & {
  isNew?: boolean;
};

// A group is a permanently-locked "base" group by name, regardless of what
// the backend reports for `locked`. Pure and stateless - safe to hoist out of
// the component so it isn't redefined (and re-evaluated identically) on
// every render.
const isBaseUserGroup = (groupName: string) => {
  const normalized = groupName.toLowerCase();
  return normalized === "admin" || normalized === "user";
};

// Pure transform, no dependency on component state/props - hoisted so it has
// a stable identity and doesn't need to be listed in any hook's deps array.
const normalizeUserGroups = (rows: UserGroup[]): EditableUserGroup[] => {
  return rows
    .map((ug) => ({
      ...ug,
      permissions: ug.permissions ?? {},
      locked: ug.locked ?? isBaseUserGroup(ug.group_name),
      isNew: false,
    }))
    .sort((a, b) => a.group_id.localeCompare(b.group_id));
};

const UserGroupManagement = () => {
  const permissionUiList = usePermissionUiList();

  const { t, i18n } = useTranslation();
  usePageTitle(t("pages.user-group-management"));

  // Permission
  const { canEdit } = usePermission(
    USER_MANAGEMENT_UI_KEY,
    "user-group-management"
  );

  // A ref-counted loading flag: fetchUserGroups() and fetchData() both run
  // (and can be in flight) independently, so a plain boolean would let
  // whichever of the two finished first hide the loading screen while the
  // other was still fetching. Counting concurrent operations keeps the
  // overlay up until all of them have settled.
  const [loadingCount, setLoadingCount] = useState(0);
  const isLoading = loadingCount > 0;
  const beginLoading = useCallback(() => setLoadingCount((c) => c + 1), []);
  const endLoading = useCallback(
    () => setLoadingCount((c) => Math.max(0, c - 1)),
    []
  );

  const [permissionOptions, setPermissionOptions] = useState<OptionType[]>([]);
  const [checkpointData, setCheckpointData] = useState<CameraInCheckpoint[]>([]);
  const [permissionRows, setPermissionRows] = useState<EditableUserGroup[]>([]);
  const [originalPermissionRows, setOriginalPermissionRows] = useState<
    EditableUserGroup[]
  >([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [searchText, setSearchText] = useState("");

  const area = useSelector((state: RootState) => state.dropdown.area);
  const province = useSelector((state: RootState) => state.dropdown.province);
  const userGroup = useSelector((state: RootState) => state.dropdown.userGroup);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddGroupFormData>({
    defaultValues: {
      group_name: "",
      approved_lifetime: "",
      login_lifetime: "",
    },
  });

  const fetchUserGroups = useCallback(async () => {
    try {
      beginLoading();

      const res = await getUserGroup();

      const rows = normalizeUserGroups(res.data ?? []);

      setPermissionRows(rows);
      setOriginalPermissionRows(rows);

      if (rows.length > 0) {
        setSelectedGroupId(rows[0].group_id);
      } else {
        setSelectedGroupId("");
      }

      setPermissionOptions(
        buildOptions(rows, "", "group_name", "group_id", false)
      );
    }
    catch {
      await PopupMessage(t("popup.fetch-error"), "", "error");
    }
    finally {
      endLoading();
    }
  }, [t, beginLoading, endLoading]);

  const fetchData = useCallback(async () => {
    try {
      beginLoading();

      const cameraGroupResponse = await getAllCameraGroup({
        filter: "deleted=false",
      });

      const cameraGroups = cameraGroupResponse?.data ?? [];

      const allCameraIds = [
        ...new Set(
          cameraGroups.flatMap((group) => group.cameras ?? [])
        ),
      ];

      if (allCameraIds.length === 0) {
        setCheckpointData(
          cameraGroups.map((group) => ({
            ...group,
            camera_list: [],
          }))
        );

        return;
      }

      const cameras = await getCamerasByIds(allCameraIds);

      const allPoliceStationIds = [
        ...new Set(
          cameras
            .map((camera) => camera.police_station_id)
            .filter(
              (stationId): stationId is number =>
                Boolean(stationId)
            )
        ),
      ];

      const policeStationResponse =
        allPoliceStationIds.length > 0
          ? await getPoliceStation({
              filter: `id=${allPoliceStationIds.join("|")}`,
            })
          : { data: [] };

      const policeStationMap = new Map(
        (policeStationResponse?.data ?? []).map((station) => [
          station.id,
          station,
        ])
      );

      const policeRegionMap = new Map(
        area.map((item) => [item.id, item])
      );

      const provinceMap = new Map(
        province.map((item) => [item.province_code, item])
      );

      const cameraMap = new Map(
        cameras.map((camera) => {
          const policeStationData = policeStationMap.get(
            camera.police_station_id
          );

          const provinceData = provinceMap.get(
            camera.province_code
          );

          const policeRegionData = policeRegionMap.get(
            camera.police_region_id
          );

          return [
            camera.camera_id,
            {
              ...camera,
              police_region_name:
                i18n.language === "th"
                  ? policeRegionData?.title_abbr_th ?? "-"
                  : policeRegionData?.title_abbr_en ?? "-",
              police_station_name:
                policeStationData?.station_name ?? "-",
              province_name:
                i18n.language === "th"
                  ? provinceData?.name_th ?? "-"
                  : provinceData?.name_en ?? "-",
            },
          ];
        })
      );

      const updated = cameraGroups.map((cameraGroup) => ({
        ...cameraGroup,
        camera_list: (cameraGroup.cameras ?? [])
          .map((cameraId) => cameraMap.get(cameraId))
          .filter(
            (
              camera
            ): camera is NonNullable<typeof camera> =>
              Boolean(camera)
          ),
      }));

      setCheckpointData(updated);
    }
    catch {
      await PopupMessage(t("popup.fetch-error"), "", "error");
    }
    finally {
      endLoading();
    }
    // `area` is read (via policeRegionMap) but was previously missing from
    // this array: fetchData kept closing over whatever `area` was on first
    // render, so if the dropdown thunk resolved after this ran, checkpoint
    // rows would show "-" for the police region forever until something else
    // re-triggered a fetch.
  }, [area, province, i18n.language, t, beginLoading, endLoading]);

  useEffect(() => {
    fetchUserGroups();
  }, [fetchUserGroups]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const updated: EditableUserGroup[] = userGroup.map((ug) => ({
      ...ug,
      permissions: ug.permissions ?? {},
      locked: isBaseUserGroup(ug.group_name),
      isNew: false,
    }));

    setPermissionRows(updated);
    setOriginalPermissionRows(updated);

    if (updated.length > 0) {
      setSelectedGroupId(updated[0].group_id);
    }
  }, [userGroup]);

  const filteredRows = useMemo(() => {
    if (!searchText.trim()) return permissionRows;

    return permissionRows.filter((row) =>
      row.group_name.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [permissionRows, searchText]);

  const hasUnsavedChanges = useMemo(() => {
    return (
      JSON.stringify(permissionRows) !== JSON.stringify(originalPermissionRows)
    );
  }, [permissionRows, originalPermissionRows]);

  const selectedUserGroup = useMemo(() => {
    return (
      permissionRows.find((row) => row.group_id === selectedGroupId) ?? null
    );
  }, [permissionRows, selectedGroupId]);

  const handleAddPermission = async (data: AddGroupFormData) => {
    const name = data.group_name.trim();

    const isDuplicate = permissionRows.some(
      (row) => row.group_name.toLowerCase() === name.toLowerCase()
    );

    if (isDuplicate) {
      await PopupMessage(
        t("popup.error-title"),
        t("popup.duplicate-data"),
        "warning"
      );
      return;
    }

    const newGroup: EditableUserGroup = {
      group_id: `new-${crypto.randomUUID()}`,
      group_name: name,
      permissions: {},
      login_lifetime: Number(data.login_lifetime),
      approved_lifetime: Number(data.approved_lifetime),
      notes: "",
      locked: false,
      isNew: true,
    };

    setPermissionRows((prev) => [...prev, newGroup]);
    setSelectedGroupId(newGroup.group_id);

    reset({
      group_name: "",
      approved_lifetime: "",
      login_lifetime: "",
    });
  };

  const handleRowChange = (
    groupId: string,
    key: "login_lifetime" | "approved_lifetime",
    value: number
  ) => {
    setPermissionRows((prev) =>
      prev.map((row) =>
        row.group_id === groupId
          ? {
              ...row,
              [key]: value,
            }
          : row
      )
    );
  };

  const handleGroupPermissionsChange = (permissions: GroupPermissions) => {
    if (!selectedUserGroup) return;

    setPermissionRows((prev) =>
      prev.map((row) =>
        row.group_id === selectedUserGroup.group_id
          ? { ...row, permissions }
          : row
      )
    );
  };

  const handleSaveAll = async () => {
    try {
      beginLoading();

      // Map built once instead of an O(n) Array#find() per row (was O(n*m)
      // across all permission rows for every save).
      const originalRowsById = new Map(
        originalPermissionRows.map((row) => [row.group_id, row])
      );

      const changedRows = permissionRows.filter((row) => {
        const originalRow = originalRowsById.get(row.group_id);

        if (!originalRow) return true;

        return JSON.stringify(row) !== JSON.stringify(originalRow);
      });

      if (changedRows.length === 0) {
        await PopupMessage("", t("text.data-not-change"), "info");
        return;
      }

      await Promise.all(
        changedRows.map(async (row) => {
          const body = {
            group_name: row.group_name,
            permissions: row.permissions,
            login_lifetime: row.login_lifetime,
            approved_lifetime: row.approved_lifetime,
            notes: row.notes ?? "",
          };

          if (row.isNew) {
            return createUserGroup(body);
          }

          return updateUserGroup({
            group_id: row.group_id,
            ...body,
          });
        })
      );

      await PopupMessage(t("popup.save-success"), "", "success");
      await fetchUserGroups();
    }
    catch {
      await PopupMessage(t("popup.save-error"), "", "error");
    }
    finally {
      endLoading();
    }
  };

  const handleCancel = async () => {
    if (!hasUnsavedChanges) return;

    const result = await PopupMessageWithCancelAndDeny(
      t("popup.unsaved-change-title"),
      t("popup.unsaved-change-message"),
      t("button.save"),
      t("button.not-save"),
      t("button.cancel"),
      "warning"
    );

    if (result.isConfirmed) {
      await handleSaveAll();
    }
    else if (result.isDenied) {
      handleDiscardChanges();
    }    
  };

  const handleDiscardChanges = () => {
    const restoredRows = structuredClone(originalPermissionRows);

    setPermissionRows(restoredRows);

    if (
      selectedGroupId &&
      !restoredRows.some((r) => r.group_id === selectedGroupId)
    ) {
      setSelectedGroupId(restoredRows[0]?.group_id ?? "");
    }
  };

  const handleRemovePermission = async (groupId: string) => {
    try {
      const permissionRow = permissionRows.find(
        (pr) => pr.group_id === groupId
      );

      if (!permissionRow) return;

      if (permissionRow.isNew) {
        setPermissionRows((prev) =>
          prev.filter((row) => row.group_id !== groupId)
        );

        return;
      }

      beginLoading();

      await deleteUserGroup([groupId]);
      await fetchUserGroups();

      await PopupMessage(
        "",
        t("popup.deleted-success"),
        "success"
      );
    }
    catch {
      await PopupMessage(
        "",
        t("popup.deleted-failed"),
        "error"
      );
    }
    finally {
      endLoading();
    }
  };

  return (
    <section id="user-group-management" className="flex flex-col h-full w-full">
      {isLoading && <LoadingScreen />}

      <Box className="p-4 flex flex-col gap-4 h-full w-full">
        <MainTitle title={t("pages.user-group-management")} />

        <Box
          className="flex flex-col flex-1 bg-(--tertiary-color)/80 rounded-lg overflow-y-auto"
          sx={{
            boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box className="flex flex-col gap-5 p-6">
            <form onSubmit={handleSubmit(handleAddPermission)}>
              <Box className="flex flex-col md:flex-row gap-5 items-start">
                <Box className="flex-1">
                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="permission-search"
                    label={t("component.search")}
                    placeholder={t("placeholder.search")}
                    labelFontSize="16px"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    startAdornment={
                      <SearchIcon sx={{ color: "var(--primary-color)" }} />
                    }
                  />
                </Box>

                {/*
                  Search stays available at "active"; everything that creates a
                  group goes away with the edit right.
                */}
                {canEdit && (
                <>
                <Box className="w-full md:w-125">
                  <Controller
                    name="group_name"
                    control={control}
                    rules={{
                      required: t("text.text-required", { textField: t("component.permission-2") }),
                    }}
                    render={({ field }) => (
                      <AutoComplete
                        id="permission-select"
                        value={null}
                        inputValue={field.value}
                        onInputChange={(_, value) => field.onChange(value)}
                        onChange={(_, value) =>
                          field.onChange(
                            value?.inputValue ?? value?.label ?? ""
                          )
                        }
                        options={permissionOptions}
                        label={t("component.permission-2")}
                        placeholder={t("placeholder.permission-2")}
                        labelFontSize="16px"
                        freeSolo
                        error={!!errors.group_name}
                        sx={{ marginTop: "5px" }}
                      />
                    )}
                  />

                  {errors.group_name && (
                    <Typography sx={{ color: "var(--danger-color)", fontSize: 12 }}>
                      {errors.group_name.message}
                    </Typography>
                  )}
                </Box>

                <Box className="w-full md:w-50">
                  <Controller
                    name="approved_lifetime"
                    control={control}
                    rules={{
                      required: t("text.text-required", { textField: t("component.end-date") }),
                      min: {
                        value: 1,
                        message: t("text.min-1"),
                      },
                    }}
                    render={({ field }) => (
                      <TextBox
                        sx={{ marginTop: "5px" }}
                        id="approved_lifetime"
                        type="number"
                        label={t("component.end-date")}
                        placeholder=""
                        labelFontSize="16px"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!errors.approved_lifetime}
                        helperText={
                          errors.approved_lifetime?.message?.toString() ?? ""
                        }
                      />
                    )}
                  />
                </Box>

                <Box className="w-full md:w-50">
                  <Controller
                    name="login_lifetime"
                    control={control}
                    rules={{
                      required: t("text.text-required", { textField: t("component.life-date") }),
                      min: {
                        value: 1,
                        message: t("text.min-1"),
                      },
                    }}
                    render={({ field }) => (
                      <TextBox
                        sx={{ marginTop: "5px" }}
                        id="login_lifetime"
                        type="number"
                        label={t("component.life-date")}
                        placeholder=""
                        labelFontSize="16px"
                        value={field.value}
                        onChange={field.onChange}
                        error={!!errors.login_lifetime}
                        helperText={
                          errors.login_lifetime?.message?.toString() ?? ""
                        }
                      />
                    )}
                  />
                </Box>

                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  type="submit"
                  sx={{
                    height: "45px",
                    px: 3,
                    mt: "18px",
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                    textTransform: "none",
                  }}
                >
                  {t("button.add-user-group")}
                </Button>
                </>
                )}
              </Box>
            </form>
          </Box>

          <Box className="px-6 pb-4 shrink-0">
            <Box className="border border-(--primary-color) rounded-lg overflow-hidden bg-(--tertiary-color)">
              <Box className="px-5 py-4 bg-(--tertiary-color) flex items-center justify-between border-b border-(--primary-color)">
                <Typography sx={{ fontWeight: 600, color: "var(--primary-color)" }}>
                  {t("component.permission-2")}
                </Typography>

                <Chip
                  label={`${permissionRows.length} ${t("text.list")}`}
                  size="small"
                  sx={{
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                    fontWeight: 700,
                  }}
                />
              </Box>

              <Box className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(var(--primary-color-rgb), 0.8)" }}>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-(--tertiary-color) border-b border-(--primary-color)">
                        {t("table.header.user-group")}
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-(--tertiary-color) border-b border-(--primary-color)">
                        {t("table.header.end-date")}
                      </th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-(--tertiary-color) border-b border-(--primary-color)">
                        {t("table.header.life-date")}
                      </th>
                      {canEdit && (
                        <th className="px-5 py-3 text-xs font-bold uppercase text-(--tertiary-color) border-b border-(--primary-color) text-right">
                          {t("table.header.delete")}
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.group_id}
                        onClick={() => setSelectedGroupId(row.group_id)}
                        className={`transition-colors cursor-pointer border-b border-(--primary-color) ${
                          selectedGroupId === row.group_id
                            ? "bg-(--primary-color) text-(--tertiary-color)"
                            : "text-(--primary-color) hover:text-(--tertiary-color) hover:bg-(--secondary-color)"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <Box className="flex items-center gap-3">
                            <Box className="w-9 h-9 rounded-lg flex items-center justify-center">
                              <LockIcon fontSize="small" />
                            </Box>

                            <Box>
                              <Typography
                                sx={{
                                  fontWeight: 600,
                                  textTransform: "capitalize",
                                }}
                              >
                                {row.group_name}
                              </Typography>

                              {row.locked && (
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    textTransform: "uppercase",
                                  }}
                                >
                                  {t("text.user-group-permanent")}
                                </Typography>
                              )}

                              {row.isNew && (
                                <Typography
                                  component="span"
                                  sx={{
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: "var(--waiting-approve-bg-color)",
                                  }}
                                >
                                  {t("text.unsave-change-detect")}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </td>

                        <td className="px-5 py-4">
                          <div className="w-50">
                            <TextBox
                              sx={{ marginTop: "5px" }}
                              id={`approved-${row.group_id}`}
                              type="number"
                              label=""
                              placeholder=""
                              labelFontSize="16px"
                              value={row.approved_lifetime}
                              disabled={!canEdit}
                              onChange={(event) =>
                                handleRowChange(
                                  row.group_id,
                                  "approved_lifetime",
                                  Number(event.target.value)
                                )
                              }
                            />
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="w-50">
                            <TextBox
                              sx={{ marginTop: "5px" }}
                              id={`login-${row.group_id}`}
                              type="number"
                              label=""
                              placeholder=""
                              labelFontSize="16px"
                              value={row.login_lifetime}
                              disabled={!canEdit}
                              onChange={(event) =>
                                handleRowChange(
                                  row.group_id,
                                  "login_lifetime",
                                  Number(event.target.value)
                                )
                              }
                            />
                          </div>
                        </td>

                        {canEdit && (
                        <td className="px-5 py-4 text-right">
                          {row.locked ? (
                            <Typography
                              component="span"
                              sx={{ fontStyle: "italic", fontWeight: 600 }}
                            >
                              {t("text.locked")}
                            </Typography>
                          ) : (
                            <IconButton
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemovePermission(row.group_id);
                              }}
                              sx={{
                                color: "var(--danger-color)",
                                "&:hover": {
                                  backgroundColor: "rgba(219, 39, 64, 0.08)",
                                },
                              }}
                            >
                              <DeleteOutlineOutlinedIcon />
                            </IconButton>
                          )}
                        </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          </Box>

          <Box className="grid grid-cols-2 gap-5 p-4 flex-1">
            <PermissionTable
              permissionUiList={permissionUiList}
              checkpointList={checkpointData}
              permissions={selectedUserGroup?.permissions ?? {}}
              disabled={!selectedUserGroup || !canEdit}
              onPermissionsChange={handleGroupPermissionsChange}
            />
          </Box>

          <Box className="sticky bottom-0 bg-(--tertiary-color) border-t border-(--primary-color) p-4 flex items-center justify-between">
            <Box className="flex items-center gap-2">
              <InfoOutlinedIcon
                sx={{
                  color: hasUnsavedChanges
                    ? "var(--waiting-approve-bg-color)"
                    : "var(--primary-color)",
                }}
              />

              <Typography
                sx={{
                  color: hasUnsavedChanges
                    ? "var(--waiting-approve-bg-color)"
                    : "var(--primary-color)",
                  fontWeight: hasUnsavedChanges ? 600 : 400,
                }}
              >
                {hasUnsavedChanges
                  ? t("text.unsave-change-detect")
                  : t("text.data-not-change")}
              </Typography>
            </Box>

            {canEdit && (
            <Box className="flex gap-2">
              <Button
                variant="outlined"
                sx={{
                  width: 130,
                  height: 35,
                  backgroundColor: "var(--tertiary-color)",
                  border: "1px solid var(--primary-color)",
                  color: "var(--primary-color)",
                  "&:hover": {
                    backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                  },
                  textTransform: "capitalize",
                  "&.Mui-disabled": {
                    backgroundColor: "var(--tertiary-color)",
                    color: "var(--primary-color)",
                    border: "1px solid var(--primary-color)",
                    opacity: 0.5,
                  },
                }}
                onClick={handleCancel}
              >
                {t("button.cancel")}
              </Button>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveAll}
                disabled={!hasUnsavedChanges}
                sx={{
                  width: 130,
                  height: 35,
                  backgroundColor: "var(--primary-color)",
                  color: "var(--tertiary-color)",
                  textTransform: "none",
                  "&.Mui-disabled": {
                    backgroundColor: "var(--primary-color)",
                    color: "var(--tertiary-color)",
                    opacity: 0.5,
                  },
                }}
              >
                {t("button.save")}
              </Button>
            </Box>
            )}
          </Box>
        </Box>
      </Box>
    </section>
  );
};

export default UserGroupManagement;
import { useState, useMemo, useCallback } from "react";

// Material UI
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import Radio from "@mui/material/Radio";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type {
  PermissionUiList,
  CameraInCheckpoint,
  GroupPermissions,
  PermissionUiGroup,
  PermissionMode,
} from "../../types/common";

// A single ui[uiKey] entry of GroupPermissions, e.g. { enabled, groups, prints }.
type UiPermissionEntry = NonNullable<GroupPermissions["ui"]>[string];

// One pass over a ui's group_list instead of the 6 separate .every()/.filter()
// passes the previous implementation did (each of which re-derived the same
// lookups) - same results, O(m) instead of O(6m) per ui block.
type UiGroupSummary = {
  allActiveChecked: boolean;
  allEditChecked: boolean;
  allPrintChecked: boolean;
  activeCount: number;
  editCount: number;
  noneCount: number;
};

// Label rows are context for the rows around them, not permissions - they hold
// no mode and must stay out of every count, select-all and persisted map.
const isPermissionRow = (group: PermissionUiGroup) => group.is_label !== true;

const summarizeUiGroups = (
  groupList: PermissionUiGroup[],
  groups: Record<string, PermissionMode> | undefined,
  prints: Record<string, boolean> | undefined
): UiGroupSummary => {
  let total = 0;

  let activeCount = 0;
  let editCount = 0;
  let noneCount = 0;
  let printCount = 0;

  for (const group of groupList) {
    if (!isPermissionRow(group)) continue;

    total += 1;

    const mode = groups?.[group.key] ?? "none";

    if (mode === "active") activeCount += 1;
    else if (mode === "edit") editCount += 1;
    else noneCount += 1;

    if (prints?.[group.key] === true) printCount += 1;
  }

  return {
    allActiveChecked: total > 0 && activeCount === total,
    allEditChecked: total > 0 && editCount === total,
    allPrintChecked: total > 0 && printCount === total,
    activeCount,
    editCount,
    noneCount,
  };
};

// Builds the immutable ui[uiKey] update shared by every mutation below:
// keep the rest of `permissions` and the rest of `ui` untouched, replace only
// uiKey's entry with { ...old entry, ...patch }.
const mergeUiEntry = (
  permissions: GroupPermissions,
  uiKey: string,
  patch: Partial<UiPermissionEntry>
): GroupPermissions => ({
  ...permissions,
  ui: {
    ...(permissions.ui ?? {}),
    [uiKey]: {
      ...(permissions.ui?.[uiKey] ?? {}),
      ...patch,
    },
  },
});

type Props = {
  permissionUiList: PermissionUiList[];
  checkpointList: CameraInCheckpoint[];
  permissions: GroupPermissions;
  disabled?: boolean;
  onPermissionsChange: (permissions: GroupPermissions) => void;
};

const PermissionTable = ({
  permissionUiList,
  checkpointList,
  permissions,
  disabled = false,
  onPermissionsChange,
}: Props) => {
  const { t } = useTranslation();

  const [openAccordion, setOpenAccordion] = useState<Record<number, boolean>>(
    {}
  );

  const [openCheckpointAccordion, setOpenCheckpointAccordion] = useState<
    Record<number, boolean>
  >({});

  const getUiPermission = (uiKey: string): UiPermissionEntry => {
    return permissions.ui?.[uiKey] ?? {};
  };

  const isUiEnabled = (uiKey: string) => {
    return getUiPermission(uiKey).enabled === true;
  };

  const isPrintEnabled = (uiKey: string, groupKey: string) => {
    return getUiPermission(uiKey).prints?.[groupKey] === true;
  };

  const updatePermissions = (updated: GroupPermissions) => {
    if (disabled) return;
    onPermissionsChange(updated);
  };

  // No external deps - stable identity across renders (permissions changes
  // on every edit, so handlers that touch it can't be usefully memoized).
  const handleToggleAccordion = useCallback((index: number) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
  }, []);

  const handleToggleCheckpointAccordion = useCallback((index: number) => {
    setOpenCheckpointAccordion((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
  }, []);

  const handleToggleUiEnabled = (uiKey: string) => {
    const nextEnabled = !isUiEnabled(uiKey);

    const updated = mergeUiEntry(permissions, uiKey, { enabled: nextEnabled });

    if (!nextEnabled) {
      delete updated.ui?.[uiKey]?.enabled;

      if (
        updated.ui?.[uiKey] &&
        !updated.ui[uiKey].enabled &&
        !updated.ui[uiKey].groups
      ) {
        delete updated.ui[uiKey];
      }
    }

    updatePermissions(updated);
  };

  /*
    Clicking the level a row already has clears it back to "none". Without this
    a radio pair is a one-way door: once a level is picked there is no way to
    revoke the permission again short of switching the whole ui off.
  */
  const handleSelectPermission = (
    uiKey: string,
    groupKey: string,
    mode: PermissionMode
  ) => {
    const current = permissions.ui?.[uiKey]?.groups?.[groupKey] ?? "none";

    updatePermissions(
      mergeUiEntry(permissions, uiKey, {
        groups: {
          ...(permissions.ui?.[uiKey]?.groups ?? {}),
          [groupKey]: current === mode ? "none" : mode,
        },
      })
    );
  };

  const handleTogglePrintPermission = (uiKey: string, groupKey: string) => {
    const current = isPrintEnabled(uiKey, groupKey);

    updatePermissions(
      mergeUiEntry(permissions, uiKey, {
        prints: {
          ...(permissions.ui?.[uiKey]?.prints ?? {}),
          [groupKey]: !current,
        },
      })
    );
  };

  // Same toggle at column level: clicking a fully-selected column clears every
  // row back to "none".
  const handleSelectAllPermission = (
    ui: PermissionUiList,
    mode: PermissionMode,
    isAllSelected: boolean
  ) => {
    const uiKey = ui.key;
    const nextMode: PermissionMode = isAllSelected ? "none" : mode;

    const groups = ui.group_list.reduce<Record<string, PermissionMode>>(
      (acc, group) => {
        if (isPermissionRow(group)) acc[group.key] = nextMode;
        return acc;
      },
      {}
    );

    updatePermissions(mergeUiEntry(permissions, uiKey, { groups }));
  };

  const handleSelectAllPrintPermission = (ui: PermissionUiList, checked: boolean) => {
    const uiKey = ui.key;

    const prints = ui.group_list.reduce<Record<string, boolean>>((acc, group) => {
      if (isPermissionRow(group)) acc[group.key] = checked;
      return acc;
    }, {});

    updatePermissions(mergeUiEntry(permissions, uiKey, { prints }));
  };

  const selectedCheckpointIds = permissions.checkpoint_ids ?? [];

  // Built once per render (keyed off the actual prop, not the `?? []`
  // fallback above, which would be a fresh array every render) instead of
  // doing an O(k) Array#includes() scan for every checkpoint row and inside
  // the "select all" checks below - turns the matrix's checkpoint column
  // from O(n*k) into O(n+k).
  const selectedCheckpointIdSet = useMemo(
    () => new Set(permissions.checkpoint_ids ?? []),
    [permissions.checkpoint_ids]
  );

  const checkpointIds = useMemo(
    () => checkpointList.map((cp) => String(cp.group_id)),
    [checkpointList]
  );

  const allCheckpointChecked =
    checkpointIds.length > 0 &&
    checkpointIds.every((id) => selectedCheckpointIdSet.has(id));

  const someCheckpointChecked =
    checkpointIds.some((id) => selectedCheckpointIdSet.has(id)) &&
    !allCheckpointChecked;

  const handleToggleCheckpoint = (checkpointId: number | string) => {
    const id = String(checkpointId);

    const updated = selectedCheckpointIdSet.has(id)
      ? selectedCheckpointIds.filter((item) => item !== id)
      : [...selectedCheckpointIds, id];

    updatePermissions({
      ...permissions,
      checkpoint_ids: updated,
    });
  };

  const handleToggleAllCheckpoints = (checked: boolean) => {
    updatePermissions({
      ...permissions,
      checkpoint_ids: checked ? checkpointIds : [],
    });
  };

  const activeCount = permissionUiList.filter((ui) =>
    isUiEnabled(ui.key)
  ).length;

  const inactiveCount = permissionUiList.length - activeCount;

  return (
    <>
      <div className="flex flex-col px-2 h-full">
        <div className="flex items-center justify-between gap-2">
          <Typography
            component="h6"
            style={{ color: "var(--primary-color)", fontWeight: 500 }}
          >
            {t("text.ui-permission")}
          </Typography>

          <div className="flex items-center gap-3 text-sm font-medium">
            <p className="text-(--approve-bg-color)">
              {`${t("text.active")}: ${activeCount}`}
            </p>

            <p className="text-(--not-approve-bg-color)">
              {`${t("text.inactive")}: ${inactiveCount}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border border-(--primary-color) rounded-sm p-2 mt-2 flex-1">
          {permissionUiList.map((ui, uiIndex) => {
            const uiKey = ui.key;
            const uiPermissionEntry = getUiPermission(uiKey);
            const uiIsEnabled = uiPermissionEntry.enabled === true;

            const {
              allActiveChecked,
              allEditChecked,
              allPrintChecked,
              activeCount: activePermissionCount,
              editCount: editPermissionCount,
              noneCount: noPermissionCount,
            } = summarizeUiGroups(
              ui.group_list,
              uiPermissionEntry.groups,
              uiPermissionEntry.prints
            );

            return (
              <Accordion
                key={uiKey}
                expanded={openAccordion[uiIndex] ?? false}
                onChange={() => handleToggleAccordion(uiIndex)}
                sx={{
                  borderRadius: "5px",
                  backgroundColor: "var(--primary-color)",
                  opacity: disabled ? 0.65 : 1,
                  "&.Mui-expanded": { margin: 0 },
                  "& .MuiSvgIcon-root": { color: "var(--tertiary-color)" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ArrowDropDownIcon />}
                  sx={{
                    flexDirection: "row-reverse",
                    "& .MuiAccordionSummary-content": {
                      width: "100%",
                      margin: 0,
                    },
                  }}
                >
                  <div className="flex w-full justify-between items-center">
                    <Typography
                      component="span"
                      style={{
                        color: "var(--tertiary-color)",
                        fontWeight: 700,
                      }}
                    >
                      {ui.name}
                    </Typography>

                    <div className="flex gap-2">
                      <div className="flex items-center gap-2">
                        {uiIsEnabled && (
                          <>
                            {activePermissionCount > 0 && (
                              <div className="bg-(--approve-bg-color) px-2 py-1 rounded-sm">
                                <p className="text-xs text-(--secondary-color)">
                                  {`${t(
                                    "table.header.can-visit"
                                  )} : ${activePermissionCount}`}
                                </p>
                              </div>
                            )}

                            {editPermissionCount > 0 && (
                              <div className="bg-(--waiting-approve-bg-color) px-2 py-1 rounded-sm">
                                <p className="text-xs text-(--tertiary-color)">
                                  {`${t(
                                    "table.header.can-visit-and-edit"
                                  )} : ${editPermissionCount}`}
                                </p>
                              </div>
                            )}

                            {noPermissionCount > 0 && (
                              <div className="bg-(--not-approve-bg-color) px-2 py-1 rounded-sm">
                                <p className="text-xs text-(--secondary-color)">
                                  {`${t(
                                    "text.no-permission"
                                  )} : ${noPermissionCount}`}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleUiEnabled(uiKey);
                        }}
                        className={`rounded-sm p-2 transition-all duration-200 ${
                          disabled ? "cursor-not-allowed" : "cursor-pointer"
                        } ${
                          uiIsEnabled
                            ? "bg-(--approve-bg-color)"
                            : "bg-(--not-approve-bg-color)"
                        }`}
                      >
                        <p className="text-sm text-(--secondary-color)">
                          {uiIsEnabled ? t("text.active") : t("text.inactive")}
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow
                          sx={{
                            "& th": { height: "56.5px" },
                            "& .MuiTableCell-root": {
                              fontSize: "14px",
                              backgroundColor:
                                "rgba(var(--primary-color-rgb), 0.6)",
                              color: "var(--tertiary-color)",
                              fontWeight: "bold",
                            },
                          }}
                        >
                          <TableCell sx={{ width: "60%" }}>
                            {t("table.header.usage-menu")}
                          </TableCell>

                          <TableCell sx={{ width: "20%", textAlign: "center" }}>
                            <div className="flex flex-col items-center gap-2">
                              <Radio
                                size="small"
                                disabled={disabled || !uiIsEnabled}
                                checked={allActiveChecked}
                                onClick={() =>
                                  handleSelectAllPermission(
                                    ui,
                                    "active",
                                    allActiveChecked
                                  )
                                }
                                sx={{
                                  color: "var(--tertiary-color)",
                                  p: 0,
                                  "&.Mui-checked": {
                                    color: "var(--tertiary-color)",
                                  },
                                }}
                              />
                              <p>{t("table.header.can-visit")}</p>
                            </div>
                          </TableCell>

                          <TableCell sx={{ width: "20%", textAlign: "center" }}>
                            <div className="flex flex-col items-center gap-2">
                              <Radio
                                size="small"
                                disabled={disabled || !uiIsEnabled}
                                checked={allEditChecked}
                                onClick={() =>
                                  handleSelectAllPermission(
                                    ui,
                                    "edit",
                                    allEditChecked
                                  )
                                }
                                sx={{
                                  color: "var(--tertiary-color)",
                                  p: 0,
                                  "&.Mui-checked": {
                                    color: "var(--tertiary-color)",
                                  },
                                }}
                              />
                              <p>{t("table.header.can-visit-and-edit")}</p>
                            </div>
                          </TableCell>

                          <TableCell sx={{ width: "20%", textAlign: "center" }}>
                            <div className="flex flex-col items-center gap-2">
                              <Checkbox
                                size="small"
                                disabled={disabled || !uiIsEnabled}
                                checked={allPrintChecked}
                                onChange={(e) =>
                                  handleSelectAllPrintPermission(ui, e.target.checked)
                                }
                                sx={{
                                  color: "var(--tertiary-color)",
                                  p: 0,
                                  "&.Mui-checked": {
                                    color: "var(--tertiary-color)",
                                  },
                                }}
                              />
                              <p>{t("table.header.can-print")}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {ui.group_list.map((group, groupIndex) => {
                          const groupKey = group.key;
                          const mode = uiPermissionEntry.groups?.[groupKey] ?? "none";

                          // Nested catalogues indent their children; a flat one
                          // leaves depth unset and keeps the default padding.
                          const indent = 2 + (group.depth ?? 0) * 3;

                          /*
                            A row with no mode of its own spans the control
                            columns. At the top level it is a heading over the
                            rows beneath it; nested, it is a sub-item listed
                            under the menu that grants it.
                          */
                          if (group.is_label) {
                            const isHeading = !group.depth;

                            return (
                              <TableRow
                                key={`${uiKey}-${groupKey}-${groupIndex}`}
                                sx={{
                                  // A sub-item sits on a lighter band than the
                                  // menu row that grants it, so the two are
                                  // told apart at a glance.
                                  backgroundColor: isHeading
                                    ? "rgba(var(--primary-color-rgb), 0.45)"
                                    : "rgba(var(--primary-color-rgb), 0.12)",
                                  "& td": { border: "none" },
                                }}
                              >
                                <TableCell
                                  colSpan={4}
                                  sx={{
                                    pl: indent,
                                    py: isHeading ? 1 : 0.5,
                                    fontSize: "14px",
                                    ...(isHeading
                                      ? { fontWeight: 700 }
                                      : { opacity: 0.75 }),
                                  }}
                                >
                                  {group.name}
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return (
                            <TableRow
                              key={`${uiKey}-${groupKey}-${groupIndex}`}
                              sx={{
                                backgroundColor:
                                  "rgba(var(--primary-color-rgb), 0.3)",
                                "& td": { border: "none" },
                                "& .MuiTableCell-root": { fontSize: "14px" },
                              }}
                            >
                              {/* Nesting is carried by the indent alone. */}
                              <TableCell sx={{ pl: indent }}>
                                {group.name}
                              </TableCell>

                              <TableCell align="center" sx={{ p: 0 }}>
                                <Radio
                                  disabled={disabled || !uiIsEnabled}
                                  checked={mode === "active"}
                                  onClick={() =>
                                    handleSelectPermission(
                                      uiKey,
                                      groupKey,
                                      "active"
                                    )
                                  }
                                  sx={{
                                    color: "var(--primary-color)",
                                    "&.Mui-checked": {
                                      color: "var(--primary-color)",
                                    },
                                  }}
                                />
                              </TableCell>

                              <TableCell align="center" sx={{ p: 0 }}>
                                <Radio
                                  disabled={disabled || !uiIsEnabled}
                                  checked={mode === "edit"}
                                  onClick={() =>
                                    handleSelectPermission(
                                      uiKey,
                                      groupKey,
                                      "edit"
                                    )
                                  }
                                  sx={{
                                    color: "var(--primary-color)",
                                    "&.Mui-checked": {
                                      color: "var(--primary-color)",
                                    },
                                  }}
                                />
                              </TableCell>

                              <TableCell align="center" sx={{ p: 0 }}>
                                <Checkbox
                                  disabled={disabled || !uiIsEnabled}
                                  checked={uiPermissionEntry.prints?.[groupKey] === true}
                                  onChange={() => handleTogglePrintPermission(uiKey, groupKey)}
                                  sx={{
                                    color: "var(--primary-color)",
                                    "&.Mui-checked": {
                                      color: "var(--primary-color)",
                                    },
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col px-2 h-full">
        <div className="flex items-center justify-between gap-2">
          <Typography
            component="h6"
            style={{ color: "var(--primary-color)", fontWeight: 500 }}
          >
            {t("text.checkpoint-permission")}
          </Typography>

          <div className="flex items-center gap-3 text-sm font-medium">
            <p className="text-(--text-color)">
              {`${t("text.select")}: ${selectedCheckpointIds.length}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border border-(--primary-color) rounded-sm p-2 mt-2 flex-1">
          <TableContainer
            component={Paper}
            sx={{
              height: "100%",
              borderRadius: 0,
              backgroundColor: "var(--tertiary-color)",
              opacity: disabled ? 0.65 : 1,
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& th": {
                      fontSize: "16px",
                      backgroundColor: "var(--primary-color)",
                      color: "var(--tertiary-color)",
                      border: "none",
                      fontWeight: "bold",
                    },
                    "& .MuiTableCell-root": {
                      pl: 4,
                      py: 1,
                      pr: 0,
                    },
                  }}
                >
                  <TableCell sx={{ width: "45%" }}>
                    {t("table.header.checkpoint")}
                  </TableCell>

                  <TableCell sx={{ width: "35%", textAlign: "center" }}>
                    {t("table.header.checkpoint-count")}
                  </TableCell>

                  <TableCell sx={{ width: "30%", textAlign: "center" }}>
                    <div className="flex flex-col items-center gap-2">
                      <Checkbox
                        size="small"
                        disabled={disabled}
                        checked={allCheckpointChecked}
                        indeterminate={someCheckpointChecked}
                        onChange={(e) =>
                          handleToggleAllCheckpoints(e.target.checked)
                        }
                        sx={{
                          color: "var(--tertiary-color)",
                          p: 0,
                          "&.Mui-checked": {
                            color: "var(--tertiary-color)",
                          },
                          "&.MuiCheckbox-indeterminate": {
                            color: "var(--tertiary-color)",
                          },
                        }}
                      />
                      <p>{t("table.header.select")}</p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {checkpointList.map((checkpoint, chIndex) => (
                  <TableRow key={`checkpoint-permission-${checkpoint.group_id}`}>
                    <TableCell colSpan={3} sx={{ p: 0, border: "none" }}>
                      <Accordion
                        expanded={openCheckpointAccordion[chIndex] ?? false}
                        onChange={() => handleToggleCheckpointAccordion(chIndex)}
                        sx={{
                          width: "100%",
                          borderRadius: "0 !important",
                          backgroundColor:
                            "rgba(var(--primary-color-rgb), 0.8)",
                          "&.Mui-expanded": { margin: 0 },
                          "& .MuiSvgIcon-root": {
                            color: "var(--tertiary-color)",
                          },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ArrowDropDownIcon />}
                          sx={{
                            flexDirection: "row-reverse",
                            "& .MuiAccordionSummary-content": {
                              width: "100%",
                              margin: 0,
                            },
                          }}
                        >
                          <div className="grid grid-cols-[1fr_45%_13%] w-full items-center">
                            <Typography
                              component="span"
                              sx={{
                                color: "var(--tertiary-color)",
                                fontWeight: 700,
                              }}
                            >
                              {checkpoint.group_name}
                            </Typography>

                            <Typography
                              component="span"
                              sx={{
                                color: "var(--tertiary-color)",
                                fontWeight: 700,
                                textAlign: "center",
                              }}
                            >
                              {checkpoint.camera_list?.length ?? 0}
                            </Typography>

                            <div className="flex justify-center">
                              <Checkbox
                                size="small"
                                disabled={disabled}
                                checked={selectedCheckpointIdSet.has(
                                  String(checkpoint.group_id)
                                )}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() =>
                                  handleToggleCheckpoint(checkpoint.group_id)
                                }
                                sx={{
                                  color: "var(--tertiary-color)",
                                  p: 0,
                                  "&.Mui-checked": {
                                    color: "var(--tertiary-color)",
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </AccordionSummary>

                        <AccordionDetails sx={{ p: 0 }}>
                          <TableContainer component={Paper} sx={{ borderRadius: 0 }}>
                            <Table stickyHeader>
                              <TableHead>
                                <TableRow
                                  sx={{
                                    "& th": { height: "56.5px" },
                                    "& .MuiTableCell-root": {
                                      fontSize: "14px",
                                      backgroundColor:
                                        "rgba(var(--primary-color-rgb), 0.5)",
                                      color: "var(--tertiary-color)",
                                      fontWeight: "bold",
                                    },
                                  }}
                                >
                                  <TableCell sx={{ width: "25%" }}>
                                    {t("table.header.area-region")}
                                  </TableCell>
                                  <TableCell sx={{ width: "25%" }}>
                                    {t("table.header.province")}
                                  </TableCell>
                                  <TableCell sx={{ width: "25%", textAlign: "center" }}>
                                    {t("table.header.station")}
                                  </TableCell>
                                  <TableCell sx={{ width: "25%", textAlign: "center" }}>
                                    {t("table.header.checkpoint")}
                                  </TableCell>
                                </TableRow>
                              </TableHead>

                              <TableBody>
                                {checkpoint.camera_list &&
                                checkpoint.camera_list.length > 0 ? (
                                  checkpoint.camera_list.map((cl, groupIndex) => (
                                    <TableRow
                                      key={`checkpoint-camera-${chIndex}-${groupIndex}`}
                                      sx={{
                                        backgroundColor:
                                          "rgba(var(--primary-color-rgb), 0.3)",
                                        "& td": { border: "none" },
                                        "& .MuiTableCell-root": {
                                          fontSize: "14px",
                                        },
                                      }}
                                    >
                                      <TableCell>
                                        {cl.police_region_name ?? "-"}
                                      </TableCell>
                                      <TableCell>{cl.province_name}</TableCell>
                                      <TableCell align="center">
                                        {cl.police_station_name ?? "-"}
                                      </TableCell>
                                      <TableCell align="center">
                                        {cl.camera_name ?? "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow
                                    sx={{
                                      backgroundColor:
                                        "rgba(var(--primary-color-rgb), 0.3)",
                                      "& td": { border: "none" },
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
                        </AccordionDetails>
                      </Accordion>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </>
  );
};

export default PermissionTable;
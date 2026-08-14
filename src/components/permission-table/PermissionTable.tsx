import { useState, useMemo, useCallback, useEffect } from "react";

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
  Project,
  ProjectCheckpointPermission,
} from "../../types/common";

// API
import { getProjects } from "../../features/core-data/api/CoreDataApi";

// Utils
import { UNASSIGNED_PROJECT_KEY } from "../../utils/commonFunctions";

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

/*
  Reads every shape permissions.project_id has been persisted as, so a group
  saved before this feature's data model settled still renders its checked
  checkpoints instead of appearing empty:
   - current:      [{ project_id, camera_group_ids: string[] }, ...]
   - intermediate: string[] (checkpoint ids with no project association -
                   this briefly lived under the `project_id` key before
                   landing on the shape above)
   - original:     permissions.checkpoint_ids: string[] (pre-dates
                   project_id entirely)
  Untyped/`unknown`-guarded on purpose - this is reading real backend JSONB
  that predates the type below. Every save writes the current shape via
  `withProjectSelections`, so a group is migrated the next time it is edited
  here.
*/
const collectSelectedCheckpointIds = (permissions: GroupPermissions): Set<string> => {
  const set = new Set<string>();

  const addIfString = (value: unknown) => {
    if (typeof value === "string") set.add(value);
  };

  const projectEntries: unknown = permissions.project_id;

  if (Array.isArray(projectEntries)) {
    projectEntries.forEach((entry) => {
      if (typeof entry === "string") {
        set.add(entry);
        return;
      }

      const groupIds = (entry as { camera_group_ids?: unknown } | null)
        ?.camera_group_ids;

      if (Array.isArray(groupIds)) {
        groupIds.forEach(addIfString);
      }
    });
  }

  const legacyCheckpointIds = (permissions as { checkpoint_ids?: unknown })
    .checkpoint_ids;

  if (Array.isArray(legacyCheckpointIds)) {
    legacyCheckpointIds.forEach(addIfString);
  }

  return set;
};

// Writes the current permissions.project_id shape and drops the legacy
// checkpoint_ids key permissions may still be carrying from before this
// feature's data model settled - see collectSelectedCheckpointIds. Every
// handler below that touches checkpoint selection goes through this so a
// group is fully migrated the moment it is next saved.
const withProjectSelections = (
  permissions: GroupPermissions,
  projectSelections: ProjectCheckpointPermission[]
): GroupPermissions => {
  const next: GroupPermissions & { checkpoint_ids?: unknown } = {
    ...permissions,
    project_id: projectSelections,
  };

  delete next.checkpoint_ids;

  return next;
};

type ProjectBucket = {
  projectId: string;
  projectName: string;
  checkpoints: CameraInCheckpoint[];
};

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

  const [openProjectAccordion, setOpenProjectAccordion] = useState<
    Record<string, boolean>
  >({});

  // Keyed by group_id rather than list position - groups are nested one
  // level inside their project now, so a position-based key would collide
  // across projects and desync open/closed state on re-grouping.
  const [openCheckpointAccordion, setOpenCheckpointAccordion] = useState<
    Record<string, boolean>
  >({});

  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchProjects = async () => {
      try {
        const response = await getProjects({ limit: "100", page: "1" });
        if (!cancelled) setProjects(response.data ?? []);
      } catch {
        if (!cancelled) setProjects([]);
      }
    };

    fetchProjects();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleToggleCheckpointAccordion = useCallback((groupId: string) => {
    setOpenCheckpointAccordion((prev) => ({
      ...prev,
      [groupId]: !(prev[groupId] ?? false),
    }));
  }, []);

  const handleToggleProjectAccordion = useCallback((projectId: string) => {
    setOpenProjectAccordion((prev) => ({
      ...prev,
      [projectId]: !(prev[projectId] ?? false),
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

  // Flattened for row/column "is this group checked" lookups - group_ids are
  // unique across the whole list, so which project an entry belongs to
  // doesn't matter for membership checks. Reads every shape this data has
  // been persisted as (see collectSelectedCheckpointIds) so a group saved
  // before this feature's data model settled still shows its checked
  // checkpoints.
  const selectedCheckpointIdSet = useMemo(
    () => collectSelectedCheckpointIds(permissions),
    [permissions]
  );

  // Which project a checkpoint (camera-group) belongs to - same derivation
  // as the project buckets below, indexed by id so re-bucketing the
  // (possibly legacy-shaped) saved selection doesn't re-derive it per group.
  const checkpointProjectId = useMemo(() => {
    const map = new Map<string, string>();

    checkpointList.forEach((checkpoint) => {
      map.set(
        String(checkpoint.group_id),
        checkpoint.camera_list?.[0]?.project_id || UNASSIGNED_PROJECT_KEY
      );
    });

    return map;
  }, [checkpointList]);

  // The current selection, always re-bucketed into the current
  // { project_id, camera_group_ids } shape against the current
  // checkpointList - this is what the handlers below build on, so editing a
  // legacy-shaped (or stale-bucketed) permissions object migrates it to the
  // current shape as a side effect of the edit.
  const projectSelections = useMemo<ProjectCheckpointPermission[]>(() => {
    const buckets = new Map<string, string[]>();

    selectedCheckpointIdSet.forEach((id) => {
      const projectId = checkpointProjectId.get(id) ?? UNASSIGNED_PROJECT_KEY;
      const ids = buckets.get(projectId) ?? [];
      ids.push(id);
      buckets.set(projectId, ids);
    });

    return Array.from(buckets.entries()).map(([project_id, camera_group_ids]) => ({
      project_id,
      camera_group_ids,
    }));
  }, [selectedCheckpointIdSet, checkpointProjectId]);

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

  const projectMap = useMemo(
    () => new Map(projects.map((project) => [project.project_id, project])),
    [projects]
  );

  // Groups a group's project from its first camera - see UNASSIGNED_PROJECT_KEY.
  const projectGroups = useMemo<ProjectBucket[]>(() => {
    const buckets = new Map<string, CameraInCheckpoint[]>();

    checkpointList.forEach((checkpoint) => {
      const projectId =
        checkpoint.camera_list?.[0]?.project_id || UNASSIGNED_PROJECT_KEY;

      const bucket = buckets.get(projectId) ?? [];
      bucket.push(checkpoint);
      buckets.set(projectId, bucket);
    });

    const entries = Array.from(buckets.entries()).map<ProjectBucket>(
      ([projectId, checkpoints]) => ({
        projectId,
        projectName:
          projectId === UNASSIGNED_PROJECT_KEY
            ? t("text.no-project")
            : projectMap.get(projectId)?.project_name ?? projectId,
        checkpoints,
      })
    );

    entries.sort((a, b) => {
      if (a.projectId === UNASSIGNED_PROJECT_KEY) return 1;
      if (b.projectId === UNASSIGNED_PROJECT_KEY) return -1;
      return a.projectName.localeCompare(b.projectName);
    });

    return entries;
  }, [checkpointList, projectMap, t]);

  // Replaces one project's entry with `groupIds`, dropping the entry
  // entirely once it would be empty - keeps permissions.project_id holding
  // only projects that actually grant something, same as the flat array it
  // replaced never carried ids nobody selected.
  const setProjectCameraGroupIds = (
    entries: ProjectCheckpointPermission[],
    projectId: string,
    groupIds: string[]
  ): ProjectCheckpointPermission[] => {
    const withoutProject = entries.filter(
      (entry) => entry.project_id !== projectId
    );

    return groupIds.length > 0
      ? [...withoutProject, { project_id: projectId, camera_group_ids: groupIds }]
      : withoutProject;
  };

  const handleToggleCheckpoint = (
    projectId: string,
    checkpointId: number | string
  ) => {
    const id = String(checkpointId);

    const currentIds =
      projectSelections.find((entry) => entry.project_id === projectId)
        ?.camera_group_ids ?? [];

    const nextIds = currentIds.includes(id)
      ? currentIds.filter((item) => item !== id)
      : [...currentIds, id];

    updatePermissions(
      withProjectSelections(
        permissions,
        setProjectCameraGroupIds(projectSelections, projectId, nextIds)
      )
    );
  };

  const handleToggleAllCheckpoints = (checked: boolean) => {
    updatePermissions(
      withProjectSelections(
        permissions,
        checked
          ? projectGroups.map((bucket) => ({
              project_id: bucket.projectId,
              camera_group_ids: bucket.checkpoints.map((checkpoint) =>
                String(checkpoint.group_id)
              ),
            }))
          : []
      )
    );
  };

  const handleToggleProjectCheckpoints = (
    projectId: string,
    groupIds: string[],
    checked: boolean
  ) => {
    updatePermissions(
      withProjectSelections(
        permissions,
        setProjectCameraGroupIds(projectSelections, projectId, checked ? groupIds : [])
      )
    );
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
                                <p className="text-xs text-black">
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
                        className={`rounded-sm p-2 transition-colors duration-150 ${
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
                    <Table 
                      stickyHeader
                      sx={{
                        zIndex: 0,
                      }}
                    >
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
                                    "& .MuiSvgIcon-root": {
                                      color: "var(--primary-color)",
                                    },
                                    "&.Mui-checked .MuiSvgIcon-root": {
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
                                    "& .MuiSvgIcon-root": {
                                      color: "var(--primary-color)",
                                    },
                                    "&.Mui-checked .MuiSvgIcon-root": {
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
                                    "& .MuiSvgIcon-root": {
                                      color: "var(--primary-color)",
                                    },
                                    "&.Mui-checked .MuiSvgIcon-root": {
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
              {`${t("text.select")}: ${selectedCheckpointIdSet.size}`}
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
                      fontSize: "14px",
                      backgroundColor: "rgba(var(--primary-color-rgb), 0.6)",
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
                    {t("table.header.project")}
                  </TableCell>

                  <TableCell sx={{ width: "35%", textAlign: "center" }}>
                    {t("table.header.group-count")}
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
                {projectGroups.map((bucket) => {
                  const groupIds = bucket.checkpoints.map((checkpoint) =>
                    String(checkpoint.group_id)
                  );

                  const allProjectChecked =
                    groupIds.length > 0 &&
                    groupIds.every((id) => selectedCheckpointIdSet.has(id));

                  const someProjectChecked =
                    groupIds.some((id) => selectedCheckpointIdSet.has(id)) &&
                    !allProjectChecked;

                  return (
                    <TableRow key={`project-permission-${bucket.projectId}`}>
                      <TableCell colSpan={3} sx={{ p: 0, border: "none" }}>
                        <Accordion
                          expanded={openProjectAccordion[bucket.projectId] ?? false}
                          onChange={() =>
                            handleToggleProjectAccordion(bucket.projectId)
                          }
                          sx={{
                            width: "100%",
                            borderRadius: "0 !important",
                            backgroundColor: "var(--primary-color)",
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
                                {bucket.projectName}
                              </Typography>

                              <Typography
                                component="span"
                                sx={{
                                  color: "var(--tertiary-color)",
                                  fontWeight: 700,
                                  textAlign: "center",
                                }}
                              >
                                {bucket.checkpoints.length}
                              </Typography>

                              <div className="flex justify-center">
                                <Checkbox
                                  size="small"
                                  disabled={disabled}
                                  checked={allProjectChecked}
                                  indeterminate={someProjectChecked}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    handleToggleProjectCheckpoints(
                                      bucket.projectId,
                                      groupIds,
                                      e.target.checked
                                    )
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
                                        color: "black",
                                        fontWeight: "bold",
                                      },
                                    }}
                                  >
                                    <TableCell sx={{ width: "45%" }}>
                                      {t("table.header.checkpoint")}
                                    </TableCell>

                                    <TableCell sx={{ width: "35%", textAlign: "center" }}>
                                      {t("table.header.checkpoint-count")}
                                    </TableCell>

                                    <TableCell sx={{ width: "20%", textAlign: "center" }}>
                                      {t("table.header.select")}
                                    </TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {bucket.checkpoints.map((checkpoint) => (
                                    <TableRow
                                      key={`checkpoint-permission-${checkpoint.group_id}`}
                                    >
                                      <TableCell colSpan={3} sx={{ p: 0, border: "none" }}>
                                        <Accordion
                                          expanded={
                                            openCheckpointAccordion[checkpoint.group_id] ??
                                            false
                                          }
                                          onChange={() =>
                                            handleToggleCheckpointAccordion(
                                              checkpoint.group_id
                                            )
                                          }
                                          sx={{
                                            width: "100%",
                                            borderRadius: "0 !important",
                                            backgroundColor:
                                              "rgba(var(--primary-color-rgb), 0.45)",
                                            "&.Mui-expanded": { margin: 0 },
                                            "& .MuiSvgIcon-root": {
                                              color: "black",
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
                                                  color: "black",
                                                  fontWeight: 700,
                                                }}
                                              >
                                                {checkpoint.group_name}
                                              </Typography>

                                              <Typography
                                                component="span"
                                                sx={{
                                                  color: "black",
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
                                                    handleToggleCheckpoint(
                                                      bucket.projectId,
                                                      checkpoint.group_id
                                                    )
                                                  }
                                                  sx={{
                                                    color: "black",
                                                    p: 0,
                                                    "&.Mui-checked": {
                                                      color: "black",
                                                    },
                                                  }}
                                                />
                                              </div>
                                            </div>
                                          </AccordionSummary>

                                          <AccordionDetails sx={{ p: 0 }}>
                                            <TableContainer
                                              component={Paper}
                                              sx={{ borderRadius: 0 }}
                                            >
                                              <Table stickyHeader>
                                                <TableHead>
                                                  <TableRow
                                                    sx={{
                                                      "& th": { height: "56.5px" },
                                                      "& .MuiTableCell-root": {
                                                        fontSize: "14px",
                                                        backgroundColor:
                                                          "rgba(var(--primary-color-rgb), 0.6)",
                                                        color: "black",
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
                                                    <TableCell
                                                      sx={{ width: "25%", textAlign: "center" }}
                                                    >
                                                      {t("table.header.station")}
                                                    </TableCell>
                                                    <TableCell
                                                      sx={{ width: "25%", textAlign: "center" }}
                                                    >
                                                      {t("table.header.checkpoint")}
                                                    </TableCell>
                                                  </TableRow>
                                                </TableHead>

                                                <TableBody>
                                                  {checkpoint.camera_list &&
                                                  checkpoint.camera_list.length > 0 ? (
                                                    checkpoint.camera_list.map(
                                                      (cl, groupIndex) => (
                                                        <TableRow
                                                          key={`checkpoint-camera-${checkpoint.group_id}-${groupIndex}`}
                                                          sx={{
                                                            "& td": { border: "none" },
                                                            "& .MuiTableCell-root": {
                                                              fontSize: "14px",
                                                            },
                                                          }}
                                                        >
                                                          <TableCell>
                                                            {cl.police_region_name ?? "-"}
                                                          </TableCell>
                                                          <TableCell>
                                                            {cl.province_name}
                                                          </TableCell>
                                                          <TableCell align="center">
                                                            {cl.police_station_name ?? "-"}
                                                          </TableCell>
                                                          <TableCell align="center">
                                                            {cl.camera_name ?? "-"}
                                                          </TableCell>
                                                        </TableRow>
                                                      )
                                                    )
                                                  ) : (
                                                    <TableRow
                                                      sx={{
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
                          </AccordionDetails>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>
    </>
  );
};

export default PermissionTable;
import { useState } from "react";

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
} from "../../types/common";

type PermissionMode = "none" | "active" | "edit";

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
  const { t, i18n } = useTranslation();

  const [openAccordion, setOpenAccordion] = useState<Record<number, boolean>>(
    {}
  );

  const [openCheckpointAccordion, setOpenCheckpointAccordion] = useState<
    Record<number, boolean>
  >({});

  const getUiKey = (ui: PermissionUiList) => ui.key;

  const getGroupKey = (group: PermissionUiGroup) => group.key;

  const getUiPermission = (uiKey: string) => {
    return permissions.ui?.[uiKey] ?? {};
  };

  const isUiEnabled = (uiKey: string) => {
    return getUiPermission(uiKey).enabled === true;
  };

  const isPrintEnabled = (uiKey: string, groupKey: string) => {
    return getUiPermission(uiKey).prints?.[groupKey] === true;
  };

  const getPermissionMode = (
    uiKey: string,
    groupKey: string
  ): PermissionMode => {
    return getUiPermission(uiKey).groups?.[groupKey] ?? "none";
  };

  const updatePermissions = (updated: GroupPermissions) => {
    if (disabled) return;
    onPermissionsChange(updated);
  };

  const handleToggleAccordion = (index: number) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
  };

  const handleToggleCheckpointAccordion = (index: number) => {
    setOpenCheckpointAccordion((prev) => ({
      ...prev,
      [index]: !(prev[index] ?? false),
    }));
  };

  const handleToggleUiEnabled = (uiKey: string) => {
    const nextEnabled = !isUiEnabled(uiKey);

    const updated: GroupPermissions = {
      ...permissions,
      ui: {
        ...(permissions.ui ?? {}),
        [uiKey]: {
          ...(permissions.ui?.[uiKey] ?? {}),
          enabled: nextEnabled,
        },
      },
    };

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

  const handleSelectPermission = (
    uiKey: string,
    groupKey: string,
    mode: PermissionMode
  ) => {
    updatePermissions({
      ...permissions,
      ui: {
        ...(permissions.ui ?? {}),
        [uiKey]: {
          ...(permissions.ui?.[uiKey] ?? {}),
          groups: {
            ...(permissions.ui?.[uiKey]?.groups ?? {}),
            [groupKey]: mode,
          },
        },
      },
    });
  };

  const handleTogglePrintPermission = (uiKey: string, groupKey: string) => {
    const current = isPrintEnabled(uiKey, groupKey);

    updatePermissions({
      ...permissions,
      ui: {
        ...(permissions.ui ?? {}),
        [uiKey]: {
          ...(permissions.ui?.[uiKey] ?? {}),
          prints: {
            ...(permissions.ui?.[uiKey]?.prints ?? {}),
            [groupKey]: !current,
          },
        },
      },
    });
  };

  const handleSelectAllPermission = (
    ui: PermissionUiList,
    mode: PermissionMode
  ) => {
    const uiKey = getUiKey(ui);

    const groups = ui.group_list.reduce<Record<string, PermissionMode>>(
      (acc, group) => {
        acc[getGroupKey(group)] = mode;
        return acc;
      },
      {}
    );

    updatePermissions({
      ...permissions,
      ui: {
        ...(permissions.ui ?? {}),
        [uiKey]: {
          ...(permissions.ui?.[uiKey] ?? {}),
          groups,
        },
      },
    });
  };

  const handleSelectAllPrintPermission = (ui: PermissionUiList, checked: boolean) => {
    const uiKey = getUiKey(ui);

    const prints = ui.group_list.reduce<Record<string, boolean>>((acc, group) => {
      acc[getGroupKey(group)] = checked;
      return acc;
    }, {});

    updatePermissions({
      ...permissions,
      ui: {
        ...(permissions.ui ?? {}),
        [uiKey]: {
          ...(permissions.ui?.[uiKey] ?? {}),
          prints,
        },
      },
    });
  };

  const selectedCheckpointIds = permissions.checkpoint_ids ?? [];
  const checkpointIds = checkpointList.map((cp) => String(cp.id));

  const allCheckpointChecked =
    checkpointIds.length > 0 &&
    checkpointIds.every((id) => selectedCheckpointIds.includes(id));

  const someCheckpointChecked =
    checkpointIds.some((id) => selectedCheckpointIds.includes(id)) &&
    !allCheckpointChecked;

  const handleToggleCheckpoint = (checkpointId: number | string) => {
    const id = String(checkpointId);

    const updated = selectedCheckpointIds.includes(id)
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
    isUiEnabled(getUiKey(ui))
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
            const uiKey = getUiKey(ui);
            const uiIsEnabled = isUiEnabled(uiKey);

            const allActiveChecked =
              ui.group_list.length > 0 &&
              ui.group_list.every(
                (group) =>
                  getPermissionMode(uiKey, getGroupKey(group)) === "active"
              );

            const allEditChecked =
              ui.group_list.length > 0 &&
              ui.group_list.every(
                (group) =>
                  getPermissionMode(uiKey, getGroupKey(group)) === "edit"
              );

            const allPrintChecked =
              ui.group_list.length > 0 &&
              ui.group_list.every((group) =>
                isPrintEnabled(uiKey, getGroupKey(group))
              );

            const activePermissionCount = ui.group_list.filter(
              (group) =>
                getPermissionMode(uiKey, getGroupKey(group)) === "active"
            ).length;

            const editPermissionCount = ui.group_list.filter(
              (group) =>
                getPermissionMode(uiKey, getGroupKey(group)) === "edit"
            ).length;

            const noPermissionCount = ui.group_list.filter(
              (group) =>
                getPermissionMode(uiKey, getGroupKey(group)) === "none"
            ).length;

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
                              <div className="bg-(--warning-color) px-2 py-1 rounded-sm">
                                <p className="text-xs text-(--secondary-color)">
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
                                  handleSelectAllPermission(ui, "active")
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
                                  handleSelectAllPermission(ui, "edit")
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
                          const groupKey = getGroupKey(group);
                          const mode = getPermissionMode(uiKey, groupKey);

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
                              <TableCell>{group.name}</TableCell>

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
                                  checked={isPrintEnabled(uiKey, groupKey)}
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
                  <TableRow key={`checkpoint-permission-${checkpoint.id}`}>
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
                              {i18n.language === "th"
                                ? checkpoint.title_th
                                : checkpoint.title_en}
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
                                checked={selectedCheckpointIds.includes(
                                  String(checkpoint.id)
                                )}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() =>
                                  handleToggleCheckpoint(checkpoint.id)
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
                                        {i18n.language === "th"
                                          ? checkpoint.title_abbr_th
                                          : checkpoint.title_abbr_en}
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
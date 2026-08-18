import { useCallback, useEffect, useMemo, useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type { SelectChangeEvent } from "@mui/material/Select";

// Icons
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";

// Components
import MainTitle from "../components/main-title/MainTitle";
import CheckpointGroupList from "../components/group-list/CheckpointGroupList";
import CheckpointList from "../components/checkpoint-list/CheckpointList";

// i18n
import { useTranslation } from "react-i18next";

// Hooks
import usePageTitle from "../hooks/usePageTitle";
import { usePermission } from "../hooks/usePermission";

// Constants
import { USER_MANAGEMENT_UI_KEY } from "../constants/permissions";

// Types
import type { CheckpointGroup, Project } from "../types/common";

// API
import { getProjects } from "../features/core-data/api/CoreDataApi";

const ManageCheckpointGroup = () => {
  // i18n
  const { t } = useTranslation();

  // Permission
  const { canEdit } = usePermission(
    USER_MANAGEMENT_UI_KEY,
    "manage-checkpoint-group"
  );

  // Set page title
  usePageTitle(t("pages.manage-checkpoint-group"));

  // State
  const [refreshGroupListKey, setRefreshGroupListKey] = useState(0);
  const [selectedGroup, setSelectedGroup] =
    useState<CheckpointGroup | null>(null);

  // Projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [isProjectLoading, setIsProjectLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsProjectLoading(true);

        const response = await getProjects({
          limit: "100",
          page: "1",
        });

        setProjects(response.data ?? []);
      } catch {
        setProjects([]);
      } finally {
        setIsProjectLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleProjectChange = useCallback((event: SelectChangeEvent) => {
    setSelectedProjectId(event.target.value);
    setSelectedGroup(null);
  }, []);

  // Selected checkpoint IDs
  const selectedCheckpointIds = useMemo<string[]>(() => {
    const cameras = selectedGroup?.cameras;
    return Array.isArray(cameras) ? cameras : [];
  }, [selectedGroup?.cameras]);

  const handleSelectChange = useCallback(
    (group: CheckpointGroup | null) => {
      setSelectedGroup(group);
    },
    []
  );

  const handleDataChange = useCallback(() => {
    setRefreshGroupListKey((previous) => previous + 1);
  }, []);

  // Project select text color (muted while the project list is loading)
  const projectSelectColor = isProjectLoading
    ? "var(--theme-text-muted)"
    : "var(--theme-accent)";

  return (
    <section id="manage-checkpoint-group">
      <Box className="flex flex-col gap-4 p-6">
        <Box className="flex justify-between items-center">
          <MainTitle title={t("pages.manage-checkpoint-group")} />

          <FormControl size="small" sx={{ minWidth: 260 }}>
            <Select
              displayEmpty
              value={selectedProjectId}
              onChange={handleProjectChange}
              disabled={isProjectLoading}
              renderValue={(value) => {
                const selected = projects.find(
                  (project) => project.project_id === value
                );

                return (
                  <Box className="flex items-center gap-2">
                    <FolderOutlinedIcon
                      sx={{ fontSize: 20, color: projectSelectColor }}
                    />
                    <span
                      style={{
                        color: projectSelectColor,
                      }}
                    >
                      {selected
                        ? selected.project_name
                        : t("text.select-project-placeholder")}
                    </span>
                  </Box>
                );
              }}
              sx={{
                color: projectSelectColor,
                border: `1px solid ${projectSelectColor}`,
                borderRadius: "8px",
                backgroundColor: "var(--theme-panel)",
                "& .MuiSvgIcon-root": {
                  color: projectSelectColor,
                },
                "&.Mui-disabled .MuiSelect-select": {
                  WebkitTextFillColor: "var(--theme-text-muted)",
                },
              }}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      backgroundColor: "var(--theme-panel)",
                      border: "1px solid var(--theme-accent)",

                      "& .MuiMenuItem-root": {
                        color: projectSelectColor,
                        backgroundColor: "var(--theme-panel)",

                        "&:hover": {
                          backgroundColor: "rgba(var(--theme-accent-rgb), 0.15)",
                        },

                        "&.Mui-selected": {
                          color: "var(--theme-panel)",
                          backgroundColor: "var(--theme-accent) !important",
                        },

                        "&.Mui-selected:hover": {
                          backgroundColor:
                            "rgba(var(--theme-accent-rgb), 0.80) !important",
                        },
                      },
                    },
                  },
                },
              }}
            >
              <MenuItem value="">
                <em>
                  {t("text.select-project-placeholder")}
                </em>
              </MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.project_id} value={project.project_id}>
                  {project.project_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box className="grid grid-cols-[30vw_1fr] gap-5">
          <CheckpointGroupList
            selectedGroupId={selectedGroup?.group_id ?? null}
            refreshKey={refreshGroupListKey}
            canEdit={canEdit}
            projectId={selectedProjectId || null}
            onSelectChanged={handleSelectChange}
          />

          <CheckpointList
            checkpointList={selectedCheckpointIds}
            group_id={selectedGroup?.group_id ?? null}
            isDisable={!selectedGroup}
            canEdit={canEdit}
            projectId={selectedProjectId || null}
            onDataChange={handleDataChange}
          />
        </Box>
      </Box>
    </section>
  );
};

export default ManageCheckpointGroup;
import { useCallback, useMemo, useState } from "react";

// Material UI
import Box from "@mui/material/Box";

// Components
import MainTitle from "../components/main-title/MainTitle";
import CheckpointGroupList from "../components/group-list/CheckpointGroupList";
import CheckpointList from "../components/checkpoint-list/CheckpointList";

// i18n
import { useTranslation } from "react-i18next";

// Hooks
import usePageTitle from "../hooks/usePageTitle";

// Types
import type { CheckpointGroup } from "../types/common";

const ManageCheckpointGroup = () => {
  // i18n
  const { t } = useTranslation();

  // Set page title
  usePageTitle(t("pages.manage-checkpoint-group"));

  // State
  const [refreshGroupListKey, setRefreshGroupListKey] = useState(0);
  const [selectedGroup, setSelectedGroup] =
    useState<CheckpointGroup | null>(null);

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

  return (
    <section id="manage-checkpoint-group">
      <Box className="flex flex-col gap-4 p-6">
        <MainTitle title={t("pages.manage-checkpoint-group")} />

        <Box className="grid grid-cols-[30vw_1fr] gap-5">
          <CheckpointGroupList
            selectedGroupId={selectedGroup?.group_id ?? null}
            refreshKey={refreshGroupListKey}
            onSelectChanged={handleSelectChange}
          />

          <CheckpointList
            checkpointList={selectedCheckpointIds}
            group_id={selectedGroup?.group_id ?? null}
            isDisable={!selectedGroup}
            onDataChange={handleDataChange}
          />
        </Box>
      </Box>
    </section>
  );
};

export default ManageCheckpointGroup;
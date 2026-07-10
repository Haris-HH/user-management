import { useMemo, useState } from 'react';

// Material UI
import Box from "@mui/material/Box";

// Components
import MainTitle from '../components/main-title/MainTitle';
import CheckpointGroupList from '../components/group-list/CheckpointGroupList';
import CheckpointList from '../components/checkpoint-list/CheckpointList';

// i18n
import { useTranslation } from 'react-i18next';

// Hooks
import usePageTitle from "../hooks/usePageTitle";

// Types
import type { WatchlistGroup } from "../types/common";

const ManageCheckpointGroup = () => {
  // i18n
  const { t } = useTranslation();

  // Set Page Title
  usePageTitle(t('pages.manage-checkpoint-group'));

  // State
  const [refreshGroupListKey, setRefreshGroupListKey] = useState(0);

  // Data
  const [selectedGroup, setSelectedGroup] = useState<WatchlistGroup | null>(null);
  
  const selectedCheckpointIds = useMemo(() => {
    if (!selectedGroup?.checkpoints) return [];

    if (Array.isArray(selectedGroup.checkpoints)) {
      return selectedGroup.checkpoints;
    }

    return [];
  }, [selectedGroup]);

  const handleSelectChange = (group: WatchlistGroup) => {
    setSelectedGroup(group);
  };

  const handleDataChange = () => {
    setRefreshGroupListKey((prev) => prev + 1);
  };

  return (
    <section id='manage-checkpoint-group'>
      <Box className='p-6 flex flex-col gap-4'>
        {/* Main Title */}
        <MainTitle title={t('pages.manage-checkpoint-group')} />

        <Box className="grid grid-cols-[30vw_1fr] gap-5">
          <CheckpointGroupList 
            onSelectChanged={handleSelectChange}
            refreshKey={refreshGroupListKey}
          />
          <CheckpointList 
            checkpointList={selectedCheckpointIds}
            isDisable={false}
            group_id={selectedGroup?.group_id ?? null}
            onDataChange={handleDataChange}
          />
        </Box>
      </Box>
    </section>
  )
}

export default ManageCheckpointGroup;
import { useMemo, useState } from 'react';

// Material UI
import Box from "@mui/material/Box";

// Components
import GroupList from '../group-list/GroupList';
import UserList from '../user-list/UserList';

// Types
import type { WatchlistGroup } from "../../types/common";

type Props = {
  group_type: "watchlist" | "plate" | "checkpoint";
}

const ManageGroup = ({ group_type }: Props) => {

  // State
  const [refreshGroupListKey, setRefreshGroupListKey] = useState(0);

  // Data
  const [selectedGroup, setSelectedGroup] = useState<WatchlistGroup | null>(null);
  
  const selectedUserIds = useMemo(() => {
    if (!selectedGroup?.members) return [];

    if (Array.isArray(selectedGroup.members)) {
      return selectedGroup.members;
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
    <Box className="grid grid-cols-[30vw_1fr] gap-5">
      <GroupList 
        group_type={group_type}
        onSelectChanged={handleSelectChange}
        refreshKey={refreshGroupListKey}
      />
      <UserList 
        userList={selectedUserIds}
        isDisable={!selectedGroup}
        group_id={selectedGroup?.group_id ?? null}
        onDataChange={handleDataChange}
      />
    </Box>
  )
}

export default ManageGroup;
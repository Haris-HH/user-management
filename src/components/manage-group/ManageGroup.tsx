import { useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";

import GroupList from "../group-list/GroupList";
import UserList from "../user-list/UserList";

import type { WatchlistGroup } from "../../types/common";

export type GroupType = "watchlist" | "plate" | "checkpoint";

type Props = {
  group_type: GroupType;
};

const ManageGroup = ({ group_type }: Props) => {
  const [refreshGroupListKey, setRefreshGroupListKey] = useState(0);
  const [selectedGroup, setSelectedGroup] =
    useState<WatchlistGroup | null>(null);

  const selectedUserIds = useMemo(() => {
    const members = selectedGroup?.members;
    return Array.isArray(members) ? members : [];
  }, [selectedGroup?.members]);

  const handleSelectChange = useCallback(
    (group: WatchlistGroup | null) => {
      setSelectedGroup(group);
    },
    []
  );

  const handleDataChange = useCallback(() => {
    setRefreshGroupListKey((previous) => previous + 1);
  }, []);

  return (
    <Box className="grid grid-cols-[30vw_1fr] gap-5">
      <GroupList
        group_type={group_type}
        selectedGroupId={selectedGroup?.group_id ?? null}
        refreshKey={refreshGroupListKey}
        onSelectChanged={handleSelectChange}
      />

      <UserList
        group_type={group_type}
        group_id={selectedGroup?.group_id ?? null}
        userList={selectedUserIds}
        isDisable={!selectedGroup}
        onDataChange={handleDataChange}
      />
    </Box>
  );
};

export default ManageGroup;
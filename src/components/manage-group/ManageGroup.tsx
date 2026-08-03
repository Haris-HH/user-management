import { useCallback, useMemo, useState } from "react";

import Box from "@mui/material/Box";

import GroupList from "../group-list/GroupList";
import UserList from "../user-list/UserList";

import type { WatchlistGroup } from "../../types/common";

export type GroupType = "watchlist" | "plate" | "checkpoint";

type Props = {
  group_type: GroupType;
  /*
    Passed down rather than read from usePermission here: the same component
    backs three pages (person / plate / checkpoint watch lists) and each has
    its own permission group key.
  */
  canEdit: boolean;
};

const ManageGroup = ({ group_type, canEdit }: Props) => {
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
        canEdit={canEdit}
        onSelectChanged={handleSelectChange}
      />

      <UserList
        group_type={group_type}
        group_id={selectedGroup?.group_id ?? null}
        userList={selectedUserIds}
        isDisable={!selectedGroup}
        canEdit={canEdit}
        onDataChange={handleDataChange}
      />
    </Box>
  );
};

export default ManageGroup;
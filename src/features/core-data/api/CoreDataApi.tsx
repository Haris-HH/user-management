// Types
import type { 
  CameraResponse,
  CheckpointResponse,
  WatchlistGroupResponse,
  CreateWatchlistGroupResponse,
  CreateUserWatchlistGroupResponse,
  UserGroupResponse,
  CheckpointGroupResponse,
} from "../../../types/response";
import type {
  MembersWatchListGroupRequest,
  UserListInGroup,
  CreateWatchlistGroup,
  CameraInGroup,
} from "../../../types/common";

// Api
import { fetchClient } from "../../../api/fetchClient";

// Mocks
import {
  mockCameras
} from "../../../mocks/mockCameras";
import { mockCheckpoint } from "../../../mocks/mockCheckpoints";
import { mockWatchlistGroup } from "../../../mocks/mockWatchGroups";

// Env
const isDev = import.meta.env.VITE_IS_DEV;

export const searchCameras = async (body?: Record<string, string>): Promise<CameraResponse> => {
  if (isDev) {
    return mockCameras;
  }

  const res = await fetchClient<CameraResponse>(
    "/core-data/cameras/search",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );

  return res;
};

export const getCheckpoints = async (param?: Record<string, string>): Promise<CheckpointResponse> => {
  if (isDev) {
    return mockCheckpoint;
  }

  const res = await fetchClient<CheckpointResponse>(
    "/core-data/checkpoints/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const createWatchListGroups = async (body?: Record<string, string>): Promise<CreateWatchlistGroupResponse> => {
  return fetchClient<CreateWatchlistGroupResponse>("/core-data/watch-groups/create", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export const getWatchListGroups = async (param?: Record<string, string>): Promise<WatchlistGroupResponse> => {
  if (isDev) {
    return mockWatchlistGroup;
  }

  const res = await fetchClient<WatchlistGroupResponse>(
    "/core-data/watch-groups/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const deleteWatchListGroups = async (param: Record<string, string[]>): Promise<WatchlistGroupResponse> => {
  return fetchClient<WatchlistGroupResponse>("/core-data/watch-groups/delete", {
    method: "DELETE",
    queryParams: param
  });
}

export const addMembersWatchListGroups = async (body: MembersWatchListGroupRequest): Promise<WatchlistGroupResponse> => {
  return fetchClient<WatchlistGroupResponse>("/core-data/watch-groups/members/add", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export const deleteMembersWatchListGroups = async (body: MembersWatchListGroupRequest): Promise<WatchlistGroupResponse> => {
  return fetchClient<WatchlistGroupResponse>("/core-data/watch-groups/members/remove", {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export const addListSpecialPlates = async (body: UserListInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/watch-groups/special-plates/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeListSpecialPlates = async (body: UserListInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/watch-groups/special-plates/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const addListWatchlists = async (body: UserListInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/watch-groups/watchlists/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeListWatchlists = async (body: UserListInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/watch-groups/watchlists/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const addListCheckpoints = async (body: UserListInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/watch-groups/checkpoints/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeListCheckpoints = async (body: UserListInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/watch-groups/checkpoints/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const getCameraGroup = async (param?: Record<string, string>) => {
  return fetchClient<CheckpointGroupResponse>("/core-data/camera-groups/get", {
    method: "GET",
    queryParams: param,
  });
}

export const createCameraGroup = async (body: CreateWatchlistGroup) => {
  return fetchClient<UserGroupResponse>("/core-data/camera-groups/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const deleteCameraGroup = async (ids: string[]) => {
  return fetchClient<UserGroupResponse>("/core-data/camera-groups/delete", {
    method: "DELETE",
    queryParams: {
      group_ids: ids.toString()
    },
  });
};

export const addCameraInGroup = async (body: CameraInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/camera-groups/cameras/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeCameraInGroup = async (body: CameraInGroup) => {
  return fetchClient<CreateUserWatchlistGroupResponse>("/core-data/camera-groups/cameras/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
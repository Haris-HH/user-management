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
  Camera,
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

/*
  The camera-id list collected from every camera group runs into the
  thousands, so `GET /core-data/cameras/get?filter=camera_id=a|b|c...` blows
  past the URL length the gateway accepts. Cameras are resolved through the
  POST /search endpoint instead — the filter travels in the request body — and
  the ids are split into chunks so no single filter string grows unbounded.
  Each chunk is then paged like every other core-data list.
*/
export const CAMERA_PAGE_LIMIT = 1500;
const CAMERA_ID_CHUNK_SIZE = 500;

const searchAllCameraPages = async (filter: string): Promise<Camera[]> => {
  if (isDev) {
    return mockCameras.data ?? [];
  }

  const firstPage = await searchCameras({
    filter,
    limit: String(CAMERA_PAGE_LIMIT),
    page: "1",
  });

  const rows = [...(firstPage?.data ?? [])];
  const countAll = firstPage?.pagination?.countAll ?? rows.length;
  const maxPage =
    firstPage?.pagination?.maxPage ?? Math.ceil(countAll / CAMERA_PAGE_LIMIT);

  for (let page = 2; page <= maxPage && rows.length < countAll; page++) {
    const nextPage = await searchCameras({
      filter,
      limit: String(CAMERA_PAGE_LIMIT),
      page: String(page),
    });

    const data = nextPage?.data ?? [];

    if (data.length === 0) break;

    rows.push(...data);
  }

  return rows;
};

export const getCamerasByIds = async (
  cameraIds: string[],
  extraFilters: string[] = []
): Promise<Camera[]> => {
  const uniqueIds = [...new Set(cameraIds.filter(Boolean))];

  if (uniqueIds.length === 0) return [];

  const chunks: string[][] = [];

  for (let i = 0; i < uniqueIds.length; i += CAMERA_ID_CHUNK_SIZE) {
    chunks.push(uniqueIds.slice(i, i + CAMERA_ID_CHUNK_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) =>
      searchAllCameraPages(
        [`camera_id=${chunk.join("|")}`, ...extraFilters].join(",")
      )
    )
  );

  // Chunks are requested in parallel and each one is paged, so de-dupe on the
  // way out rather than trusting the backend not to repeat a row.
  const cameraMap = new Map<string, Camera>(
    results.flat().map((camera) => [camera.camera_id, camera])
  );

  return [...cameraMap.values()];
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

// The backend caps this endpoint at 1500 rows per request, so keep paging
// until every row reported by pagination.countAll has been collected.
export const CAMERA_GROUP_PAGE_LIMIT = 1500;

export const getAllCameraGroup = async (
  param?: Record<string, string>
): Promise<CheckpointGroupResponse> => {
  const firstPage = await getCameraGroup({
    ...param,
    limit: String(CAMERA_GROUP_PAGE_LIMIT),
    page: "1",
  });

  const data = [...(firstPage?.data ?? [])];
  const countAll = firstPage?.pagination?.countAll ?? data.length;
  const maxPage =
    firstPage?.pagination?.maxPage ??
    Math.ceil(countAll / CAMERA_GROUP_PAGE_LIMIT);

  for (let page = 2; page <= maxPage && data.length < countAll; page++) {
    const nextPage = await getCameraGroup({
      ...param,
      limit: String(CAMERA_GROUP_PAGE_LIMIT),
      page: String(page),
    });

    const rows = nextPage?.data ?? [];

    if (rows.length === 0) break;

    data.push(...rows);
  }

  return {
    ...firstPage,
    data,
    pagination: firstPage?.pagination
      ? {
          ...firstPage.pagination,
          page: 1,
          limit: data.length,
          count: data.length,
        }
      : undefined,
  };
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
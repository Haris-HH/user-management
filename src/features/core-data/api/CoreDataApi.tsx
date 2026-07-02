// Types
import type { 
  CameraResponse,
  CheckpointResponse,
} from "../../../types/response";

// Api
import { fetchClient } from "../../../api/fetchClient";

// Mocks
import {
  mockCameras
} from "../../../mocks/mockCameras";
import { mockCheckpoint } from "../../../mocks/mockCheckpoints";

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
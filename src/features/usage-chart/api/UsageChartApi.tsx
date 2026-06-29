// Types
import type { TopUsersResponse } from "../../../types/response";

// Api
import { fetchClient } from "../../../api/fetchClient";

// Mocks
import {
  mockTopExternalUsers,
  mockTopInternalUsers,
} from "../../../mocks/mockTopUsers";

// Env
const isDev = import.meta.env.VITE_IS_DEV;

export const getTopUsersChart = async (
  body: Record<string, string>
): Promise<TopUsersResponse> => {
  if (isDev) {
    return body.police_state === "internal"
      ? mockTopInternalUsers
      : mockTopExternalUsers;
  }

  return await fetchClient<TopUsersResponse>(
    "/log-management/access-logs/statistics/user-max-access",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
};
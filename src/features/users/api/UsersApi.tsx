// API
import { fetchClient } from "../../../api/fetchClient";

// Types
import type { 
  UserResponse, 
  UserGroupResponse, 
  UserCreateResponse,
  CreateWatchlistGroupResponse,
  UpdateProfileResponse,
} from "../../../types/response";
import type { 
  CreateUserGroup, 
  UserGroup, 
  CreateUser, 
  UpdateUser, 
  ApproveUser, 
  WatchListIdInUser,
} from "../../../types/common";

export const getUserApi = async (param?: Record<string, string>) => {
  return fetchClient<UserResponse>("/user-management/users/get", {
    method: "GET",
    queryParams: param,
  });
};

export const createUserApi = async (body: CreateUser) => {
  return fetchClient<UserCreateResponse>("/user-management/users/create", {
    method: "POST",
    body: JSON.stringify(body)
  });
};

export const updateUserApi = async (body: UpdateUser) => {
  return fetchClient<UserResponse>("/user-management/users/update", {
    method: "PATCH",
    body: JSON.stringify(body)
  });
};

export const deleteUserApi = async (param: Record<string, string>) => {
  return fetchClient<UserResponse>("/user-management/users/delete", {
    method: "DELETE",
    queryParams: param
  });
};

export const searchUserApi = async (param?: Record<string, string>, body?: Record<string, string>) => {
  return fetchClient<UserResponse>("/user-management/users/search", {
    method: "POST",
    queryParams: param,
    body: JSON.stringify(body),
  });
};

export const approveUserApi = async (body: ApproveUser) => {
  return fetchClient<UserResponse>("/user-management/users/approve", {
    method: "POST",
    body: JSON.stringify(body)
  });
};

export const getUserGroup = async (param?: Record<string, string>) => {
  return fetchClient<UserGroupResponse>("/user-management/user-groups/get", {
    method: "GET",
    queryParams: param
  });
}

export const createUserGroup = async (body: CreateUserGroup) => {
  return fetchClient<UserGroupResponse>("/user-management/user-groups/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const updateUserGroup = async (body: UserGroup) => {
  return fetchClient<UserGroupResponse>("/user-management/user-groups/update", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export const deleteUserGroup = async (ids: string[]) => {
  return fetchClient<UserGroupResponse>("/user-management/user-groups/delete", {
    method: "DELETE",
    queryParams: {
      group_ids: ids.toString()
    },
  });
}

export const addListSpecialPlates = async (body: WatchListIdInUser) => {
  return fetchClient<CreateWatchlistGroupResponse>("/user-management/users/special-plates/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeListSpecialPlates = async (body: WatchListIdInUser) => {
  return fetchClient<CreateWatchlistGroupResponse>("/user-management/users/special-plates/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const addListWatchlists = async (body: WatchListIdInUser) => {
  return fetchClient<CreateWatchlistGroupResponse>("/user-management/users/watchlists/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeListWatchlists = async (body: WatchListIdInUser) => {
  return fetchClient<CreateWatchlistGroupResponse>("/user-management/users/watchlists/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const addListCheckpoints = async (body: WatchListIdInUser) => {
  return fetchClient<CreateWatchlistGroupResponse>("/user-management/users/checkpoints/add", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const removeListCheckpoints = async (body: WatchListIdInUser) => {
  return fetchClient<CreateWatchlistGroupResponse>("/user-management/users/checkpoints/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const requestUpdateProfile = async (param: Record<string, string>) => {
  return fetchClient<UpdateProfileResponse>("/user-management/users/get-police-profile", {
    method: "GET",
    queryParams: param,
  });
}
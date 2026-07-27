/*
  LPR Center group membership.

  Group CRUD and permission storage are NOT duplicated here: LPR Center groups
  are ordinary user groups, so this module reuses
  /user-management/user-groups/{get,create,update} via UsersApi. Only the
  membership relation is new.

  !! BACKEND NOT IMPLEMENTED YET !!
  The three endpoints below do not exist on the server today. They are written
  against the contract documented in LPR_CENTER_BACKEND_REQUIREMENTS.md so the
  UI is complete and typed; every call will fail with a 404 until the backend
  ships them. The page surfaces those failures through the normal error popups
  rather than pretending the calls succeeded.

  A separate relation is required because User.user_group_id holds exactly one
  global group. Writing LPR Center membership into that field would remove the
  user from their user-management group, which the feature explicitly must not
  do.
*/

// Types
import type {
  LprCenterMembersResponse,
  LprCenterMembershipResponse,
} from "../../../types/response";
import type { LprCenterGroupMembersRequest } from "../../../types/common";

// Api
import { fetchClient } from "../../../api/fetchClient";

export const LPR_CENTER_MEMBER_ENDPOINTS = {
  get: "/user-management/lpr-center-groups/members/get",
  add: "/user-management/lpr-center-groups/members/add",
  remove: "/user-management/lpr-center-groups/members/remove",
} as const;

/** Users currently assigned to an LPR Center group. Supports pagination. */
export const getLprCenterGroupMembers = async (
  param: Record<string, string>
): Promise<LprCenterMembersResponse> => {
  return fetchClient<LprCenterMembersResponse>(LPR_CENTER_MEMBER_ENDPOINTS.get, {
    method: "GET",
    queryParams: param,
  });
};

/** Adds users to an LPR Center group without touching any other membership. */
export const addLprCenterGroupMembers = async (
  body: LprCenterGroupMembersRequest
): Promise<LprCenterMembershipResponse> => {
  return fetchClient<LprCenterMembershipResponse>(LPR_CENTER_MEMBER_ENDPOINTS.add, {
    method: "POST",
    body: JSON.stringify(body),
  });
};

/**
 * Removes users from an LPR Center group only. It must never delete the user
 * account nor alter their user-management group or other permissions.
 */
export const removeLprCenterGroupMembers = async (
  body: LprCenterGroupMembersRequest
): Promise<LprCenterMembershipResponse> => {
  return fetchClient<LprCenterMembershipResponse>(LPR_CENTER_MEMBER_ENDPOINTS.remove, {
    method: "POST",
    body: JSON.stringify(body),
  });
};

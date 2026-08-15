export type OptionType = {
  value: string;
  label: string;
  inputValue?: string;
  [key: string]: unknown;
};

export interface AddApproveData {
  id: number;
  prefix: string;
  name: string;
  last_name: string;
  full_name: string;
  position: string;
  position_code: string;
  ou: string;
  bh: string;
  bk: string;
  org: string;
  id_card: string;
  email: string;
  mobile: string;
  created_at: string;
  approve_date: string;
  active_date_time: string;
  un_approve_date: string;
  user_group: string;
  un_approve_reason: string;
  account_status: string;
  update_profile_status: string;
  latest_update_profile_date: string;
  pid: string;
  sub_agency: string[];
  last_login: string;
  remark?: string;
}

export interface UsageCount {
  usageMonthYear: string;
  usageCount: number;
}

export interface GroupMember {
  id: number;
  name: string;
  status: string;
  user_last_active: number;
  user_life_time: number
}

export interface User {
  user_id: string;
  user_group_id: string;
  user_group_name?: string;
  service_channel: ServiceChannel[];
  image_url: string | null;
  username: string;
  title_id: number;
  title?: string;
  firstname: string;
  lastname: string;
  idcard: string;
  phone: string;
  email: string | null;
  position_id: number;
  position: string | null;
  ou_code: string;
  ou_name?: string;
  bh_code: string | null;
  bh_name?: string;
  bk_code: string | null;
  bk_name?: string;
  org_code: string | null;
  org_name?: string;
  account_status: "active" | "inactive";
  approve_status: "pending" | "approved" | "rejected]";
  edit_note: string | null;
  tokens: Tokens;
  permissions: GroupPermissions;
  allowed_checkpoints: unknown[];
  last_login: string | null;
  last_logout: string | null;
  user_lifetime: string | null;
  account_expire: string | null;
  hash_id: string | null;
  last_login_service: string | null;
  last_logout_service: string | null;
  police_profile_status: string | null;
  police_profile_status_datetime: string | null;
  approve_date: string | null;
  active_datetime: string | null;
  remark: string | null;
  details: string | null;
  created_at: string;
  active_at: string;
  updated_at: string;
  approve_at: string;
  approve_by: string;
  active_status: string;
  active_type: string;
  active_by: string;
  sub_unit: string[];
  special_plates: string[];
  watchlists: string[];
  checkpoints: string[];
}

export interface CreateUser {
  user_group_id: string;
  image_url?: string;
  username: string;
  password: string;
  title_id?: number,
  firstname: string;
  lastname: string;
  idcard: string;
  phone: string;
  email: string;
  position_id?: number;
  ou_code: string;
  bh_code?: string;
  bk_code?: string;
  org_code?: string;
  account_expire?: string | null;
  user_lifetime?: number | null;
  permissions: GroupPermissions;
}

export interface UserDetail {
  user_id: string;
  details: string;
}

export interface ApproveUser {
  users: UserDetail[];
  approve_status: string;
  active_type?: string;
  auto_approve_at?: string;
  approve_by: string;
  approve_at: string;
}

export interface UpdateUser {
  user_id: string;
  user_group_id?: string;
  image_url?: string;
  username?: string;
  password?: string;
  title_id?: number,
  position_id?: number,
  firstname?: string;
  lastname?: string;
  idcard?: string;
  phone?: string;
  email?: string;
  ou_code?: string;
  bh_code?: string;
  bk_code?: string;
  org_code?: string;
  account_status?: string;
  details?: string;
  active_status?: string;
  active_by?: string;
  permissions?: GroupPermissions;
  sub_unit?: string[];
  user_lifetime?: string | null;
  account_expire?: string | null;
}

export interface ServiceChannel {
  all: boolean;
}

export interface Tokens {
  refreshToken: string;
  serviceChannel: string;
}

export interface Dropdown {
  code: string;
  name: string;
}

export interface NsbOu {
  ou_code: string;
  ou_codename: string;
  ou_abbr_en: string;
  ou_abbr_th: string;
  ou_name_en: string;
  ou_name_th: string;
  notes: string;
}

export interface NsbBh {
  ou_code: string;
  bh_code: string;
  bh_abbr_en: string | null;
  bh_abbr_th: string;
  bh_name_en: string | null;
  bh_name_th: string;
  notes: string | null;
}

/*
  The English abbreviation/name and notes columns are nullable in the
  masterdata API (see the captured fixtures in src/mocks), so they are typed
  as nullable here rather than pretending they are always present.
*/
export interface NsbBk {
  ou_code: string;
  bh_code: string;
  bk_code: string;
  bk_abbr_en: string | null;
  bk_abbr_th: string;
  bk_name_en: string | null;
  bk_name_th: string;
  notes: string | null;
}

export interface NsbOrg {
  ou_code: string;
  bh_code: string;
  bk_code: string;
  org_code: string;
  org_abbr_en: string | null;
  org_abbr_th: string;
  org_name_en: string | null;
  org_name_th: string;
  quota: number;
  notes: string | null;
}

export interface Province {
  id: number;
  country_id: number;
  province_code: string;
  name_en: string;
  name_th: string;
  geo_region_id: number;
  police_region_id: number;
  visible: number;
  active: number;
}

export interface District {
  id: number;
  district_code: string;
  name_en: string;
  name_th: string;
  zipcode: string;
  visible: boolean;
  active: boolean;
  remark: string;
  province_code: string;
}

export interface Subdistrict {
  id: number;
  province_code: string;
  district_code: string;
  subdistrict_code: string;
  name_en: string;
  name_th: string;
  zipcode: string;
  visible: boolean;
  active: boolean;
  remark: string;
}

export interface LprRegion {
  id: number;
  region_code: string;
  name_en: string;
  name_th: string;
  remark: string | null;
}

export interface Ou {
  ou_code: string;
  ou_codename: string;
  ou_abbr_en: string;
  ou_abbr_th: string;
  ou_name_en: string;
  ou_name_th: string;
  notes: string;
}

export interface Title {
  id: number;
  title_group: string;
  title_en: string;
  title_th: string;
  title_abbr_en: string;
  title_abbr_th: string;
  visible: boolean;
  active: boolean;
  remark: string;
}

/*
  The police-regions endpoint returns no abbreviation columns (see
  src/mocks/mockArea.tsx), and the call sites already fall back to "-",
  so they are optional rather than required-but-absent.
*/
export interface Area {
  id: number;
  title_en: string;
  title_th: string;
  title_abbr_en?: string;
  title_abbr_th?: string;
  visible: boolean;
  active: boolean;
}

export interface Position {
  id: number;
  category: string;
  position_en: string;
  position_th: string;
  active: boolean;
}

export type PermissionMode = "none" | "active" | "edit";

/** One project's checkpoint (camera-group) access grant. */
export interface ProjectCheckpointPermission {
  project_id: string;
  camera_group_ids: string[];
}

export interface GroupPermissions {
  ui?: Record<
    string,
    {
      enabled?: boolean;
      groups?: Record<string, PermissionMode>;
      prints?: Record<string, boolean>;
    }
  >;
  project_id?: ProjectCheckpointPermission[];
}

/*
  A menu catalogue that is a tree rather than a flat list. Only some levels are
  persisted (which ones depends on the screen), so a key here is not necessarily
  a permission key - see `PermissionUiGroup.is_label`.
*/
export interface PermissionMenuNode {
  /** Stable id; for persisted nodes this is the groupKey. Never contains a dot. */
  key: string;
  /** i18n key of the menu label. */
  labelKey: string;
  children?: PermissionMenuNode[];
}

export interface PermissionUiGroup {
  key: string;
  name: string;
  active: boolean;
  edit: boolean;
  /*
    A label row rather than a permission: it carries no controls and is never
    persisted, so its key must be excluded from groups/prints. `depth` decides
    how it reads - a top-level label row is a section heading over the rows
    beneath it (LPR Center), a nested one is a sub-item shown for context under
    a menu that is itself the permission (LPR License Plate).
  */
  is_label?: boolean;
  /** Indent level of the row. Omitted or 0 for a top-level row. */
  depth?: number;
}

export interface PermissionUiList {
  key: string;
  name: string;
  group_list: PermissionUiGroup[];
}

export interface UserGroup {
  group_id: string;
  group_name: string;
  permissions: GroupPermissions;
  login_lifetime: number;
  approved_lifetime: number;
  notes: string;
  locked?: boolean;
}

export type CreateUserGroup = Omit<UserGroup, "group_id">;

export interface Camera {
  camera_id: string;
  camera_name: string;
  camera_ip: string;
  camera_type: string;
  project_id: string;
  center_id: string;
  checkpoint_id: string;
  province_code: string;
  province_name?: string;
  district_code: string;
  subdistrict_code: string;
  route: string | null;
  address: string | null;
  police_region_id: number;
  police_region_name?: string;
  police_station_id: number;
  police_station_name?: string;
  latitude: number;
  longitude: number;
  rtsp_live_url: string;
  rtsp_process_url: string;
  stream_encode_id: number;
  api_server_url: string | null;
  live_server_url: string | null;
  live_stream_url: string;
  detection_area: string;
  streaming: boolean | null;
  visible: boolean;
  active: boolean;
  alive: boolean;
  last_online: string;
  last_check: string;
  response_ms: number;
  deleted: boolean;
  request_delete: boolean;
  request_delete_reason: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  total: number;
}

export interface CameraInCheckpoint {
  group_id: string;
  group_name: string;
  description: string | null;
  /*
    The group's own project, as set at creation time. Null on rows created
    before camera groups carried a project - those still resolve their project
    from their cameras, see resolveCheckpointProjectId.
  */
  project_id: string | null;
  visible: boolean;
  active: boolean;
  camera_list: Camera[];
}

export interface PoliceStation {
  id: number;
  province_name: string;
  station_name: string;
  address: string | null;
  phone: string | null;
  fax: string | null;
  visible: boolean;
  active: boolean;
  notes: string;
  province_code: string;
  district_code: string;
}

export interface Uploaded {
  filename: string;
  originalName: string;
  mimetype: string;
  sizeMB: number;
  title: string;
  path: string;
  url: string;
}

export interface DeleteFileFailed {
  url: string;
  error: string;
}

export interface DeleteFileData {
  deleted: string[];
  notFound: string[];
  forbidden: string[];
  failed: DeleteFileFailed[];
}

export interface DeleteFile {
  data: DeleteFileData;
}

export interface TopUsers {
  rank: number;
  user_id: string;
  title_id?: number;
  title?: string;
  firstname?: string;
  lastname?: string;
  idcard?: string;
  phone?: string;
  username: string;
  ou_code: string;
  ou_name?: string;
  org_code: string;
  months: Record<string, number>;
  total: number;
}

export type ValidateUserDataParams = {
  nationalId?: string;
  phoneNumber?: string;
  firstName?: string;
  lastName?: string;
  ouData?: unknown;
  t: (key: string) => string;
};

export interface Checkpoint {
  checkpoint_id: string;
  checkpoint_name: string;
  checkpoint_ip: string;
  center_id: string;
  center_ip: string;
  project_id: string;
  organization: string;
  province_code: string;
  district_code: string;
  subdistrict_code: string;
  route: string;
  address: string;
  police_region_id: number;
  police_station_id: number;
  latitude: number;
  longitude: number;
  serial_number: string;
  license_key: string;
  officer_title_id: number;
  officer_firstname: string;
  officer_lastname: string;
  officer_position: string;
  officer_phone: string;
  visible: boolean;
  active: boolean;
  deleted: boolean;
  alive: boolean;
  last_online: string;
  last_check: string;
  response_ms: number;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}

export interface Project {
  project_id: string;
  project_name: string;
  description?: string | null;
  visible?: boolean;
  active?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ErrorRespond {
  endpoint: string;
  statusCode: number;
  success: boolean;
  message: string;
}

export interface WatchlistGroup {
  group_id: string;
  group_name: string;
  description: string;
  members: string[];
  special_plates: string[];
  checkpoints: string[];
  watchlists: string[];
  permissions: string[];
  visible: boolean;
  active: boolean;
  deleted: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface CreateWatchlistGroup {
  group_name: string;
  project_id?: string;
}

export interface MembersWatchListGroupRequest {
  group_id: string;
  member_list: string[];
}

/*
  LPR Center group membership is deliberately separate from User.user_group_id:
  a user has exactly one global user group, so reusing that field would evict
  the user from their user-management group. See LprCenterApi for the backend
  contract these types describe.
*/
export interface LprCenterGroupMembersRequest {
  group_id: string;
  user_ids: string[];
}

export interface WatchListIdInUser {
  user_id: string;
  group_id_list?: string[];
}

export interface UserListInGroup {
  group_id: string;
  member_list: string[];
}

export interface CameraInGroup {
  group_id: string;
  camera_id_list: string[];
}

export interface UpdateCamera {
  camera_id: string;
  project_id: string;
}

export interface CheckpointGroup {
  group_id: string;
  group_name: string;
  description: string | null;
  project_id: string | null;
  members: string[];
  cameras: string[];
  visible: boolean;
  active: boolean;
  deleted: boolean;
  created_by: string | null;
  deleted_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  total: number;
}

export interface UpdateProfile {
  idcard: string;
  level_abbr?: string;
  rank_abbr?: string;
  bh_code?: string;
  bk_code?: string;
  org_code?: string;
  name?: string;
  sname?: string;
}
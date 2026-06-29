export type OptionType = {
  value: any;
  label: string;
  [key: string]: any;
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
  active_status: number;
  update_profile_status: string;
  latest_update_profile_date: string;
  pid: string;
  sub_agency: string[];
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
  allowed_checkpoints: any[];
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
  detail: string | null;
  created_at: string;
  updated_at: string;
  sub_unit: string[];
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
  permissions: GroupPermissions;
}

export interface ApproveUser {
  user_id_list: string[];
  approve_status: string;
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
  detail?: string;
  permissions?: GroupPermissions;
  sub_unit?: string[];
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

export interface NsbBk {
  ou_code: string;
  bh_code: string;
  bk_code: string;
  bk_abbr_en: string;
  bk_abbr_th: string;
  bk_name_en: string;
  bk_name_th: string;
  notes: string;
}

export interface NsbOrg {
  ou_code: string;
  bh_code: string;
  bk_code: string;
  org_code: string;
  org_abbr_en: string;
  org_abbr_th: string;
  org_name_en: string;
  org_name_th: string;
  quota: number;
  notes: string;
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

export interface Area {
  id: number;
  title_en: string;
  title_th: string;
  title_abbr_en: string;
  title_abbr_th: string;
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

export interface GroupPermissions {
  ui?: Record<
    string,
    {
      enabled?: boolean;
      groups?: Record<string, PermissionMode>;
      prints?: Record<string, boolean>;
    }
  >;
  checkpoint_ids?: string[];
}

export interface PermissionUiGroup {
  key: string;
  name: string;
  active: boolean;
  edit: boolean;
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

export interface CreateUserGroup extends Omit<UserGroup, "group_id"> {}

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
  id: number;
  title_en: string;
  title_th: string;
  title_abbr_en: string;
  title_abbr_th: string;
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
// Types
import type { 
  TopUsers,
  Area,
  Dropdown,
  User,
  NsbOu,
  NsbBh,
  NsbBk,
  NsbOrg,
  Province,
  District,
  Subdistrict,
  Title,
  LprRegion,
  Position,
  UserGroup,
  Camera,
  PoliceStation,
  Uploaded,
  DeleteFile,
  Checkpoint,
} from "../types/common";

export interface DropdownResponse {
  data: Dropdown[];
}

export interface UsersResponse {
  messages: string;
  results: User[];
  status: string;
  total_matches: number;
  total: number;
}

export interface TitleResponse extends BasicResponse<Title[]> {}

export interface CreateTitleResponse extends BasicResponse<Title> {}

export interface UserResponse extends BasicResponse<User[]> {}

export interface UserCreateResponse extends BasicResponse<User> {}

export interface NsbOuResponse extends BasicResponse<NsbOu[]> {}

export interface NsbBhResponse extends BasicResponse<NsbBh[]> {}

export interface NsbBkResponse extends BasicResponse<NsbBk[]> {}

export interface NsbOrgResponse extends BasicResponse<NsbOrg[]> {}

export interface ProvinceResponse extends BasicResponse<Province[]> {}

export interface DistrictResponse extends BasicResponse<District[]> {}

export interface SubdistrictResponse extends BasicResponse<Subdistrict[]> {}

export interface AreaResponse extends BasicResponse<Area[]> {}

export interface LprRegionResponse extends BasicResponse<LprRegion[]> {}

export interface PositionResponse extends BasicResponse<Position[]> {}

export interface CreatePositionResponse extends BasicResponse<Position> {}

export interface UserGroupResponse extends BasicResponse<UserGroup[]> {}

export interface CameraResponse extends BasicResponse<Camera[]> {}

export interface PoliceStationResponse extends BasicResponse<PoliceStation[]> {}

export interface StatusResponse extends BasicResponse<Dropdown[]> {}

export interface UploadedResponse extends BasicResponse<Uploaded[]> {}

export interface DeleteFileResponse extends BasicResponse<DeleteFile[]> {}

export interface TopUsersResponse extends BasicResponse<TopUsers[]> {}

export interface CheckpointResponse extends BasicResponse<Checkpoint[]> {}

export interface BasicResponse<T> {
  endpoint: string;
  message: string;
  statusCode: number;
  status: string;
  success: boolean;
  pagination?: Pagination;
  data: T;
}

export interface Pagination {
  page: number;
  maxPage: number;
  limit: number | string;
  count: number;
  countAll: number;
}
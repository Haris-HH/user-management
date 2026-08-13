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
  WatchlistGroup,
  WatchListIdInUser,
  UserListInGroup,
  CheckpointGroup,
  UpdateProfile,
  Project,
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

export type TitleResponse = BasicResponse<Title[]>;

export type CreateTitleResponse = BasicResponse<Title>;

export type UserResponse = BasicResponse<User[]>;

export type UserCreateResponse = BasicResponse<User>;

export type NsbOuResponse = BasicResponse<NsbOu[]>;

export type NsbBhResponse = BasicResponse<NsbBh[]>;

export type NsbBkResponse = BasicResponse<NsbBk[]>;

export type NsbOrgResponse = BasicResponse<NsbOrg[]>;

export type ProvinceResponse = BasicResponse<Province[]>;

export type DistrictResponse = BasicResponse<District[]>;

export type SubdistrictResponse = BasicResponse<Subdistrict[]>;

export type AreaResponse = BasicResponse<Area[]>;

export type LprRegionResponse = BasicResponse<LprRegion[]>;

export type PositionResponse = BasicResponse<Position[]>;

export type CreatePositionResponse = BasicResponse<Position>;

export type UserGroupResponse = BasicResponse<UserGroup[]>;

export type WatchListIdInUserResponse = BasicResponse<WatchListIdInUser[]>;

export type CameraResponse = BasicResponse<Camera[]>;

export type CameraUpdateResponse = BasicResponse<Camera>;

export type PoliceStationResponse = BasicResponse<PoliceStation[]>;

export type StatusResponse = BasicResponse<Dropdown[]>;

export type UploadedResponse = BasicResponse<Uploaded[]>;

export type DeleteFileResponse = BasicResponse<DeleteFile[]>;

export type TopUsersResponse = BasicResponse<TopUsers[]>;

export type CheckpointResponse = BasicResponse<Checkpoint[]>;

export type CreateWatchlistGroupResponse = BasicResponse<WatchlistGroup>;

export type CreateUserWatchlistGroupResponse = BasicResponse<UserListInGroup>;

export type WatchlistGroupResponse = BasicResponse<WatchlistGroup[]>;

export type CheckpointGroupResponse = BasicResponse<CheckpointGroup[]>;

export type ProjectResponse = BasicResponse<Project[]>;

export type UpdateProfileResponse = BasicResponse<UpdateProfile>;

export type LprCenterMembersResponse = BasicResponse<User[]>;

export type LprCenterMembershipResponse = BasicResponse<null>;

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
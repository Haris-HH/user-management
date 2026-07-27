// Types
import type {
  AreaResponse,
  ProvinceResponse,
  DistrictResponse,
  SubdistrictResponse,
  NsbOuResponse,
  NsbBhResponse,
  NsbBkResponse,
  NsbOrgResponse,
  TitleResponse,
  LprRegionResponse,
  PositionResponse,
  UserGroupResponse,
  CameraResponse,
  PoliceStationResponse,
  CreatePositionResponse,
  CreateTitleResponse,
} from "../../../types/response";
import type {
  Dropdown
} from "../../../types/common";

// Api
import { fetchClient } from "../../../api/fetchClient";

// Mocks
import { mockArea } from "../../../mocks/mockArea";
import { mockAgency } from "../../../mocks/mockAgency";
import { mockBh } from "../../../mocks/mockBh";
import { mockBk } from "../../../mocks/mockBk";
import { mockOrg } from "../../../mocks/mockOrg";
import { mockProvince } from "../../../mocks/mockProvince";
import { mockDistrict } from "../../../mocks/mockDistricts";
import { mockSubdistrict } from "../../../mocks/mockSubDistricts";
import { mockTitle } from "../../../mocks/mockTitle";
import { mockLprRegion } from "../../../mocks/mockLprRegions";
import { mockPosition } from "../../../mocks/mockPositions";
import { mockUserGroup } from "../../../mocks/mockUserGroups";
import { mockCameras } from "../../../mocks/mockCameras";
import { mockPoliceStation } from "../../../mocks/mockPoliceStations";
import { mockStatus } from "../../../mocks/mockStatus";

// Env
const isDev = import.meta.env.VITE_IS_DEV;

/*
  Every masterdata lookup is the same GET-with-query-params call that falls
  back to a fixture when VITE_IS_DEV is set, so the fetchers are generated
  from one factory rather than repeated per endpoint.
*/
const createGetter =
  <T,>(endpoint: string, mock: T) =>
  async (param?: Record<string, string>): Promise<T> => {
    if (isDev) {
      return mock;
    }

    return fetchClient<T>(endpoint, {
      method: "GET",
      queryParams: param,
    });
  };

export const getArea = createGetter<AreaResponse>(
  "/masterdata/police-regions/get",
  mockArea
);

export const getCameras = createGetter<CameraResponse>(
  "/core-data/cameras/get",
  mockCameras
);

export const getAgency = createGetter<NsbOuResponse>(
  "/masterdata/nsb-ou/get",
  mockAgency
);

export const getBh = createGetter<NsbBhResponse>(
  "/masterdata/nsb-bh/get",
  mockBh
);

export const getBk = createGetter<NsbBkResponse>(
  "/masterdata/nsb-bk/get",
  mockBk
);

export const getOrg = createGetter<NsbOrgResponse>(
  "/masterdata/nsb-org/get",
  mockOrg
);

export const getProvince = createGetter<ProvinceResponse>(
  "/masterdata/provinces/get",
  mockProvince
);

export const getDistrict = createGetter<DistrictResponse>(
  "/masterdata/districts/get",
  mockDistrict
);

export const getSubdistrict = createGetter<SubdistrictResponse>(
  "/masterdata/subdistricts/get",
  mockSubdistrict
);

export const getTitle = createGetter<TitleResponse>(
  "/masterdata/person-titles/get",
  mockTitle
);

export const getLprRegion = createGetter<LprRegionResponse>(
  "/masterdata/lpr-regions/get",
  mockLprRegion
);

export const getPosition = createGetter<PositionResponse>(
  "/masterdata/person-positions/get",
  mockPosition
);

export const getUserGroup = createGetter<UserGroupResponse>(
  "/user-management/user-groups/get",
  mockUserGroup
);

export const getPoliceStation = createGetter<PoliceStationResponse>(
  "/masterdata/police-stations/get",
  mockPoliceStation
);

export const createTitle = async (
  body?: Record<string, string>
): Promise<CreateTitleResponse> => {
  return fetchClient<CreateTitleResponse>("/masterdata/person-titles/create", {
    method: "POST",
    body: JSON.stringify(body),
  });
};

export const createPosition = async (
  body?: Record<string, string>
): Promise<CreatePositionResponse> => {
  return fetchClient<CreatePositionResponse>(
    "/masterdata/person-positions/create",
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
};

export const getStatus = async (): Promise<Dropdown[]> => {
  return mockStatus;
};

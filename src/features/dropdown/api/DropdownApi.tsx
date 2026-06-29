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

export const getArea = async (param?: Record<string, string>): Promise<AreaResponse> => {
  if (isDev) {
    return mockArea;
  }

  const res = await fetchClient<AreaResponse>(
    "/masterdata/police-regions/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getCameras = async (param?: Record<string, string>): Promise<CameraResponse> => {
  if (isDev) {
    return mockCameras;
  }

  const res = await fetchClient<CameraResponse>(
    "/core-data/cameras/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getAgency = async (param?: Record<string, string>): Promise<NsbOuResponse> => {
  if (isDev) {
    return mockAgency;
  }

  const res = await fetchClient<NsbOuResponse>(
    "/masterdata/nsb-ou/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getBh = async (param?: Record<string, string>): Promise<NsbBhResponse> => {
  if (isDev) {
    return mockBh;
  }

  const res = await fetchClient<NsbBhResponse>(
    "/masterdata/nsb-bh/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getBk = async (param?: Record<string, string>): Promise<NsbBkResponse> => {
  if (isDev) {
    return mockBk;
  }

  const res = await fetchClient<NsbBkResponse>(
    "/masterdata/nsb-bk/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
}; 

export const getOrg = async (param?: Record<string, string>): Promise<NsbOrgResponse> => {
  if (isDev) {
    return mockOrg;
  }

  const res = await fetchClient<NsbOrgResponse>(
    "/masterdata/nsb-org/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getProvince = async (param?: Record<string, string>): Promise<ProvinceResponse> => {
  if (isDev) {
    return mockProvince;
  }

  const res = await fetchClient<ProvinceResponse>(
    "/masterdata/provinces/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getDistrict = async (param?: Record<string, string>): Promise<DistrictResponse> => {
  if (isDev) {
    return mockDistrict;
  }

  const res = await fetchClient<DistrictResponse>(
    "/masterdata/districts/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getSubdistrict = async (param?: Record<string, string>): Promise<SubdistrictResponse> => {
  if (isDev) {
    return mockSubdistrict;
  }

  const res = await fetchClient<SubdistrictResponse>(
    "/masterdata/subdistricts/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const createTitle = async (body?: Record<string, string>): Promise<CreateTitleResponse> => {
  const res = await fetchClient<CreateTitleResponse>(
    "/masterdata/person-titles/create",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  
  return res;
};

export const getTitle = async (param?: Record<string, string>): Promise<TitleResponse> => {
  if (isDev) {
    return mockTitle;
  }

  const res = await fetchClient<TitleResponse>(
    "/masterdata/person-titles/get",
    {
      method: "GET",
      queryParams: param,
    },
  );
  
  return res;
};

export const getLprRegion = async (param?: Record<string, string>): Promise<LprRegionResponse> => {
  if (isDev) {
    return mockLprRegion;
  }

  const res = await fetchClient<LprRegionResponse>(
    "/masterdata/lpr-regions/get",
    {
      method: "GET",
      queryParams: param,
    },
  );
  
  return res;
};

export const createPosition = async (body?: Record<string, string>): Promise<CreatePositionResponse> => {
  const res = await fetchClient<CreatePositionResponse>(
    "/masterdata/person-positions/create",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
  
  return res;
};

export const getPosition = async (param?: Record<string, string>): Promise<PositionResponse> => {
  if (isDev) {
    return mockPosition;
  }

  const res = await fetchClient<PositionResponse>(
    "/masterdata/person-positions/get",
    {
      method: "GET",
      queryParams: param,
    },
  );
  
  return res;
};

export const getUserGroup = async (param?: Record<string, string>): Promise<UserGroupResponse> => {
  if (isDev) {
    return mockUserGroup;
  }

  const res = await fetchClient<UserGroupResponse>(
    "/user-management/user-groups/get",
    {
      method: "GET",
      queryParams: param,
    },
  );
  
  return res;
};

export const getPoliceStation = async (param?: Record<string, string>): Promise<PoliceStationResponse> => {
  if (isDev) {
    return mockPoliceStation;
  }

  const res = await fetchClient<PoliceStationResponse>(
    "/masterdata/police-stations/get",
    {
      method: "GET",
      queryParams: param,
    },
  );

  return res;
};

export const getStatus = async (): Promise<Dropdown[]> => {
  return mockStatus;
};
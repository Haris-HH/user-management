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
  Dropdown,
  PoliceStation
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

const policeStationCache = new Map<string, PoliceStation>();

const requestPoliceStation = createGetter<PoliceStationResponse>(
  "/masterdata/police-stations/get",
  mockPoliceStation
);

/*
  Every police-station response seeds `policeStationCache`, whoever asked for
  it. The whole table is 1,484 rows against a 2,000-row page limit, so the
  login-time load in `App.tsx` pulls all of it in one request and every later
  id lookup is then answered from memory. Names are cached for the life of
  the tab; a station renamed mid-session needs a reload.
*/
export const getPoliceStation = async (
  param?: Record<string, string>
): Promise<PoliceStationResponse> => {
  const res = await requestPoliceStation(param);

  (res.data ?? []).forEach((station) =>
    policeStationCache.set(String(station.id), station)
  );

  return res;
};

/*
  Cameras only carry `police_station_id`, so every camera table has to turn
  ids into names. Resolving them one request per row is what made those
  tables slow — a group of 200 cameras fired 200 GETs. Ids are deduped and
  answered from the cache above, which the login-time load has normally
  already filled; the network is touched only for ids it does not hold (a
  station created after login, or a lookup that beat the login request).
  Those go out chunked, so the query string cannot grow past what the
  gateway accepts, and with an explicit `limit` because the endpoint pages
  at 10 rows by default.
*/
const POLICE_STATION_ID_CHUNK_SIZE = 200;

export const getPoliceStationMap = async (
  stationIds: Array<string | number | null | undefined>
): Promise<Map<string, PoliceStation>> => {
  const wantedIds = [
    ...new Set(
      stationIds
        .map((id) => (id === null || id === undefined ? "" : String(id)))
        .filter((id) => id !== "" && id !== "null" && id !== "undefined")
    ),
  ];

  const missingIds = wantedIds.filter((id) => !policeStationCache.has(id));

  if (missingIds.length > 0) {
    const chunks: string[][] = [];

    for (let i = 0; i < missingIds.length; i += POLICE_STATION_ID_CHUNK_SIZE) {
      chunks.push(missingIds.slice(i, i + POLICE_STATION_ID_CHUNK_SIZE));
    }

    // getPoliceStation fills the cache with whatever comes back.
    await Promise.all(
      chunks.map((chunk) =>
        getPoliceStation({
          filter: `id=${chunk.join("|")}`,
          limit: String(chunk.length),
        })
      )
    );
  }

  /* Only the ids that were asked for — the dev fixtures answer every filter
     with the whole list, and callers key their rows off this map. */
  const resolved = new Map<string, PoliceStation>();

  wantedIds.forEach((id) => {
    const station = policeStationCache.get(id);

    if (station) {
      resolved.set(id, station);
    }
  });

  return resolved;
};

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

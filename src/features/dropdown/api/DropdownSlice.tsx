import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { ActionReducerMapBuilder, AsyncThunk } from "@reduxjs/toolkit";

// Types
import type {
  PositionResponse,
  ProvinceResponse,
  DistrictResponse,
  SubdistrictResponse,
  NsbOuResponse,
  NsbBhResponse,
  NsbBkResponse,
  NsbOrgResponse,
  TitleResponse,
  LprRegionResponse,
  AreaResponse,
  UserGroupResponse,
  PoliceStationResponse,
} from "../../../types/response";
import type {
  Dropdown
} from "../../../types/common";

// API
import {
  getArea,
  getAgency,
  getBh,
  getBk,
  getOrg,
  getProvince,
  getDistrict,
  getSubdistrict,
  getTitle,
  getLprRegion,
  getPosition,
  getUserGroup,
  getPoliceStation,
  getStatus,
} from "./DropdownApi";

interface DropdownState {
  area: AreaResponse["data"];
  agency: NsbOuResponse["data"];
  bh: NsbBhResponse["data"];
  bk: NsbBkResponse["data"];
  org: NsbOrgResponse["data"];
  province: ProvinceResponse["data"];
  district: DistrictResponse["data"];
  subdistrict: SubdistrictResponse["data"];
  title: TitleResponse["data"];
  lprRegion: LprRegionResponse["data"];
  position: PositionResponse["data"];
  userGroup: UserGroupResponse["data"];
  policeStation: PoliceStationResponse["data"];
  status: Dropdown[];
  loading: boolean;
  error: string | null;
}

// Initial State
const initialState: DropdownState = {
  area: [],
  agency: [],
  bh: [],
  bk: [],
  org: [],
  province: [],
  district: [],
  subdistrict: [],
  title: [],
  lprRegion: [],
  position: [],
  userGroup: [],
  policeStation: [],
  status: [],
  loading: false,
  error: null,
};

type DropdownParams = Record<string, string> | undefined;

const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong";
};

/*
  Each masterdata list is loaded by the same pending/fulfilled/rejected
  thunk, so both the thunks and their reducers are generated from a single
  definition. This keeps the state key and its loader in one place — the
  previous hand-written version silently omitted the reducers for district,
  subdistrict and lprRegion, so those thunks resolved but never stored
  anything in the slice.
*/
const createDropdownThunk = <K extends keyof DropdownState>(
  key: K,
  loader: (param?: Record<string, string>) => Promise<{ data: DropdownState[K] }>
) =>
  createAsyncThunk<DropdownState[K], DropdownParams, { rejectValue: string }>(
    `dropdown/fetch${key.charAt(0).toUpperCase()}${key.slice(1)}`,
    async (param = undefined, { rejectWithValue }) => {
      try {
        const { data } = await loader(param);
        return data;
      } catch (err) {
        return rejectWithValue(getErrorMessage(err));
      }
    }
  );

// Thunks
export const fetchArea = createDropdownThunk("area", getArea);
export const fetchAgency = createDropdownThunk("agency", getAgency);
export const fetchBh = createDropdownThunk("bh", getBh);
export const fetchBk = createDropdownThunk("bk", getBk);
export const fetchOrg = createDropdownThunk("org", getOrg);
export const fetchProvince = createDropdownThunk("province", getProvince);
export const fetchDistrict = createDropdownThunk("district", getDistrict);
export const fetchSubdistrict = createDropdownThunk("subdistrict", getSubdistrict);
export const fetchTitle = createDropdownThunk("title", getTitle);
export const fetchLprRegion = createDropdownThunk("lprRegion", getLprRegion);
export const fetchPosition = createDropdownThunk("position", getPosition);
export const fetchUserGroup = createDropdownThunk("userGroup", getUserGroup);
export const fetchPoliceStation = createDropdownThunk("policeStation", getPoliceStation);

export const fetchStatus = createAsyncThunk<
  Dropdown[],
  void,
  { rejectValue: string }
>("dropdown/fetchStatus", async (_, { rejectWithValue }) => {
  try {
    return await getStatus();
  } catch (err) {
    return rejectWithValue(getErrorMessage(err));
  }
});

type DropdownThunk<K extends keyof DropdownState> = AsyncThunk<
  DropdownState[K],
  DropdownParams,
  { rejectValue: string }
>;

const dropdownThunks = {
  area: fetchArea,
  agency: fetchAgency,
  bh: fetchBh,
  bk: fetchBk,
  org: fetchOrg,
  province: fetchProvince,
  district: fetchDistrict,
  subdistrict: fetchSubdistrict,
  title: fetchTitle,
  lprRegion: fetchLprRegion,
  position: fetchPosition,
  userGroup: fetchUserGroup,
  policeStation: fetchPoliceStation,
} as const;

// Slice
const dropdownSlice = createSlice({
  name: "dropdown",
  initialState,
  reducers: {},
  extraReducers: (builder: ActionReducerMapBuilder<DropdownState>) => {
    (Object.keys(dropdownThunks) as Array<keyof typeof dropdownThunks>).forEach(
      (key) => {
        const thunk = dropdownThunks[key] as DropdownThunk<typeof key>;

        builder
          .addCase(thunk.pending, (state) => {
            state.loading = true;
            state.error = null;
          })
          .addCase(thunk.fulfilled, (state, action) => {
            state.loading = false;
            (state[key] as DropdownState[typeof key]) = action.payload;
          })
          .addCase(thunk.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload ?? "Something went wrong";
          });
      }
    );

    builder
      .addCase(fetchStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload;
      })
      .addCase(fetchStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong";
      });
  },
});

export default dropdownSlice.reducer;

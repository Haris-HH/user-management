import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";

// Types
import type { User } from "../types/common";

// i18n
import { useTranslation } from "react-i18next";

// Utils
import {
  capitalizeWords,
  formatPhone,
  formatThaiID,
} from "../utils/commonFunctions";

// Store
import type { RootState } from "../store/store";

/*
  A user row with every value the tables render already resolved. The masterdata
  lookups (title / agency / bh / bk / org / user group) and the string
  formatting used to happen inside the row renderer, so they re-ran for every
  row on every keystroke, page change and checkbox toggle. Doing them once per
  fetched row instead keeps the render path down to reading fields.
*/
export interface DisplayUser extends User {
  /** `<title> <firstname> <lastname>`, capitalised. */
  full_name: string;
  phone_display: string;
  idcard_display: string;
  /** The agency this user belongs to is the internal police OU. */
  is_internal_police: boolean;
  /*
    Lowercased haystack for client-side search. Built once per row so the
    filter is a plain `includes` rather than a rebuild-and-lowercase per
    keystroke. Superset of the fields the user list used to search.
  */
  search_index: string;
}

const pickLabel = (
  isThai: boolean,
  th: string | null | undefined,
  en: string | null | undefined
) => (isThai ? th : en) ?? "-";

/*
  Builds the masterdata lookup maps once from the dropdown slice and returns a
  mapper whose identity only changes when those lists or the language change.

  Keeping this out of the fetch callback is the point: while the mapping lived
  inside `fetchData`, every masterdata list that resolved after mount - and
  every language switch - invalidated the callback and fired the whole user
  request again.
*/
export const useUserDisplayMapper = () => {
  const { i18n } = useTranslation();

  // One selector per field so a component doesn't re-render on every unrelated
  // dropdown update (a burst of thunks fires on login).
  const title = useSelector((state: RootState) => state.dropdown.title);
  const agency = useSelector((state: RootState) => state.dropdown.agency);
  const bh = useSelector((state: RootState) => state.dropdown.bh);
  const bk = useSelector((state: RootState) => state.dropdown.bk);
  const org = useSelector((state: RootState) => state.dropdown.org);
  const userGroup = useSelector((state: RootState) => state.dropdown.userGroup);

  const titleMap = useMemo(
    () => new Map(title.map((item) => [item.id, item])),
    [title]
  );

  const agencyMap = useMemo(
    () => new Map(agency.map((item) => [item.ou_code, item])),
    [agency]
  );

  const bhMap = useMemo(
    () => new Map(bh.map((item) => [item.bh_code, item])),
    [bh]
  );

  const bkMap = useMemo(
    () => new Map(bk.map((item) => [item.bk_code, item])),
    [bk]
  );

  const orgMap = useMemo(
    () => new Map(org.map((item) => [item.org_code, item])),
    [org]
  );

  const userGroupMap = useMemo(
    () => new Map(userGroup.map((item) => [item.group_id, item])),
    [userGroup]
  );

  const isThai = i18n.language === "th";

  return useCallback(
    (users: User[]): DisplayUser[] => {
      if (users.length === 0) return [];

      return users.map((user) => {
        const titleData = user.title_id ? titleMap.get(user.title_id) : null;
        const agencyData = user.ou_code ? agencyMap.get(user.ou_code) : null;
        const bhData = user.bh_code ? bhMap.get(user.bh_code) : null;
        const bkData = user.bk_code ? bkMap.get(user.bk_code) : null;
        const orgData = user.org_code ? orgMap.get(user.org_code) : null;
        const userGroupData = user.user_group_id
          ? userGroupMap.get(user.user_group_id)
          : null;

        const titleName = titleData
          ? pickLabel(isThai, titleData.title_abbr_th, titleData.title_abbr_en)
          : "";
        const ouName = agencyData
          ? pickLabel(isThai, agencyData.ou_abbr_th, agencyData.ou_abbr_en)
          : "-";
        const bhName = bhData
          ? pickLabel(isThai, bhData.bh_abbr_th, bhData.bh_abbr_en)
          : "-";
        const bkName = bkData
          ? pickLabel(isThai, bkData.bk_abbr_th, bkData.bk_abbr_en)
          : "-";
        const orgName = orgData
          ? pickLabel(isThai, orgData.org_abbr_th, orgData.org_abbr_en)
          : "-";
        const userGroupName = capitalizeWords(userGroupData?.group_name ?? "");

        const fullName = capitalizeWords(
          `${titleName} ${user.firstname ?? ""} ${user.lastname ?? ""}`
        );
        const phoneDisplay = formatPhone(user.phone);

        return {
          ...user,
          title: titleName,
          ou_name: ouName,
          bh_name: bhName,
          bk_name: bkName,
          org_name: orgName,
          user_group_name: userGroupName,
          full_name: fullName,
          phone_display: phoneDisplay,
          idcard_display: formatThaiID(user.idcard),
          is_internal_police: agencyData?.ou_codename === "police",
          search_index: [
            fullName,
            ouName,
            orgName,
            userGroupName,
            user.phone,
            phoneDisplay,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase(),
        };
      });
    },
    [titleMap, agencyMap, bhMap, bkMap, orgMap, userGroupMap, isThai]
  );
};

export default useUserDisplayMapper;

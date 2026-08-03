import { useMemo } from "react";
import { useSelector } from "react-redux";

// Material UI
import HomeIcon from "@mui/icons-material/Home";
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import GroupsIcon from '@mui/icons-material/Groups';
import EditRoadIcon from '@mui/icons-material/EditRoad';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// Types
import type { GroupPermissions } from "../types/common";

// Constants
import { USER_MANAGEMENT_UI_KEY } from "../constants/permissions";

// Store
import type { RootState } from "../store/store";

// i18n
import { useTranslation } from "react-i18next";

export type DockSubMenuItem = {
  label: string;
  path: string;
  /** Service the page belongs to - `permission.ui[uiKey]`. */
  uiKey: string;
  /** Page key inside that service - `permission.ui[uiKey].groups[groupKey]`. */
  groupKey: string;
};

export type DockItem = {
  icon: React.ReactNode;
  label: string;
  path?: string;
  subMenu?: DockSubMenuItem[];
};

/*
  Same rule as usePermission's `canView`, but applied to many keys at once so a
  hook cannot be called per menu entry: the service must be enabled and the page
  must be granted at "active" or "edit". "none" - or a key the server never sent
  - hides the entry.
*/
const canViewGroup = (
  ui: GroupPermissions["ui"],
  uiKey: string,
  groupKey: string
): boolean => {
  const uiPermission = ui?.[uiKey];

  if (uiPermission?.enabled !== true) return false;

  const mode = uiPermission.groups?.[groupKey] ?? "none";

  return mode === "active" || mode === "edit";
};

/*
  A menu entry is active when it *is* the current page, or when it owns it.
  Shared by every navigation shape (sidebar, top menu) so they agree on which
  entry to highlight.
*/
export const isDockItemActive = (item: DockItem, pathname: string): boolean => {
  return item.path === pathname || !!item.subMenu?.some((sub) => sub.path === pathname);
};

export const useDockItems = (): DockItem[] => {
  // i18n
  const { t, i18n } = useTranslation();

  /*
    Only the `ui` branch is selected, not the whole authUser slice, so an
    unrelated profile update does not rebuild every navigation surface.
  */
  // Redux
  const uiPermissions = useSelector(
    (state: RootState) => state.authUser.user?.permission?.ui
  );

  return useMemo(
    () => {
      const items: DockItem[] = [
        {
          icon: <HomeIcon sx={{ color: "var(--primary-color)" }} />,
          label: t("dock.home"),
          path: "/",
        },
        {
          icon: <GppMaybeIcon sx={{ color: "var(--primary-color)" }} />,
          label: t("dock.manage-user"),
          subMenu: [
            { label: t("menu.add-approve-user"), path: "/add-approve-user", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "add-approve-user" },
            { label: t("menu.user-group-management"), path: "/user-group-management", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "user-group-management" },
            { label: t("menu.manage-user"), path: "/manage-user", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "manage-user" },
          ],
        },
        {
          icon: <GroupsIcon sx={{ color: "var(--primary-color)" }} />,
          label: t("dock.manage-watch-list"),
          subMenu: [
            { label: t("menu.manage-watch-list-person"), path: "/manage-watch-list-person", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "manage-watch-list-person" },
            { label: t("menu.manage-watch-list-plate"), path: "/manage-watch-list-plate", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "manage-watch-list-plate" },
            { label: t("menu.manage-watch-list-checkpoint"), path: "/manage-watch-list-checkpoint", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "manage-watch-list-checkpoint" },
          ],
        },
        {
          icon: <EditRoadIcon sx={{ color: "var(--primary-color)" }} />,
          label: t("dock.manage-checkpoint-data"),
          subMenu: [
            { label: t("menu.manage-checkpoint-group"), path: "/manage-checkpoint-group", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "manage-checkpoint-group" },
          ],
        },
        {
          icon: <AnalyticsIcon sx={{ color: "var(--primary-color)" }} />,
          label: t("dock.statistics"),
          subMenu: [
            { label: t("menu.statistics"), path: "/statistic-top-users", uiKey: USER_MANAGEMENT_UI_KEY, groupKey: "statistics" },
          ],
        },
      ];

      /*
        Entries the user cannot open are dropped rather than disabled, and a
        parent whose children are all gone disappears with them - an empty
        dropdown reads as a broken menu. Entries without a subMenu (Home) carry
        no permission and are always kept.
      */
      return items.flatMap((item) => {
        if (!item.subMenu) return [item];

        const subMenu = item.subMenu.filter((sub) =>
          canViewGroup(uiPermissions, sub.uiKey, sub.groupKey)
        );

        return subMenu.length ? [{ ...item, subMenu }] : [];
      });
    },
    // Translations load asynchronously over XHR, so language and the
    // initialised flag are kept as explicit deps to guarantee the labels are
    // rebuilt once the bundle arrives, even if `t` keeps its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language, i18n.isInitialized, uiPermissions]
  )
};
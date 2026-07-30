import { useMemo } from "react";

// Material UI
import HomeIcon from "@mui/icons-material/Home";
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import GroupsIcon from '@mui/icons-material/Groups';
import EditRoadIcon from '@mui/icons-material/EditRoad';
import AnalyticsIcon from '@mui/icons-material/Analytics';

// i18n
import { useTranslation } from "react-i18next";

export type DockSubMenuItem = {
  label: string;
  path: string;
};

export type DockItem = {
  icon: React.ReactNode;
  label: string;
  path?: string;
  subMenu?: DockSubMenuItem[];
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

  return useMemo(
    () => [
      {
        icon: <HomeIcon sx={{ color: "var(--primary-color)" }} />,
        label: t("dock.home"),
        path: "/",
      },
      {
        icon: <GppMaybeIcon sx={{ color: "var(--primary-color)" }} />,
        label: t("dock.manage-user"),
        subMenu: [
          { label: t("menu.add-approve-user"), path: "/add-approve-user" },
          { label: t("menu.user-group-management"), path: "/user-group-management" },
          { label: t("menu.manage-user"), path: "/manage-user" },
        ],
      },
      {
        icon: <GroupsIcon sx={{ color: "var(--primary-color)" }} />,
        label: t("dock.manage-watch-list"),
          subMenu: [
            { label: t("menu.manage-watch-list-person"), path: "/manage-watch-list-person" },
            { label: t("menu.manage-watch-list-plate"), path: "/manage-watch-list-plate" },
            { label: t("menu.manage-watch-list-checkpoint"), path: "/manage-watch-list-checkpoint" },
          ],
      },
      {
        icon: <EditRoadIcon sx={{ color: "var(--primary-color)" }} />,
        label: t("dock.manage-checkpoint-data"),
        subMenu: [
          { label: t("menu.manage-checkpoint-group"), path: "/manage-checkpoint-group" },
        ],
      },
      {
        icon: <AnalyticsIcon sx={{ color: "var(--primary-color)" }} />,
        label: t("dock.statistics"),
        subMenu: [
          { label: t("menu.statistics"), path: "/statistic-top-users" },
        ],
      },
    ],
    // Translations load asynchronously over XHR, so language and the
    // initialised flag are kept as explicit deps to guarantee the labels are
    // rebuilt once the bundle arrives, even if `t` keeps its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language, i18n.isInitialized]
  )
};
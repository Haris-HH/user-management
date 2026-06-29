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
    [t, i18n.language, i18n.isInitialized]
  )
};
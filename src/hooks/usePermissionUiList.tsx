import { useMemo } from "react";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { PermissionUiList } from "../types/common";

const usePermissionUiList = () => {
  const { t, i18n } = useTranslation();

  return useMemo(
    (): PermissionUiList[] => [
      {
        key: "log-management",
        name: t("permission.ui.log-management.name"),
        group_list: [
          {
            key: "chart-internal-police",
            name: t("permission.ui.log-management.chart-internal-police"),
            active: false,
            edit: false,
          },
          {
            key: "chart-internal-nsb",
            name: t("permission.ui.log-management.chart-internal-nsb"),
            active: false,
            edit: false,
          },
          {
            key: "chart-top-users",
            name: t("permission.ui.log-management.chart-top-users"),
            active: false,
            edit: false,
          },
          {
            key: "overall-checkpoints",
            name: t("permission.ui.log-management.overall-checkpoints"),
            active: false,
            edit: false,
          },
          {
            key: "overall-map",
            name: t("permission.ui.log-management.overall-map"),
            active: false,
            edit: false,
          },
          {
            key: "overall-report",
            name: t("permission.ui.log-management.overall-report"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-usage-agency",
            name: t("permission.ui.log-management.statistic-usage-agency"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-usage-person",
            name: t("permission.ui.log-management.statistic-usage-person"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-usage-log",
            name: t("permission.ui.log-management.statistic-usage-log"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-access-agency",
            name: t("permission.ui.log-management.statistic-access-agency"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-access-person",
            name: t("permission.ui.log-management.statistic-access-person"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-access-log",
            name: t("permission.ui.log-management.statistic-access-log"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-search-agency-plate",
            name: t("permission.ui.log-management.statistic-search-agency-plate"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-search-person-plate",
            name: t("permission.ui.log-management.statistic-search-person-plate"),
            active: false,
            edit: false,
          },
          {
            key: "statistic-search-log-plate",
            name: t("permission.ui.log-management.statistic-search-log-plate"),
            active: false,
            edit: false,
          },
        ],
      },
      {
        key: "user-management",
        name: t("permission.ui.user-management.name"),
        group_list: [
          {
            key: "add-approve-user",
            name: t("permission.ui.user-management.add-approve-user"),
            active: false,
            edit: false,
          },
          {
            key: "user-group-management",
            name: t("permission.ui.user-management.user-group-management"),
            active: false,
            edit: false,
          },
          {
            key: "manage-user",
            name: t("permission.ui.user-management.manage-user"),
            active: false,
            edit: false,
          },
          {
            key: "manage-watch-list-person",
            name: t("permission.ui.user-management.manage-watch-list-person"),
            active: false,
            edit: false,
          },
          {
            key: "manage-watch-list-plate",
            name: t("permission.ui.user-management.manage-watch-list-plate"),
            active: false,
            edit: false,
          },
          {
            key: "manage-watch-list-checkpoint",
            name: t("permission.ui.user-management.manage-watch-list-checkpoint"),
            active: false,
            edit: false,
          },
          {
            key: "manage-checkpoint-group",
            name: t("permission.ui.user-management.manage-checkpoint-group"),
            active: false,
            edit: false,
          },
          {
            key: "statistics",
            name: t("permission.ui.user-management.statistics"),
            active: false,
            edit: false,
          },
        ],
      },
    ],
    [t, i18n.language, i18n.isInitialized]
  );
};

export default usePermissionUiList;
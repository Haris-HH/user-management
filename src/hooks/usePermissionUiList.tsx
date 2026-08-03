import { useMemo } from "react";

// i18n
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

// Types
import type {
  PermissionMenuNode,
  PermissionUiGroup,
  PermissionUiList,
} from "../types/common";

// Constants
import {
  LPR_CENTER_PERMISSION_TREE,
  LPR_CENTER_UI_KEY,
} from "../constants/lprCenterPermissions";
import {
  LPR_LICENSE_PLATE_PERMISSION_TREE,
  LPR_LICENSE_PLATE_UI_KEY,
} from "../constants/lprLicensePlatePermissions";

/*
  Which level of a menu tree is actually granted:

  - "leaf"      each leaf is its own permission and a parent is only a heading
                over them (LPR Center - lpr-center-web derives a parent's
                visibility from its children).
  - "top-level" a top-level menu is granted as a whole and its children are
                shown for context only (LPR License Plate).
*/
type MenuGranularity = "leaf" | "top-level";

/*
  Flattens a menu tree into PermissionTable rows while keeping its shape: the
  top level is numbered, deeper nodes are indented one level per depth. Rows
  that are not granted at `granularity` are emitted as label rows - no controls,
  and PermissionTable keeps their keys out of groups/prints - so the persisted
  keys stay a 1:1 match with the consuming app's nav node ids.
*/
const buildMenuGroupList = (
  nodes: readonly PermissionMenuNode[],
  t: TFunction,
  granularity: MenuGranularity,
  depth = 0
): PermissionUiGroup[] =>
  nodes.flatMap((node, index) => {
    // Only the top level is numbered; children read as bullets under it.
    const label =
      depth === 0
        ? t("permission.ui.menu-section-label", {
            index: index + 1,
            menu: t(node.labelKey),
          })
        : t(node.labelKey);

    const hasChildren = Boolean(node.children && node.children.length > 0);

    const isPermission =
      granularity === "top-level" ? depth === 0 : !hasChildren;

    const row: PermissionUiGroup = {
      key: node.key,
      name: label,
      active: false,
      edit: false,
      depth,
      ...(isPermission ? {} : { is_label: true }),
    };

    if (!hasChildren) return [row];

    return [
      row,
      ...buildMenuGroupList(node.children ?? [], t, granularity, depth + 1),
    ];
  });

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
      {
        key: LPR_CENTER_UI_KEY,
        name: t("permission.ui.lpr-center.name"),
        group_list: buildMenuGroupList(LPR_CENTER_PERMISSION_TREE, t, "leaf"),
      },
      {
        key: LPR_LICENSE_PLATE_UI_KEY,
        name: t("permission.ui.lpr-license-plate.name"),
        group_list: buildMenuGroupList(
          LPR_LICENSE_PLATE_PERMISSION_TREE,
          t,
          "top-level"
        ),
      },
    ],
    // Translations load asynchronously over XHR, so language and the
    // initialised flag are kept as explicit deps to guarantee the labels are
    // rebuilt once the bundle arrives, even if `t` keeps its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, i18n.language, i18n.isInitialized]
  );
};

export default usePermissionUiList;
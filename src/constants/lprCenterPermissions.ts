/*
  Single source of truth for the LPR Center permission catalogue.

  Storage contract (identical to the existing user-management/log-management
  permissions, see src/types/common.ts -> GroupPermissions):

    permissions.ui["lpr-center"] = {
      enabled: boolean,                                  // gates the whole app
      groups:  { [leafKey]: "none" | "active" | "edit" },
      prints:  { [leafKey]: boolean },
    }

  lpr-center-web resolves a permission by splitting "<uiKey>.<groupKey>" on the
  FIRST dot, so leaf keys must not contain a dot. The keys below are the nav
  node ids used by lpr-center-web (src/layouts/nav.ts), so wiring its
  `permissionKey` fields up later is a 1:1 mapping with no migration.

  Only LEAF nodes are persisted. Parent nodes exist purely to group the tree in
  this editor: lpr-center-web derives parent visibility itself (a parent is
  hidden when every child is inaccessible), so storing a mode for a parent
  would be meaningless and could drift from what the consumer computes.
*/

// Types
import type { PermissionMenuNode } from "../types/common";

export const LPR_CENTER_UI_KEY = "lpr-center";

/** Labels live under `lpr-center-permission.*`; leaves are the persisted keys. */
export type LprCenterPermissionNode = PermissionMenuNode;

export const LPR_CENTER_PERMISSION_TREE: readonly LprCenterPermissionNode[] = [
  {
    key: "news",
    labelKey: "lpr-center-permission.news",
  },
  {
    key: "lpr_find",
    labelKey: "lpr-center-permission.lpr-find",
    children: [
      { key: "lpr_cond", labelKey: "lpr-center-permission.lpr-cond" },
      { key: "lpr_ba", labelKey: "lpr-center-permission.lpr-ba" },
    ],
  },
  {
    key: "face_find",
    labelKey: "lpr-center-permission.face-find",
    children: [
      { key: "face_by_face", labelKey: "lpr-center-permission.face-by-face" },
      { key: "face_by_plate", labelKey: "lpr-center-permission.face-by-plate" },
    ],
  },
  {
    key: "veh_analysis",
    labelKey: "lpr-center-permission.veh-analysis",
    children: [
      { key: "va_fake", labelKey: "lpr-center-permission.va-fake" },
      { key: "va_clone", labelKey: "lpr-center-permission.va-clone" },
      { key: "va_convoy", labelKey: "lpr-center-permission.va-convoy" },
      { key: "va_by_ck", labelKey: "lpr-center-permission.va-by-ck" },
    ],
  },
  {
    key: "lpr_watch",
    labelKey: "lpr-center-permission.lpr-watch",
    children: [
      { key: "wl_manage", labelKey: "lpr-center-permission.wl-manage" },
      { key: "wl_person_manage", labelKey: "lpr-center-permission.wl-person-manage" },
    ],
  },
  {
    key: "analysis",
    labelKey: "lpr-center-permission.analysis",
    children: [
      { key: "map", labelKey: "lpr-center-permission.map" },
      { key: "graph", labelKey: "lpr-center-permission.graph" },
    ],
  },
  {
    // "แผนที่" is its own section now. Its first leaf keeps lpr-center-web's
    // existing `wl_map` node id (the /watch-map page, previously grouped under
    // เฝ้าระวัง) so wiring stays a 1:1 mapping; only the grouping moved.
    key: "maps",
    labelKey: "lpr-center-permission.maps",
    children: [
      { key: "wl_map", labelKey: "lpr-center-permission.wl-map" },
      { key: "heat_map", labelKey: "lpr-center-permission.heat-map" },
    ],
  },
  {
    key: "sysadmin",
    labelKey: "lpr-center-permission.sysadmin",
    children: [
      { key: "a_ck", labelKey: "lpr-center-permission.a-ck" },
      { key: "news_mgmt", labelKey: "lpr-center-permission.news-mgmt" },
    ],
  },
];

/*
  Base groups the page guarantees. They are ordinary user groups: membership is
  tracked separately (see LprCenterApi), so configuring these does not disturb
  a user's user-management group.
*/
export const LPR_CENTER_BASE_GROUPS = [
  { nameKey: "lpr-center.base-group.investigation", name: "Investigation Department" },
  { nameKey: "lpr-center.base-group.user", name: "User" },
  { nameKey: "lpr-center.base-group.admin", name: "Admin" },
] as const;

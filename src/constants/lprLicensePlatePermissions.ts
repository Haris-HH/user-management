/*
  Single source of truth for the LPR License Plate permission catalogue.

  Storage contract (identical to the other services, see src/types/common.ts ->
  GroupPermissions):

    permissions.ui["lpr-license-plate"] = {
      enabled: boolean,                                 // gates the whole app
      groups:  { [menuKey]: "none" | "active" | "edit" },
      prints:  { [menuKey]: boolean },
    }

  Unlike LPR Center, this screen is configured per TOP-LEVEL menu only: a menu
  is granted as a whole and its sub-items inherit that grant, so only the
  top-level keys below are persisted. The children are listed purely so an
  administrator can see what a menu covers while granting it - they are never
  written to `groups`/`prints`.
*/

// Types
import type { PermissionMenuNode } from "../types/common";

export const LPR_LICENSE_PLATE_UI_KEY = "lpr-license-plate";

export const LPR_LICENSE_PLATE_PERMISSION_TREE: readonly PermissionMenuNode[] = [
  {
    key: "lpr_find",
    labelKey: "lpr-license-plate-permission.lpr-find",
    children: [
      { key: "lpr_cond", labelKey: "lpr-license-plate-permission.lpr-cond" },
      { key: "lpr_ba", labelKey: "lpr-license-plate-permission.lpr-ba" },
    ],
  },
  {
    key: "face_find",
    labelKey: "lpr-license-plate-permission.face-find",
    children: [
      { key: "face_by_face", labelKey: "lpr-license-plate-permission.face-by-face" },
      { key: "face_by_plate", labelKey: "lpr-license-plate-permission.face-by-plate" },
    ],
  },
  {
    key: "veh_analysis",
    labelKey: "lpr-license-plate-permission.veh-analysis",
    children: [
      { key: "va_fake", labelKey: "lpr-license-plate-permission.va-fake" },
      { key: "va_clone", labelKey: "lpr-license-plate-permission.va-clone" },
      { key: "va_convoy", labelKey: "lpr-license-plate-permission.va-convoy" },
      { key: "va_by_ck", labelKey: "lpr-license-plate-permission.va-by-ck" },
    ],
  },
  {
    key: "tools",
    labelKey: "lpr-license-plate-permission.tools",
    children: [
      { key: "ck_map", labelKey: "lpr-license-plate-permission.ck-map" },
      { key: "vdo_request", labelKey: "lpr-license-plate-permission.vdo-request" },
    ],
  },
  {
    key: "admin",
    labelKey: "lpr-license-plate-permission.admin",
    children: [
      { key: "vdo_request_list", labelKey: "lpr-license-plate-permission.vdo-request-list" },
      { key: "access_request", labelKey: "lpr-license-plate-permission.access-request" },
    ],
  },
  {
    key: "web_admin",
    labelKey: "lpr-license-plate-permission.web-admin",
    children: [
      { key: "news_mgmt", labelKey: "lpr-license-plate-permission.news-mgmt" },
    ],
  },
];

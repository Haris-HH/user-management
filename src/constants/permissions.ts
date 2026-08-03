/*
  uiKey of this console's own service. Every page in this app is gated by
  `permission.ui["user-management"].groups[<page>]`; the other uiKeys in the
  permission tree ("log-management", "lpr-center", ...) belong to sibling apps
  and are only edited here, never enforced here.
*/
export const USER_MANAGEMENT_UI_KEY = "user-management";

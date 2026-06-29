import { useSelector } from 'react-redux';

// Store
import type { RootState } from "../store/store";

export const usePermission = (uiKey: string, groupKey: string) => {
  const permissions = useSelector((state: RootState) => state.authUser.user?.permission);

  const uiPermission = permissions?.ui?.[uiKey];

  const isPageEnabled = uiPermission?.enabled === true;
  const mode = uiPermission?.groups?.[groupKey] ?? "none";
  const canPrint = uiPermission?.prints?.[groupKey] === true;

  return {
    mode,
    canView: isPageEnabled && (mode === "active" || mode === "edit"),
    canEdit: isPageEnabled && mode === "edit",
    canPrint: isPageEnabled && canPrint,
    isReadOnly: mode === "active",
    noPermission: !isPageEnabled || mode === "none",
  };
};
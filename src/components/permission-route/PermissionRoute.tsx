import { Navigate } from "react-router-dom";

// Hooks
import { usePermission } from "../../hooks/usePermission";

type Props = {
  /** Service the page belongs to - `permission.ui[uiKey]`. */
  uiKey: string;
  /** Page key inside that service - `permission.ui[uiKey].groups[groupKey]`. */
  groupKey: string;
  /*
    Pages that only exist to mutate data (a create/edit form) are not worth
    opening at "active" - every control on them would be hidden. Those ask for
    "edit" instead.
  */
  requireEdit?: boolean;
  children: React.ReactNode;
};

/*
  Route-level half of the permission model: "none" must mean the page cannot be
  reached at all, not merely that its menu entry is hidden, so a hand-typed URL
  lands back on the home page instead of rendering a screen full of data the
  user is not allowed to see.

  The redirect is `replace` so the blocked URL does not stay in history and
  bounce the user again when they press Back.
*/
const PermissionRoute = ({
  uiKey,
  groupKey,
  requireEdit = false,
  children,
}: Props) => {
  const { canView, canEdit } = usePermission(uiKey, groupKey);

  if (!(requireEdit ? canEdit : canView)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;

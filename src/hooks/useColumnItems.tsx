import { useMemo } from "react";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { AddApproveData } from "../types/common";

export interface Column {
  id: keyof AddApproveData | "actions" | "edit" | `sub_agency_${number}`;
  label: string;
  minWidth?: number;
  align?: "center" | "left" | "right";
}

export const MAX_SUB_AGENCY = 3;

const useColumnItems = () => {
  const { t, i18n } = useTranslation();

  return useMemo((): Column[] => {
    const subAgencyColumns: Column[] = Array.from(
      { length: MAX_SUB_AGENCY },
      (_, index) => ({
        id: `sub_agency_${index}` as const,
        label: t("table.header.sub-agency", { number: index + 1 }),
        minWidth: 220,
        align: "center",
      })
    );

    return [
      {
        id: "actions",
        label: t("table.header.select"),
        minWidth: 50,
        align: "center",
      },
      {
        id: "edit",
        label: t("table.header.edit"),
        minWidth: 50,
        align: "center",
      },
      {
        id: "id",
        label: t("table.header.no"),
        minWidth: 50,
        align: "center",
      },
      {
        id: "pid",
        label: t("table.header.pid"),
        minWidth: 180,
        align: "center",
      },
      {
        id: "prefix",
        label: t("table.header.prefix"),
        minWidth: 100,
        align: "center",
      },
      {
        id: "name",
        label: t("table.header.first-name"),
        minWidth: 130,
        align: "center",
      },
      {
        id: "last_name",
        label: t("table.header.last-name"),
        minWidth: 130,
        align: "center",
      },
      {
        id: "position",
        label: t("table.header.position"),
        minWidth: 220,
        align: "center",
      },
      {
        id: "ou",
        label: t("table.header.agency"),
        minWidth: 220,
        align: "center",
      },
      {
        id: "bh",
        label: t("table.header.bh"),
        minWidth: 220,
        align: "center",
      },
      {
        id: "bk",
        label: t("table.header.bk"),
        minWidth: 220,
        align: "center",
      },
      {
        id: "org",
        label: t("table.header.org"),
        minWidth: 220,
        align: "center",
      },

      ...subAgencyColumns,

      {
        id: "email",
        label: t("table.header.email"),
        minWidth: 200,
        align: "center",
      },
      {
        id: "mobile",
        label: t("table.header.mobile"),
        minWidth: 150,
        align: "center",
      },
      {
        id: "created_at",
        label: t("table.header.register-date"),
        minWidth: 150,
        align: "center",
      },
      {
        id: "approve_date",
        label: t("table.header.approve-date"),
        minWidth: 150,
        align: "center",
      },
      {
        id: "un_approve_date",
        label: t("table.header.unapprove-date"),
        minWidth: 150,
        align: "center",
      },
      {
        id: "un_approve_reason",
        label: t("table.header.status-change-remark"),
        minWidth: 200,
        align: "center",
      },
      {
        id: "active_date_time",
        label: t("table.header.active-date"),
        minWidth: 150,
        align: "center",
      },
      {
        id: "user_group",
        label: t("table.header.user-group"),
        minWidth: 150,
        align: "center",
      },
      {
        id: "update_profile_status",
        label: t("table.header.update-profile-status"),
        minWidth: 200,
        align: "center",
      },
      {
        id: "latest_update_profile_date",
        label: t("table.header.latest-update-profile-date"),
        minWidth: 200,
        align: "center",
      },
      {
        id: "active_status",
        label: t("table.header.active-status"),
        minWidth: 160,
        align: "center",
      },
      {
        id: "remark",
        label: t("table.header.remark"),
        minWidth: 200,
        align: "center",
      },
    ];
  }, [t, i18n.language, i18n.isInitialized]);
};

export default useColumnItems;
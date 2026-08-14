import { useMemo, useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import GroupsIcon from "@mui/icons-material/Groups";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";

// Components
import DialogComponent from "../dialog/Dialog";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { UserGroup } from "../../types/common";

// Utils
import { capitalizeWords } from "../../utils/commonFunctions";
import { PopupMessage, PopupMessageWithCancel } from "../../utils/popupMessage";

// API
import { createUserGroup, deleteUserGroup } from "../../features/users/api/UsersApi";

type Props = {
  open: boolean;
  onClose: () => void;
  groups: UserGroup[];
  /** Lower-cased names of protected base groups that cannot be deleted. */
  protectedNames: ReadonlySet<string>;
  /** Refetch the group list after a create/delete. */
  onChanged: () => Promise<void>;
};

const ManageGroupsDialog = ({
  open,
  onClose,
  groups,
  protectedNames,
  onChanged,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  // State
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A group is protected when it is a base group or explicitly locked, so it
  // can never be deleted from here.
  const isProtected = (group: UserGroup): boolean =>
    protectedNames.has(group.group_name.trim().toLowerCase()) || !!group.locked;

  const existingNames = useMemo(
    () => new Set(groups.map((group) => group.group_name.trim().toLowerCase())),
    [groups]
  );

  const handleAdd = async () => {
    if (isSubmitting) return;

    const name = newName.trim();

    if (!name) {
      await PopupMessage(t("popup.error-title"), t("popup.group-name-required"), "warning");
      return;
    }

    if (existingNames.has(name.toLowerCase())) {
      await PopupMessage(t("popup.error-title"), t("popup.group-name-duplicate"), "warning");
      return;
    }

    const confirmed = await PopupMessageWithCancel(
      t("popup.create-group-title"),
      t("popup.create-group-message", { group: name }),
      t("button.confirm"),
      t("button.cancel"),
      "question"
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await createUserGroup({
        group_name: name,
        permissions: {},
        login_lifetime: 0,
        approved_lifetime: 0,
        notes: "",
      });

      setNewName("");
      await onChanged();
      await PopupMessage(t("popup.create-group-success"), "", "success");
    }
    catch (error) {
      console.error("Failed to create group:", error);
      await PopupMessage(t("popup.error-title"), t("popup.create-group-failed"), "error");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (group: UserGroup) => {
    if (isSubmitting) return;

    const confirmed = await PopupMessageWithCancel(
      t("popup.delete-group-title"),
      t("popup.delete-group-message", { group: capitalizeWords(group.group_name) }),
      t("button.confirm"),
      t("button.cancel"),
      "warning"
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);

      await deleteUserGroup([group.group_id]);

      await onChanged();
      await PopupMessage(t("popup.delete-group-success"), "", "success");
    }
    catch (error) {
      console.error("Failed to delete group:", error);
      await PopupMessage(t("popup.error-title"), t("popup.delete-group-failed"), "error");
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogComponent
      open={open}
      handleClose={isSubmitting ? () => undefined : onClose}
      dialogTitle={t("dialog.manage-groups")}
      width="480px"
      disabled={isSubmitting}
    >
      <Box className="flex flex-col gap-4 p-1">
        <Typography sx={{ fontSize: "13px", color: "var(--primary-color)", opacity: 0.75 }}>
          {t("lpr-center-page.manage-groups-hint")}
        </Typography>

        {/* Existing groups */}
        <Box className="flex flex-col gap-2">
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--primary-color)",
              opacity: 0.7,
            }}
          >
            {t("lpr-center-page.existing-groups")}
          </Typography>

          <Box className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
            {groups.length === 0 ? (
              <Typography
                sx={{ fontSize: "14px", color: "var(--primary-color)", opacity: 0.7, py: 2, textAlign: "center" }}
              >
                {t("lpr-center-page.no-groups")}
              </Typography>
            ) : (
              groups.map((group) => {
                const locked = isProtected(group);

                return (
                  <Box
                    key={group.group_id}
                    className="flex items-center justify-between gap-2 rounded-md px-3 py-2"
                    sx={{
                      border: "1px solid rgba(var(--primary-color-rgb), 0.2)",
                      backgroundColor: "rgba(var(--primary-color-rgb), 0.03)",
                    }}
                  >
                    <Box className="flex items-center gap-2 min-w-0">
                      {locked ? (
                        <ShieldOutlinedIcon sx={{ fontSize: 20, color: "var(--primary-color)" }} />
                      ) : (
                        <GroupsIcon sx={{ fontSize: 20, color: "var(--primary-color)" }} />
                      )}
                      <Typography
                        noWrap
                        sx={{ fontSize: "14px", fontWeight: 600, color: "var(--primary-color)" }}
                      >
                        {capitalizeWords(group.group_name)}
                      </Typography>
                    </Box>

                    {locked ? (
                      <Chip
                        size="small"
                        label={
                          group.locked
                            ? t("text.locked")
                            : t("lpr-center-page.badge-base")
                        }
                        sx={{
                          height: "20px",
                          fontSize: "10px",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          textTransform: "uppercase",
                          backgroundColor: "rgba(var(--primary-color-rgb), 0.15)",
                          color: "var(--primary-color)",
                        }}
                      />
                    ) : (
                      <IconButton
                        size="small"
                        title={t("button.delete")}
                        disabled={isSubmitting}
                        onClick={() => void handleDelete(group)}
                        sx={{ color: "var(--danger-color)" }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Create new group */}
        <Box className="flex flex-col gap-2 pt-3" sx={{ borderTop: "1px solid rgba(var(--primary-color-rgb), 0.2)" }}>
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--primary-color)",
              opacity: 0.7,
            }}
          >
            {t("lpr-center-page.create-new-group")}
          </Typography>

          <Box className="flex gap-2">
            <InputBase
              value={newName}
              disabled={isSubmitting}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAdd();
              }}
              placeholder={t("lpr-center-page.new-group-placeholder")}
              sx={{
                flex: 1,
                px: 1.5,
                py: 0.5,
                fontSize: "14px",
                color: "var(--primary-color)",
                borderRadius: "4px",
                border: "1px solid rgba(var(--primary-color-rgb), 0.35)",
                backgroundColor: "var(--tertiary-color)",
              }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={isSubmitting}
              onClick={() => void handleAdd()}
              sx={{
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                whiteSpace: "nowrap",
              }}
            >
              {t("button.add")}
            </Button>
          </Box>
        </Box>

        {/* Footer */}
        <Box className="flex justify-end pt-2">
          <Button
            variant="outlined"
            disabled={isSubmitting}
            onClick={onClose}
            sx={{ color: "var(--primary-color)", borderColor: "var(--primary-color)" }}
          >
            {t("button.close")}
          </Button>
        </Box>
      </Box>
    </DialogComponent>
  );
};

export default ManageGroupsDialog;

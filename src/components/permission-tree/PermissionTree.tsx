import { useMemo } from "react";

// Material UI
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { LprCenterPermissionNode } from "../../constants/lprCenterPermissions";

// Utils
import {
  filterPermissionTree,
  getNodeCheckState,
  isLeafNode,
  toggleNodeSelection,
} from "../../utils/permissionTree";

type Props = {
  nodes: readonly LprCenterPermissionNode[];
  selectedKeys: ReadonlySet<string>;
  expandedKeys: ReadonlySet<string>;
  onSelectedChange: (next: Set<string>) => void;
  onToggleExpanded: (key: string) => void;
  searchQuery?: string;
  disabled?: boolean;
};

const PermissionTree = ({
  nodes,
  selectedKeys,
  expandedKeys,
  onSelectedChange,
  onToggleExpanded,
  searchQuery = "",
  disabled = false,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  const visibleNodes = useMemo(
    () => filterPermissionTree(nodes, searchQuery, (node) => t(node.labelKey)),
    [nodes, searchQuery, t]
  );

  const renderNode = (node: LprCenterPermissionNode, depth: number) => {
    const leaf = isLeafNode(node);
    const checkState = getNodeCheckState(node, selectedKeys);
    // While searching, keep matched branches open so results are visible.
    const isExpanded = searchQuery.trim() !== "" || expandedKeys.has(node.key);

    return (
      <Box key={node.key}>
        <Box
          className="flex items-center gap-1 rounded-sm"
          sx={{
            pl: `${depth * 24}px`,
            "&:hover": {
              backgroundColor: "rgba(var(--primary-color-rgb), 0.06)",
            },
          }}
        >
          {leaf ? (
            <Box sx={{ width: "30px", flexShrink: 0 }} />
          ) : (
            <IconButton
              size="small"
              onClick={() => onToggleExpanded(node.key)}
              aria-label={isExpanded ? t("button.collapse") : t("button.expand")}
              sx={{ color: "var(--primary-color)", width: "30px", flexShrink: 0 }}
            >
              {isExpanded ? (
                <KeyboardArrowDownIcon fontSize="small" />
              ) : (
                <KeyboardArrowRightIcon fontSize="small" />
              )}
            </IconButton>
          )}

          <Checkbox
            size="small"
            disabled={disabled}
            checked={checkState === "checked"}
            indeterminate={checkState === "indeterminate"}
            onChange={(event) =>
              onSelectedChange(
                toggleNodeSelection(node, selectedKeys, event.target.checked)
              )
            }
            sx={{
              color: "var(--primary-color)",
              "&.Mui-checked": { color: "var(--primary-color)" },
              "&.MuiCheckbox-indeterminate": { color: "var(--primary-color)" },
            }}
          />

          <Typography
            onClick={() => {
              if (disabled) return;
              onSelectedChange(
                toggleNodeSelection(node, selectedKeys, checkState !== "checked")
              );
            }}
            sx={{
              fontSize: "14px",
              color: "var(--primary-color)",
              cursor: disabled ? "not-allowed" : "pointer",
              fontWeight: leaf ? 400 : 600,
              userSelect: "none",
              py: 0.5,
            }}
          >
            {t(node.labelKey)}
          </Typography>
        </Box>

        {!leaf && node.children && (
          <Collapse in={isExpanded} unmountOnExit>
            <Box>
              {node.children.map((child) => renderNode(child, depth + 1))}
            </Box>
          </Collapse>
        )}
      </Box>
    );
  };

  if (visibleNodes.length === 0) {
    return (
      <Typography
        sx={{ fontSize: "14px", color: "var(--primary-color)", opacity: 0.7, p: 2 }}
      >
        {t("text.data-not-found")}
      </Typography>
    );
  }

  return <Box>{visibleNodes.map((node) => renderNode(node, 0))}</Box>;
};

export default PermissionTree;

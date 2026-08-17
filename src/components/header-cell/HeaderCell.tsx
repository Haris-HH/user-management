import { useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import Grow from "@mui/material/Grow";

// i18n
import { useTranslation } from 'react-i18next';

type FilterOption = {
  label: string;
  value: string;
};

type Props = {
  label: string;
  width: string;
  filter?: boolean;
  option?: FilterOption[];
  selectedValues?: string[];
  onChange?: (values: string[]) => void;
  openedFilter?: string | null;
  setOpenedFilter?: React.Dispatch<React.SetStateAction<string | null>>;
};

const HeaderCell = ({
  label,
  width,
  filter = true,
  option = [],
  selectedValues = [],
  onChange,
  openedFilter,
  setOpenedFilter,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  // Data
  const [search, setSearch] = useState("");

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();

    if (openedFilter === label) {
      setOpenedFilter?.(null);
      setAnchorEl(null);
      return;
    }

    setOpenedFilter?.(label);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setOpenedFilter?.(null);
    setAnchorEl(null);
  };

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter((item) => item !== value)
      : [...selectedValues, value];

    onChange?.(newValues);
  };

  const filteredOptions = option.filter((item) =>
    item.label.toLowerCase().includes(search.toLowerCase())
  );

  const allSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((item) =>
      selectedValues.includes(item.value)
    );

  const handleSelectAll = () => {
    if (allSelected) {
      const newValues = selectedValues.filter(
        (value) =>
          !filteredOptions.some((item) => item.value === value)
      );

      onChange?.(newValues);
    } else {
      const merged = [
        ...new Set([
          ...selectedValues,
          ...filteredOptions.map((item) => item.value),
        ]),
      ];

      onChange?.(merged);
    }
  };

  const FilterItem = ({
    children,
    onClick,
    disabled = false,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <ButtonBase
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: "100%",
        minHeight: 36,
        px: 1,
        justifyContent: "flex-start",
        color: "var(--theme-accent)",
        opacity: disabled ? 0.5 : 1,
        ":hover": {
          backgroundColor: "rgba(var(--theme-accent-rgb), 0.10)",
        }
      }}
    >
      {children}
    </ButtonBase>
  );

  return (
    <TableCell
      align="center"
      sx={{
        width,
        backgroundColor: "var(--theme-accent)",
        color: "var(--theme-panel)",
      }}
    >
      <Box className="flex justify-center items-center gap-1">
        <span>{label}</span>

        {filter && (
          <IconButton
            size="small"
            onClick={handleFilterClick}
            sx={{
              color:
                selectedValues.length > 0
                  ? "var(--theme-accent-soft)"
                  : "var(--theme-panel)",
              padding: "4px",
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Popper
        anchorEl={anchorEl}
        open={Boolean(anchorEl) && openedFilter === label}
        placement="bottom-start"
        transition
        sx={{ zIndex: 99999 }}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            timeout={100}
            style={{ transformOrigin: "left top" }}
          >
            <Paper
              sx={{
                mt: 1,
                width: 200,
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: "var(--theme-panel)",
                color: "var(--theme-accent)",
              }}
            >
              <ClickAwayListener onClickAway={handleCloseFilter}>
                <Box>
                  <Box sx={{ px: 1, py: 1, borderBottom: "1px solid var(--theme-accent)" }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid var(--theme-accent)",
                        borderRadius: "4px",
                        px: 1,
                        height: 36,
                      }}
                    >
                      <InputBase
                        placeholder={t("placeholder.search")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ 
                          flex: 1, 
                          fontSize: 14,
                          color: "var(--theme-accent)",
                        }}
                      />

                      <SearchIcon sx={{ color: "var(--theme-accent)", fontSize: 20 }} />
                    </Box>
                  </Box>

                  <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
                    {filteredOptions.length > 0 ? (
                      <>
                        <FilterItem onClick={handleSelectAll}>
                          <Checkbox checked={allSelected} size="small" sx={{ color: "var(--theme-accent)" }} />
                          <ListItemText
                            primary={t("text.select-all")}
                            sx={{ "& .MuiTypography-root": { fontSize: 14 } }}
                          />
                        </FilterItem>

                        {filteredOptions.map((item) => (
                          <FilterItem key={item.value} onClick={() => handleToggle(item.value)}>
                            <Checkbox
                              checked={selectedValues.includes(item.value)}
                              size="small"
                              sx={{ color: "var(--theme-accent)" }}
                            />
                            <ListItemText
                              primary={item.label}
                              sx={{ "& .MuiTypography-root": { fontSize: 14 } }}
                            />
                          </FilterItem>
                        ))}
                      </>
                    ) : (
                      <FilterItem disabled>
                        <ListItemText primary={t("text.data-not-found")} />
                      </FilterItem>
                    )}
                  </Box>
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </TableCell>
  );
};

export default HeaderCell;
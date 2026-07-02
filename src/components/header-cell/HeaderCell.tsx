import { useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import TableCell from "@mui/material/TableCell";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchIcon from "@mui/icons-material/Search";
import InputBase from "@mui/material/InputBase";

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

  const open = openedFilter === label;

  const handleFilterClick = (
    event: React.MouseEvent<HTMLElement>
  ) => {
    event.stopPropagation();
    event.preventDefault();

    if (openedFilter === label) {
      setOpenedFilter(null);
      setAnchorEl(null);
    } else {
      setOpenedFilter(label);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleCloseFilter = () => {
    setOpenedFilter(null);
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

  return (
    <TableCell
      align="center"
      sx={{
        width,
        backgroundColor: "var(--primary-color)",
        color: "var(--tertiary-color)",
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
                  ? "#1976d2"
                  : "var(--tertiary-color)",
              padding: "4px",
            }}
          >
            <FilterListIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleCloseFilter}
        disablePortal={true}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 180,
              borderRadius: "6px",
              overflow: "hidden",

              "& .MuiMenu-list": {
                padding: 0,
              },
            },
          },
        }}
      >
        <Box sx={{ px: 1, py: 1, borderBottom: "1px solid #ddd" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              border: "1px solid #ccc",
              borderRadius: "4px",
              px: 1,
              height: 36,
            }}
          >
            <InputBase
              placeholder={t("placeholder.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, fontSize: 14 }}
            />

            <SearchIcon sx={{ color: "#666", fontSize: 20 }} />
          </Box>
        </Box>

        <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
          {filteredOptions.length > 0 ? (
            <>
              <MenuItem 
                onClick={handleSelectAll}
                sx={{ py: 0 }}
              >
                <Checkbox 
                  checked={allSelected} 
                  size="small" 
                />
                <ListItemText primary={t("text.select-all")} sx={{ "& .MuiTypography-root": { fontSize: 14 } }} />
              </MenuItem>

              {filteredOptions.map((item) => (
                <MenuItem
                  key={item.value}
                  onClick={() => handleToggle(item.value)}
                  sx={{ py: 0 }}
                >
                  <Checkbox 
                    checked={selectedValues.includes(item.value)} 
                    size="small"
                  />
                  <ListItemText primary={item.label} sx={{ "& .MuiTypography-root": { fontSize: 14 } }} />
                </MenuItem>
              ))}
            </>
          ) : (
            <MenuItem disabled>
              <ListItemText primary={t("text.data-not-found")} />
            </MenuItem>
          )}
        </Box>
      </Menu>
    </TableCell>
  );
};

export default HeaderCell;
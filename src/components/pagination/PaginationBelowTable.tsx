// Material UI
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select'
import type { SelectChangeEvent } from '@mui/material/Select'

// Component
import TextBox from '../../components/text-box/TextBox'

// i18n
import { useTranslation } from 'react-i18next';

interface PaginationProps {
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  rowsPerPage: number;
  rowsPerPageOptions: number[];
  handleRowsPerPageChange: (event: SelectChangeEvent) => void;
  totalPages: number;
  pageInput: string;
  handlePageInputKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePageInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PaginationBelowTableComponent: React.FC<PaginationProps> = ({
  page,
  onChange,
  rowsPerPage,
  rowsPerPageOptions,
  handleRowsPerPageChange,
  totalPages,
  pageInput,
  handlePageInputKeyDown,
  handlePageInputChange,
}) => {
  // i18n
  const { t } = useTranslation();

  return (
    <div className='flex items-center justify-between w-full'>
      <div className="flex items-center gap-4">
        <p className="text-(--theme-accent) text-[16px]">{t('text.show')}</p>
        <Select
          id="row-per-page-select"
          value={rowsPerPage.toString()}
          onChange={handleRowsPerPageChange}
          className="bg-(--theme-panel) h-8 min-w-25 w-25"
          size="medium"
          sx={{
            color: "var(--theme-accent)",
            border: "1px solid var(--theme-accent)",
            "& .MuiSvgIcon-root": {
              color: "var(--theme-accent)",
            }
          }}
          MenuProps={{
            slotProps: {
              paper: {
                sx: {
                  backgroundColor: "var(--theme-panel)",
                  border: "1px solid var(--theme-accent)",

                  "& .MuiMenuItem-root": {
                    color: "var(--theme-accent)",
                    backgroundColor: "var(--theme-panel)",

                    "&:hover": {
                      backgroundColor: "rgba(var(--theme-accent-rgb), 0.15)",
                    },

                    "&.Mui-selected": {
                      color: "var(--theme-panel)",
                      backgroundColor: "var(--theme-accent) !important",
                    },

                    "&.Mui-selected:hover": {
                      backgroundColor:
                        "rgba(var(--theme-accent-rgb), 0.80) !important",
                    },
                  },
                },
              },
            },
          }}
        >
          {rowsPerPageOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </div>
      <div className='flex justify-center items-center'>
        <Stack spacing={2}>
          <Pagination
            sx={{
              display: 'flex',
              justifyContent: 'end',
              "& .MuiPaginationItem-page": {
                color: "var(--theme-panel)",
                backgroundColor: "rgba(var(--theme-accent-rgb), 0.40)",
              },
              "& .MuiPaginationItem-page:hover": {
                backgroundColor: "rgba(var(--theme-accent-rgb), 0.70)",
                color: "var(--theme-panel)",
              },
              "& .MuiPaginationItem-previousNext": {
                color: "var(--theme-panel)",
                backgroundColor: "rgba(var(--theme-accent-rgb), 0.70)",
                border: "1px solid var(--theme-accent)",
              },
              "& .MuiPaginationItem-ellipsis": {
                color: "var(--theme-panel)",
              },
              "& .MuiPaginationItem-page.Mui-selected": {
                backgroundColor: "var(--theme-accent)",
                color: "var(--theme-panel)",
              },
            }}
            count={totalPages}
            variant="outlined"
            shape="rounded"
            page={page}
            onChange={onChange}
          />
        </Stack>
        <div className="flex items-center gap-x-2 ml-3">
          <p className="text-(--theme-accent) text-[16px]">
            {t('text.page')}
          </p>
          <TextBox
            id="input-page"
            label=""
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100px',
            }}
            value={pageInput}
            onKeyDown={handlePageInputKeyDown}
            onChange={handlePageInputChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PaginationBelowTableComponent;
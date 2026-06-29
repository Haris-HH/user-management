import { useState } from 'react'

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';

// Components
import Dialog from '../dialog/Dialog';
import SearchInput from '../search-input/SearchInput';
import HeaderCell from '../header-cell/HeaderCell';

// i18n
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  onClose: () => void;
}

const AddCheckpoint = ({ 
  open, 
  onClose,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  // State
  const [openedFilter, setOpenedFilter] = useState<string | null>(null);

  // Data
  const [selectedAreaRegion, setSelectedAreaRegion] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string[]>([]);
  const [selectedStation, setSelectedStation] = useState<string[]>([]);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<string[]>([]);

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);

  const onChange = (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => {
    event.preventDefault();
    setPage(newPage);
  };

  return (
    <Dialog
      open={open}
      handleClose={onClose}
      dialogTitle={t('dialog.add-checkpoint')}
      width="1400px"
    >
      <Box className="flex flex-col gap-4 pt-3 h-[75dvh]">
        <div className='flex justify-between items-end'>
          <p className='text-[14px] text-(--secondary-color) font-medium'>{`${0} ${t('text.list')}`}</p>
          <SearchInput />
        </div>
        <TableContainer
          component={Paper}
          sx={{ 
            height: "65vh",
            borderRadius: 0,
            border: "none",
            boxShadow: "none",
            backgroundImage: "none",
            overflowX: "visible",
            overflowY: "auto",
            backgroundColor: "var(--tertiary-color)",

            "&.MuiPaper-root": {
              border: "none",
              boxShadow: "none",
              backgroundImage: "none",
            },

            "& .MuiTableCell-root": {
              borderBottom: "none",
            },
          }}
        >
          <Table stickyHeader sx={{ overflow: "visible" }}>
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    height: "56.5px",
                    fontSize: "16px",
                  },
                }}
              >
                <HeaderCell label={t("table.header.no")} width="5%" filter={false} />
                <HeaderCell 
                  label={t("table.header.area-region")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedAreaRegion}
                  onChange={setSelectedAreaRegion}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell 
                  label={t("table.header.province")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedProvince}
                  onChange={setSelectedProvince}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell 
                  label={t("table.header.station")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedStation}
                  onChange={setSelectedStation}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell 
                  label={t("table.header.checkpoint")} 
                  width="10%" 
                  option={[]}
                  filter={true} 
                  selectedValues={selectedCheckpoint}
                  onChange={setSelectedCheckpoint}
                  openedFilter={openedFilter}
                  setOpenedFilter={setOpenedFilter}
                />
                <HeaderCell label={t("table.header.select")} width="5%" filter={false} />
              </TableRow>
            </TableHead>
            <TableBody>
              
            </TableBody>
          </Table>
        </TableContainer>
        <div className='flex w-full justify-between items-center'>
          <Stack spacing={2}>
            <Pagination
              sx={{
                display: 'flex',
                justifyContent: 'end',
                "& .MuiPaginationItem-page": {
                  color: "var(--secondary-color)",
                  backgroundColor: "var(--tertiary-color)",
                  border: "1px solid var(--primary-color)",
                },
                "& .MuiPaginationItem-page:hover": {
                  backgroundColor: "var(--primary-color)",
                  color: "var(--tertiary-color)",
                },
                "& .MuiPaginationItem-previousNext": {
                  color: "var(--secondary-color)",
                  backgroundColor: "var(--tertiary-color)",
                  border: "1px solid var(--primary-color)",
                },
                "& .MuiPaginationItem-previousNext:hover": {
                  color: "var(--tertiary-color)",
                  backgroundColor: "var(--primary-color)",
                },
                "& .MuiPaginationItem-ellipsis": {
                  color: "var(--tertiary-color)",
                },
                "& .MuiPaginationItem-page.Mui-selected": {
                  backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
                  color: "var(--tertiary-color)",
                },
              }}
              count={totalPages}
              variant="outlined"
              shape="rounded"
              page={page}
              onChange={onChange}
            />
          </Stack>
          <Box className="flex items-center gap-2">
            <Button
              variant="outlined"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--tertiary-color)",
                border: "1px solid var(--primary-color)",
                color: "var(--primary-color)",
                "&:hover": {
                  backgroundColor:  "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize"
              }}
            >
              {t('button.cancel')}
            </Button>
            <Button
              variant="contained"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": {
                  backgroundColor:  "rgba(var(--primary-color-rgb), 0.8)",
                },
                textTransform: "capitalize"
              }}
            >
              {t('button.save')}
            </Button>
          </Box>
        </div>
      </Box>
    </Dialog>
  )
}

export default AddCheckpoint;
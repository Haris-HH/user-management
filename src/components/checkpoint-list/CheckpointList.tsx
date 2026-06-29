import { useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

// Components
import SearchInput from '../search-input/SearchInput';
import AddCheckpoint from "../add-checkpoint/AddCheckpoint";

// Icons
import DeleteIcon from '@mui/icons-material/Delete';

// i18n
import { useTranslation } from 'react-i18next';

const UserList = () => {
  // i18n
  const { t } = useTranslation();

  // State
  const [isAddCheckpointOpen, setIsAddCheckpointOpen] = useState(false);

  return (
    <section id='user-list'>
      <Box className="flex flex-col gap-2">
        <Box className="flex justify-between items-center">
          <Typography component="span" style={{ color: "var(--tertiary-color)", fontWeight: 500 }}>
            {t('text.user-list')}
          </Typography>
          <Button
            variant="contained"
            sx={{
              width: 140,
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              "&:hover": {
                backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
              },
              textTransform: "capitalize",
            }}
            startIcon={<AddIcon />}
            onClick={() => setIsAddCheckpointOpen(true)}
          >
            {t('button.add-checkpoint')}
          </Button>
        </Box>
        <Box className="flex flex-col bg-(--main-bg-color) p-2 gap-2">
          <Box className="flex justify-between items-center">
            <p className='text-[14px] text-(--secondary-color) font-medium'>{`${0} ${t('text.list')}`}</p>
            <SearchInput />
          </Box>
          <TableContainer
            component={Paper}
            sx={{
              height: "70vh",
              borderRadius: "0px",
              backgroundColor: "var(--tertiary-color)",
            }}
          >
            <Table
              stickyHeader
            >
              <TableHead>
                <TableRow
                  sx={{
                    '& td, & th': { 
                      padding: '0px',
                      height: "56.5px",
                      fontSize: "15px",
                      borderBottom: "1px solid var(--primary-color)"
                    },
                    "& .MuiTableCell-root": {
                      backgroundColor: "var(--tertiary-color)",
                      color: "var(--secondary-color)",
                      borderBottom: "1px solid var(--primary-color)",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      width: "10%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.no')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "15%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.area-region')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "15%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.province')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.station')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "20%",
                      textAlign: "center",
                    }}
                  >
                    {t('table.header.checkpoint')}
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "10%",
                      textAlign: "center",
                    }}
                  >
                    <DeleteIcon sx={{ fontSize: "20px", color: "var(--trash-icon)" }} />
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      {
        isAddCheckpointOpen && (
          <AddCheckpoint
            open={isAddCheckpointOpen}
            onClose={() => setIsAddCheckpointOpen(false)}
          />
        )
      }
    </section>
  )
}

export default UserList;
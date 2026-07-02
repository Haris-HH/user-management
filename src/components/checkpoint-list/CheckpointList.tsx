import { useState, useMemo } from "react";

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
import IconButton from "@mui/material/IconButton";

// Components
import SearchInput from '../search-input/SearchInput';
import AddCheckpoint from "../add-checkpoint/AddCheckpoint";

// Icons
import DeleteIcon from '@mui/icons-material/Delete';

// i18n
import { useTranslation } from 'react-i18next';

// Types
import type { Camera } from "../../types/common";

// Utils
import { capitalizeWords } from "../../utils/commonFunctions";

interface FormData {
  search: string;
}

const CheckpointList = () => {
  // i18n
  const { t } = useTranslation();

  // State
  const [isAddCheckpointOpen, setIsAddCheckpointOpen] = useState(false);

  // Data
  const [selectedCheckpoints, setSelectedCheckpoints] = useState<Camera[]>([]);

   // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  const selectedCheckpointIds = useMemo(
    () => selectedCheckpoints.map((checkpoint) => checkpoint.camera_id),
    [selectedCheckpoints]
  );

  const filterSelectedCheckpoints = useMemo(() => {
    const keyword = formData.search.trim().toLowerCase();

    if (!keyword) return selectedCheckpoints;

    return selectedCheckpoints.filter((checkpoint) => {
      const searchable = [
        checkpoint.police_region_name,
        checkpoint.province_name,
        checkpoint.police_station_name,
        checkpoint.camera_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [formData.search, selectedCheckpoints]);

  const handleSaveCheckpoint = (checkpoint: Camera[]) => {
    setSelectedCheckpoints(checkpoint);
    setIsAddCheckpointOpen(false);
  };

  const handleDeleteCheckpoint = (cameraId: string) => {
    setSelectedCheckpoints((prev) => prev.filter((checkpoint) => checkpoint.camera_id !== cameraId));
  };
  
  const handleDeleteAllCheckpoints = () => {
    setSelectedCheckpoints([]);
  };

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

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
            <SearchInput 
              value={formData.search}
              onChange={(event) =>
                handleTextChange("search", event.target.value)
              }
            />
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
                    <IconButton onClick={() => handleDeleteAllCheckpoints()}>
                      <DeleteIcon 
                        sx={{ 
                          fontSize: 20, 
                          color: selectedCheckpointIds.length > 0 ? "var(--trash-active-icon)" : "var(--trash-icon)",
                          "&:hover": {
                            scale: 1.3,
                          }
                        }} 
                        />
                    </IconButton>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filterSelectedCheckpoints.length > 0 ? (
                  filterSelectedCheckpoints.map((checkpoint, index) => {
                    return (
                      <TableRow
                        key={checkpoint.camera_id}
                        sx={{
                          "& .MuiTableCell-root": {
                            color: "var(--secondary-color)",
                            borderBottom: "1px solid var(--primary-color)",
                          },
                        }}
                      >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">{checkpoint.police_region_name || "-"}</TableCell>
                        <TableCell align="center">{checkpoint.province_name || "-"}</TableCell>
                        <TableCell align="center">{checkpoint.police_station_name || "-"}</TableCell>
                        <TableCell align="center">{checkpoint.camera_name || "-"}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDeleteCheckpoint(checkpoint.camera_id)}>
                            <DeleteIcon 
                              sx={{ 
                                fontSize: 20, 
                                color: "var(--trash-active-icon)",
                                "&:hover": {
                                  scale: 1.3,
                                }
                              }} 
                            />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: "var(--secondary-color)" }}>
                      {t("text.no-data")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      {
        isAddCheckpointOpen && (
          <AddCheckpoint
            open={isAddCheckpointOpen}
            selectedCheckpointIds={selectedCheckpointIds}
            onSave={handleSaveCheckpoint}
            onClose={() => setIsAddCheckpointOpen(false)}
          />
        )
      }
    </section>
  )
}

export default CheckpointList;
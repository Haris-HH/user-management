import { useMemo, useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";

// Components
import SearchInput from "../search-input/SearchInput";
import AddUser from "../add-user/AddUser";

// Icons
import DeleteIcon from "@mui/icons-material/Delete";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { User } from "../../types/common";

// Utils
import { capitalizeWords, formatPhone } from "../../utils/commonFunctions";

interface FormData {
  search: string;
}

const UserList = () => {
  // i18n
  const { t } = useTranslation();

  // State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // Data
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    search: "",
  });

  const selectedUserIds = useMemo(
    () => selectedUsers.map((user) => user.user_id),
    [selectedUsers]
  );

  const filterSelectedUsers = useMemo(() => {
    const keyword = formData.search.trim().toLowerCase();

    if (!keyword) return selectedUsers;

    return selectedUsers.filter((user) => {
      const searchable = [
        capitalizeWords(
          `${user.title ?? ""} ${user.firstname ?? ""} ${user.lastname ?? ""}`
        ),
        user.org_name,
        user.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [formData.search, selectedUsers]);

  const handleSaveUsers = (users: User[]) => {
    setSelectedUsers(users);
    setIsAddUserOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.user_id !== userId));
  };

  const handleDeleteAllUsers = () => {
    setSelectedUsers([]);
  }

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section id="user-list">
      <Box className="flex flex-col gap-2">
        <Box className="flex justify-between items-center">
          <Typography
            component="span"
            style={{ color: "var(--primary-color)", fontWeight: 500 }}
          >
            {t("text.user-list")}
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
            onClick={() => setIsAddUserOpen(true)}
          >
            {t("button.add-user-2")}
          </Button>
        </Box>

        <Box className="flex flex-col bg-(--main-bg-color) p-2 gap-2">
          <Box className="flex justify-between items-center">
            <p className="text-[14px] text-(--secondary-color) font-medium">
              {`${selectedUsers.length} ${t("text.list")}`}
            </p>
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
              borderRadius: 0,
              backgroundColor: "var(--tertiary-color)",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    "& td, & th": {
                      padding: "0px",
                      height: "56.5px",
                      fontSize: "15px",
                      borderBottom: "1px solid var(--primary-color)",
                    },
                    "& .MuiTableCell-root": {
                      backgroundColor: "var(--tertiary-color)",
                      color: "var(--secondary-color)",
                      borderBottom: "1px solid var(--primary-color)",
                    },
                  }}
                >
                  <TableCell sx={{ width: "10%", textAlign: "center" }}>
                    {t("table.header.no")}
                  </TableCell>
                  <TableCell sx={{ width: "15%", textAlign: "center" }}>
                    {t("table.header.full-name")}
                  </TableCell>
                  <TableCell sx={{ width: "15%", textAlign: "center" }}>
                    {t("table.header.agency")}
                  </TableCell>
                  <TableCell sx={{ width: "20%", textAlign: "center" }}>
                    {t("table.header.mobile")}
                  </TableCell>
                  <TableCell sx={{ width: "20%", textAlign: "center" }}>
                    {t("table.header.user-group")}
                  </TableCell>
                  <TableCell sx={{ width: "10%", textAlign: "center" }}>
                    <IconButton onClick={() => handleDeleteAllUsers()}>
                      <DeleteIcon 
                        sx={{ 
                          fontSize: 20, 
                          color: selectedUsers.length > 0 ? "var(--trash-active-icon)" : "var(--trash-icon)",
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
                {filterSelectedUsers.length > 0 ? (
                  filterSelectedUsers.map((user, index) => {
                    const fullName = capitalizeWords(
                      `${user.title ?? ""} ${user.firstname ?? ""} ${user.lastname ?? ""}`
                    );

                    return (
                      <TableRow
                        key={user.user_id}
                        sx={{
                          "& .MuiTableCell-root": {
                            color: "var(--secondary-color)",
                            borderBottom: "1px solid var(--primary-color)",
                          },
                        }}
                      >
                        <TableCell align="center">{index + 1}</TableCell>
                        <TableCell align="center">{fullName || "-"}</TableCell>
                        <TableCell align="center">{user.ou_name || "-"}</TableCell>
                        <TableCell align="center">{formatPhone(user.phone) || "-"}</TableCell>
                        <TableCell align="center">{user.user_group_name || "-"}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => handleDeleteUser(user.user_id)}>
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

      {isAddUserOpen && (
        <AddUser
          open={isAddUserOpen}
          selectedUserIds={selectedUserIds}
          onSave={handleSaveUsers}
          onClose={() => setIsAddUserOpen(false)}
        />
      )}
    </section>
  );
};

export default UserList;
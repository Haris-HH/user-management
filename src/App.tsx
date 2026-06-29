import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import "./App.css";

// Layouts
import MainLayout from "./layout/MainLayout";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import AddApproveUser from "./pages/AddApproveUser";
import UserForm from "./pages/UserForm";
import UserGroupManagement from "./pages/UserGroupManagement";
import ManageUser from "./pages/ManageUser";
import ManageWatchListCheckpoint from "./pages/ManageWatchListCheckpoint";
import ManageWatchListPerson from "./pages/ManageWatchListPerson";
import ManageWatchListPlate from "./pages/ManageWatchListPlate";
import ManageCheckpointGroup from "./pages/ManageCheckpointGroup";
import StatisticTopUsers from "./pages/StatisticTopUsers";

// API
import {
  fetchArea,
  fetchAgency,
  fetchBh,
  fetchBk,
  fetchOrg,
  fetchProvince,
  fetchTitle,
  fetchLprRegion,
  fetchPosition,
  fetchUserGroup,
  fetchPoliceStation,
  fetchStatus,
} from "./features/dropdown/api/DropdownSlice";

// Store
import { useAppDispatch } from "./store/hooks";
import type { RootState } from "./store/store";

// i18n
import { useTranslation } from "react-i18next";

// Hooks
import { useForceLogout } from "./hooks/useForceLogout";

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { forceLogout } = useForceLogout();

  const { i18n } = useTranslation();

  const { user } = useSelector((state: RootState) => state.authUser);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const savedLanguage = localStorage.getItem("language");

    if (savedLanguage) {
      i18n.changeLanguage(JSON.parse(savedLanguage).code);
    }

    if (savedTheme) {
      const theme = JSON.parse(savedTheme);

      document.documentElement.style.setProperty("--primary-color", theme.primary);
      document.documentElement.style.setProperty("--primary-color-rgb", theme.rgb);
    }
  }, [i18n]);

  useEffect(() => {
    if (!user) return;

    dispatch(fetchArea({ limit: "100" }));
    dispatch(fetchAgency({ limit: "100" }));
    dispatch(fetchBh({ limit: "100" }));
    dispatch(fetchBk({ limit: "100" }));
    dispatch(fetchOrg({ limit: "100" }));
    dispatch(fetchProvince({ limit: "100" }));
    dispatch(fetchTitle({ limit: "100" }));
    dispatch(fetchLprRegion({ limit: "100" }));
    dispatch(fetchPosition({ limit: "100", filter: `category=police`  }));
    dispatch(fetchUserGroup({ limit: "100" }));
    dispatch(fetchPoliceStation({ limit: "100" }));
    dispatch(fetchStatus());
  }, [user, dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token && location.pathname !== "/login") {
      forceLogout(false);
    }
  }, [location.pathname, forceLogout]);

  useEffect(() => {
    const handleForceLogout = () => {
      forceLogout(false);
    };

    window.addEventListener("force-logout", handleForceLogout);

    return () => {
      window.removeEventListener("force-logout", handleForceLogout);
    };
  }, [forceLogout]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="add-approve-user" element={<AddApproveUser />} />
        <Route path="add-approve-user/add" element={<UserForm />} />
        <Route path="user-group-management" element={<UserGroupManagement />} />
        <Route path="manage-user" element={<ManageUser />} />
        <Route path="manage-watch-list-person" element={<ManageWatchListPerson />} />
        <Route path="manage-watch-list-plate" element={<ManageWatchListPlate />} />
        <Route path="manage-watch-list-checkpoint" element={<ManageWatchListCheckpoint />} />
        <Route path="manage-checkpoint-group" element={<ManageCheckpointGroup />} />
        <Route path="statistic-top-users" element={<StatisticTopUsers />} />
      </Route>
    </Routes>
  );
}

export default App;
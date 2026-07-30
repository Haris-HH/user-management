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
import NotFound from "./pages/NotFound";

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
import { useSse } from "./hooks/useSse";

function App() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { forceLogout } = useForceLogout();

  // i18n
  const { i18n } = useTranslation();

  // Redux
  const userId = useSelector((state: RootState) => state.authUser.user?.user_id);

  const enabled = Boolean(localStorage.getItem("accessToken"));

  /*
    Restore the persisted language. Theme restoration used to live here too,
    reading a legacy "theme" key that nothing writes any more; when a stale
    value survived it overwrote the --primary-color variables that
    ThemeProvider had just applied from "wd2-theme". ThemeProvider is now the
    single owner of the theme CSS variables.
  */
  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");

    if (!savedLanguage) return;

    try {
      const { code } = JSON.parse(savedLanguage) as { code?: string };

      if (code) i18n.changeLanguage(code);
    } catch (error) {
      console.error("Invalid persisted language:", error);
    }
  }, [i18n]);

  /*
    Masterdata is keyed off the user id rather than the user object so that
    an unrelated profile update (which replaces the object) does not refire
    all twelve reference-data requests.
  */
  useEffect(() => {
    if (!userId) return;

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
  }, [userId, dispatch]);

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

  const handleAutoLogout = async () => {
    await forceLogout(true);
  }

  useSse(
    "force-logout",
    handleAutoLogout,
    enabled
  );

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

        {/*
          Catch-all อยู่ใต้ MainLayout เพื่อให้หน้า 404 ยังมีแถบเมนูและ
          navigation ครบ ผู้ใช้จึงไปหน้าอื่นต่อได้ทันที ไม่ใช่เจอทางตัน
          ต้องอยู่ท้ายสุดเสมอ เพราะ route ที่ประกาศก่อนจะถูกจับคู่ก่อน
        */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
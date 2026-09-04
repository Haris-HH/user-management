import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { clearAuthUser } from "../features/auth-user/api/AuthUserSlice";
import { logoutApi } from "../features/login/api/LoginApi";
import { setAccessToken } from "../api/tokenStore";

export const useForceLogout = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const forceLogout = useCallback(
    async (callApi = false) => {
      try {
        if (callApi) {
          await logoutApi();
        }
      }
      catch (error) {
        // The session is being torn down regardless, so a failing logout
        // call must not block the local cleanup below.
        console.error("Logout request failed:", error);
      }
      finally {
        dispatch(clearAuthUser());

        setAccessToken(null);
        localStorage.removeItem("persist:root");

        navigate("/login", { replace: true });
      }
    },
    [dispatch, navigate]
  );

  return { forceLogout };
};
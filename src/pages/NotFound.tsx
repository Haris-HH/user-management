import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SearchOffIcon from "@mui/icons-material/SearchOff";

// Hooks
import usePageTitle from "../hooks/usePageTitle";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Constants
import { MOTION_DURATION } from "../constants/motion";

// i18n
import { useTranslation } from "react-i18next";

/**
 * หน้าสำหรับ URL ที่ไม่ตรงกับ route ใดเลย
 *
 * วางไว้เป็น route ลูกของ MainLayout โดยตั้งใจ ไม่ได้แยกออกมาเป็นหน้าเดี่ยว
 * ผู้ใช้ที่หลงมาถึงตรงนี้จึงยังมีแถบเมนูและ navigation อยู่ครบ กลับไปหน้าอื่นได้
 * โดยไม่ต้องพึ่งปุ่มบนหน้านี้อย่างเดียว
 */
const NotFound = () => {
  // i18n
  const { t } = useTranslation();

  const navigate = useNavigate();
  const location = useLocation();

  const prefersReducedMotion = useReducedMotion();

  // Set Page Title
  usePageTitle(t("pages.not-found"));

  return (
    <Box className="h-full w-full flex items-center justify-center p-6 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: MOTION_DURATION.slow / 1000,
          ease: "easeOut",
        }}
        className="flex flex-col items-center text-center gap-4 max-w-160"
      >
        <SearchOffIcon
          aria-hidden="true"
          sx={{ fontSize: 72, color: "var(--theme-accent)", opacity: 0.85 }}
        />

        <Typography
          component="p"
          sx={{
            fontSize: "5rem",
            fontWeight: "bold",
            lineHeight: 1,
            color: "var(--theme-accent)",
            textShadow: "0 0 24px rgba(var(--theme-accent-rgb), 0.35)",
          }}
        >
          404
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontSize: "1.6rem",
            fontWeight: "bold",
            color: "var(--theme-accent)",
          }}
        >
          {t("not-found.title")}
        </Typography>

        <Typography
          sx={{
            fontSize: "1rem",
            color: "var(--theme-accent-soft)",
            opacity: 0.85,
          }}
        >
          {t("not-found.description")}
        </Typography>

        {/* แสดง path ที่ผู้ใช้พยายามเข้า เพื่อให้เห็นได้ทันทีว่าพิมพ์ผิดตรงไหน
            หรือส่งลิงก์ผิดมา — `break-all` กัน URL ยาว ๆ ดันกล่องจนล้น */}
        <Box
          sx={{
            px: 2,
            py: 1,
            maxWidth: "100%",
            borderRadius: "12px",
            border: "1px solid rgba(var(--theme-accent-rgb), 0.25)",
            backgroundColor: "rgba(var(--theme-accent-rgb), 0.08)",
          }}
        >
          <Typography
            component="code"
            className="break-all"
            sx={{
              fontSize: "0.9rem",
              color: "var(--theme-accent)",
            }}
          >
            {location.pathname}
          </Typography>
        </Box>

        <Box className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate("/", { replace: true })}
            sx={{
              backgroundColor: "var(--theme-accent)",
              color: "var(--theme-panel)",
              textTransform: "none",
              px: 3,
              "&:hover": {
                backgroundColor: "rgba(var(--theme-accent-rgb), 0.85)",
              },
            }}
          >
            {t("not-found.back-home")}
          </Button>

          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{
              border: "1px solid var(--theme-accent)",
              color: "var(--theme-accent)",
              textTransform: "none",
              px: 3,
              "&:hover": {
                backgroundColor: "rgba(var(--theme-accent-rgb), 0.08)",
              },
            }}
          >
            {t("not-found.go-back")}
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

export default NotFound;

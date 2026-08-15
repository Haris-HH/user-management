import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { SubmitHandler } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import SkipNextIcon from "@mui/icons-material/SkipNext";

// Components
import MatrixRainingCode from "../components/matrix-raining-effect/MatrixRainingEffect";
import TextBox from "../components/text-box/TextBox";
import CinematicTitle from "../components/cinematic-title/CinematicTitle";
import LetterChargeEffect from "../components/letter-charge-effect/LetterChargeEffect";

// i18n
import { useTranslation } from "react-i18next";

// Hooks
import { useReducedMotion } from "../hooks/useReducedMotion";

// Constants
import { MOTION_DURATION } from "../constants/motion";

// API
import { loginApi } from "../features/login/api/LoginApi";
import { getUserApi } from "../features/users/api/UsersApi";
import { setAuthUser } from "../features/auth-user/api/AuthUserSlice";
import { getTitle, getAgency } from "../features/dropdown/api/DropdownApi";

// Utils
import { PopupMessage } from "../utils/popupMessage";
import { consumeLogoutReason } from "../utils/logoutReason";
import type { LogoutReason } from "../utils/logoutReason";

// Store
import { useAppDispatch } from "../store/hooks";

type FormData = {
  username: string;
  password: string;
}

const Login = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const version = __APP_VERSION__;

  // i18n
  const { t } = useTranslation();

  const prefersReducedMotion = useReducedMotion();

  /*
    ผู้ที่เปิด "ลดการเคลื่อนไหว" ไว้จะข้ามอินโทรตั้งแต่เฟรมแรก ไม่ต้องรอแล้ว
    ค่อยข้าม — ตั้งค่าเริ่มต้นจาก media query โดยตรงแทนที่จะ setState ใน effect
    เพื่อไม่ให้เห็นอินโทรแวบหนึ่งก่อนหายไป
  */
  // State
  const [introDone, setIntroDone] = useState(prefersReducedMotion);
  const [skipIntro, setSkipIntro] = useState(prefersReducedMotion);
  const [loading, setLoading] = useState(false);

  /*
    อ่านครั้งเดียวตอน mount แล้วค่าจะถูกล้างทิ้ง ถ้าเข้าหน้านี้เองโดยไม่ได้ถูกไล่
    ออกมาก็จะได้ null และไม่มีอะไรแสดง
  */
  const [endedReason] = useState<LogoutReason | null>(consumeLogoutReason);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    username: "",
    password: "",
  });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormData>();

  useEffect(() => {
    if (prefersReducedMotion) return;

    const timer = setTimeout(() => {
      setIntroDone(true);
    }, 5500);

    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  const finishIntro = () => {
    setSkipIntro(true);
    setIntroDone(true);
  };

  /*
    อินโทรบังฟอร์ม login อยู่ 5.5 วินาที เดิมข้ามได้ทางการคลิกพื้นหลังเท่านั้น
    ซึ่งไม่มีอะไรบอกผู้ใช้ และผู้ที่ใช้คีย์บอร์ดล้วนข้ามไม่ได้เลย ต้องนั่งรอ
    ทุกครั้งที่เข้าระบบ ปุ่มข้ามด้านล่างแก้เรื่องการมองเห็น ส่วนตัวจับปุ่มนี้
    แก้เรื่องคีย์บอร์ด
  */
  useEffect(() => {
    if (introDone) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
        finishIntro();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [introDone]);

  const handleTextChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setValue(key, value);
  };

  const handleFormSubmit: SubmitHandler<FormData> = async (data) => {
    setLoading(true);

    try {
      const result = await loginApi({
        username: data.username,
        password: data.password,
      });

      localStorage.setItem("accessToken", result.accessToken);

      if (result.userId) {
        const userResponse = await getUserApi({ filter: `user_id=${result.userId}` });
        const titleData = await getTitle({ filter: `id=${userResponse.data[0]?.title_id}` });
        const nsbOuData = await getAgency({ filter: `ou_code=${userResponse.data[0]?.ou_code}` });
        
        dispatch(
          setAuthUser({
            user_id: userResponse.data[0]?.user_id ?? "-",
            hash_id: userResponse.data[0]?.hash_id ?? "-",
            title_name_th: titleData.data[0]?.title_abbr_th ?? "",
            title_name_en: titleData.data[0]?.title_abbr_en ?? "",
            first_name: userResponse.data[0]?.firstname ?? "-",
            last_name: userResponse.data[0]?.lastname ?? "-",
            image_url: userResponse.data[0]?.image_url ?? "-",
            permission: userResponse.data[0]?.permissions ?? {},
            agency: {
              ou_code: userResponse.data[0]?.ou_code,
              ou_abbr_th: nsbOuData.data[0]?.ou_abbr_th ?? "-",
              ou_abbr_en: nsbOuData.data[0]?.ou_abbr_en ?? "-",
            },
          })
        );
      }

      navigate("/", { replace: true });
    }
    catch {
      await PopupMessage(t("popup.login-failed-title"), t("popup.login-failed-message"), "error");
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="login"
      onClick={finishIntro}
      className="h-screen w-screen flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: "var(--secondary-color-a10)"
      }}
    >
      {
        introDone && <MatrixRainingCode className="absolute inset-0" />
      }

      {introDone && <LetterChargeEffect />}

      {/* INTRO OVERLAY */}
      <AnimatePresence mode="wait">
        {!introDone && (
          <motion.div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center"
            style={{
              background: "var(--tertiary-color)",
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            /* 1 วินาทีคือเวลาที่ผู้ใช้ต้องรออีกต่อหนึ่งหลัง intro จบแล้ว ย่อลงมา
               อยู่ในงบของ overlay (400ms) */
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <CinematicTitle skipIntro={skipIntro} />

            {/* ปุ่มข้าม — โฟกัสได้ด้วยคีย์บอร์ดและ screen reader อ่านออก
                ต่างจากการคลิกที่พื้นหลังซึ่งไม่มีอะไรบอกว่าทำได้ */}
            <Button
              variant="outlined"
              startIcon={<SkipNextIcon />}
              onClick={(event) => {
                event.stopPropagation();
                finishIntro();
              }}
              sx={{
                position: "absolute",
                bottom: 32,
                right: 32,
                zIndex: 60,
                fontSize: "14px",
                height: "36px",
                px: 2.5,
                textTransform: "capitalize",
                border: "1px solid var(--primary-color)",
                color: "var(--primary-color)",
                backgroundColor: "var(--tertiary-color-a60)",
                "&:hover": {
                  border: "1px solid var(--primary-color)",
                  backgroundColor: "var(--primary-color-a10)",
                },
              }}
            >
              {t("button.skip-intro")}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LOGIN CARD */}
      <div className="flex flex-col items-center gap-3 z-30">
      {/*
        บอกว่าทำไมถึงกลับมาอยู่หน้า login - ไม่งั้นการถูกไล่ออกจากระบบเพราะมีการ
        เข้าใช้งานบัญชีเดียวกันที่อื่น จะดูไม่ต่างจาก session หมดอายุตามปกติ
      */}
      {endedReason === "signed-in-elsewhere" && (
        <motion.p
          role="status"
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : -12 }}
          animate={{
            opacity: introDone ? 1 : 0,
            y: introDone || prefersReducedMotion ? 0 : -12,
          }}
          transition={{ duration: MOTION_DURATION.slow / 1000 }}
          className="w-122 px-4 py-2.5 rounded-lg text-center text-sm"
          style={{
            backgroundColor: "var(--tertiary-color-a80)",
            border: "1px solid var(--primary-color)",
            color: "var(--primary-color)",
          }}
        >
          {t("text.signed-in-elsewhere")}
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 40 }}
        animate={{
          opacity: introDone ? 1 : 0,
          y: introDone || prefersReducedMotion ? 0 : 40,
        }}
        transition={{ duration: MOTION_DURATION.slow / 1000 }}
        className="flex flex-col w-122 h-90 rounded-lg z-30"
        style={{
          backgroundColor: "var(--tertiary-color-a80)",
          border: "1px solid var(--primary-color)",
        }}
      >
        {/* Header */}
        <div className="flex gap-2 items-center justify-center p-4">
          <img
            src="/project-logo/logo.png"
            alt="Logo"
            className="w-17 h-17"
          />
          <div
            className="flex flex-col text-(--primary-color)"
          >
            <Typography
              variant="h6"
              sx={{ fontSize: "1.8rem", fontWeight: "bold", textShadow: "1px 2px 2px var(--tertiary-color)" }}
            >
              {t('project.title')}
            </Typography>
            <Typography
              variant="h6"
              sx={{ fontSize: "0.8rem", mt: -1, textShadow: "1px 1px 2px var(--tertiary-color)" }}
            >
              {t('project.subtitle')}
            </Typography>
          </div>
        </div>

        {/* Form */}
        <form
          className="px-6 py-4 h-full"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <Box className="w-full h-19">
            <TextBox
              id="username"
              label=""
              placeholder={t("placeholder.pid")}
              value={formData.username}
              autoComplete="username"
              onChange={(e) =>
                handleTextChange("username", e.target.value)
              }
              register={register("username", { required: true })}
              helperText={
                errors.username
                  ? t("helperText.please-input-pid")
                  : ""
              }
              error={!!errors.username}
              minHeight="40px"
              labelFontSize="16px"
            />
          </Box>

          <Box className="w-full h-15.75 -mt-2.5">
            <TextBox
              id="password"
              type="password"
              label=""
              placeholder={t("placeholder.password")}
              value={formData.password}
              onChange={(e) =>
                handleTextChange("password", e.target.value)
              }
              register={register("password", { required: true })}
              helperText={
                errors.password
                  ? t("helperText.please-input-password")
                  : ""
              }
              error={!!errors.password}
              minHeight="40px"
              labelFontSize="16px"
            />
          </Box>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading || prefersReducedMotion ? 1 : 1.05 }}
            style={{
              backgroundColor: "var(--primary-color)",
              width: "100%",
              height: "50px",
              borderRadius: "5px",
              marginTop: "10px",
              color: "var(--tertiary-color)",
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? t("button.loading") : t("button.login")}
          </motion.button>
        </form>

        {/* Footer */}
        <div
          className="flex justify-center items-center w-full h-15"
          style={{
            backgroundColor: "var(--primary-color-a10)",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontSize: "0.9rem",
              color: "var(--primary-color)",
            }}
          >
            {`${t('text.app-version')}: ${version}`}
          </Typography>
        </div>
      </motion.div>
      </div>
    </section>
  );
};

export default Login;
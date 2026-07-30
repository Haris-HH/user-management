import { motion } from "framer-motion";

// Material UI
import Typography from "@mui/material/Typography";

// Hooks
import { useReducedMotion } from "../../hooks/useReducedMotion";

type Props = {
  title: string;
};

const MainTitle = ({ title }: Props) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    /*
      เดิมมี `transition: "ease 0.5s"` ซึ่งเบราว์เซอร์ตีความเป็น
      `transition: all 0.5s ease` (property ปริยายคือ all) แต่คอมโพเนนต์นี้ไม่มี
      property ใดเปลี่ยนสถานะเลย มันจึงมีผลแค่ทำให้สีค่อย ๆ ไล่ตอนสลับธีม
      ซึ่งไม่ใช่สิ่งที่ตั้งใจ จึงถอดออก
    */
    <Typography
      component="div"
      variant="h6"
      sx={{
        position: "relative",
        display: "inline-block",
        fontSize: "1.4rem",
        fontWeight: "bold",
        color: "var(--primary-color)",
        textShadow: `5px 3px 5px var(--tertiary-color)`,
        overflow: "hidden",
        width: "fit-content",
      }}
    >
      {/* Title Text */}
      {title}

      {/*
        เส้นใต้กวาดไปมาแบบไม่รู้จบ และคอมโพเนนต์นี้อยู่บนหัวข้อของทุกหน้า จึงเป็น
        การเคลื่อนไหวถาวรที่ผู้ใช้หยุดไม่ได้ (เข้าข่าย WCAG 2.2.2) เมื่อขอลด
        การเคลื่อนไหวจึงเหลือเป็นเส้นใต้นิ่ง ๆ ซึ่งยังทำหน้าที่ตกแต่งได้เหมือนเดิม
      */}
      <motion.span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          bottom: "3px",
          height: "3px",
          width: "100%",
          background: "var(--primary-color)",
          border: "0.25px solid var(--tertiary-color)",
          transformOrigin: "left",
          borderRadius: "999px",
          boxShadow: "0 0 8px var(--primary-color)",
        }}
        animate={
          prefersReducedMotion
            ? { scaleX: 1, x: "0%" }
            : {
                scaleX: [0, 1, 0],
                x: ["0%", "0%", "100%"],
              }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }
        }
      />
    </Typography>
  );
};

export default MainTitle;
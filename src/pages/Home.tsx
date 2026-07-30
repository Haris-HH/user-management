import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Hooks
import { useDockItems } from "../hooks/useDockItems";
import { useReducedMotion } from "../hooks/useReducedMotion";

// Constants
import { MOTION_DURATION } from "../constants/motion";

const Home = () => {
  const navigate = useNavigate();
  const dockItems = useDockItems();

  const prefersReducedMotion = useReducedMotion();

  /*
    การ์ดที่ถูก hover พร้อมจุดกำเนิดของวงกลม clip-path เก็บรวมเป็นก้อนเดียวและ
    บันทึกครั้งเดียวตอนเคอร์เซอร์เข้าการ์ด

    เดิมพิกัดถูกอัปเดตผ่าน onMouseMove ซึ่งยิงที่ ~60-120Hz ทำให้เกิดสองปัญหา
    พร้อมกัน: getBoundingClientRect บังคับ layout ทุก event และ setState ทำให้
    การ์ดทุกใบ re-render ใหม่หมด แต่ที่แย่กว่าคือค่าเป้าหมายของ clipPath
    เปลี่ยนทุกเฟรม framer-motion จึงเล็งเป้าใหม่ตลอดและวงกลมไม่มีวันขยายจนสุด

    ตอนนี้เหลือ setState ครั้งเดียวต่อการ hover หนึ่งครั้ง ซึ่งไม่ใช่ปัญหาด้าน
    ประสิทธิภาพ และวงกลมก็ขยายจากจุดที่เคอร์เซอร์เข้ามาจริง ๆ จนสุด
  */
  // Data
  const [hovered, setHovered] = useState<{
    index: number;
    x: number;
    y: number;
  } | null>(null);

  const handlePointerEnter = (
    event: React.PointerEvent<HTMLDivElement>,
    index: number
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setHovered({
      index,
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <section id="home" className="h-full w-full">
      <div className="grid h-full grid-cols-2 [@media(max-height:780px)]:grid-cols-1 gap-4 p-4">
        {dockItems.filter((item) => item.subMenu).map((item, index) => {
          const isHovered = hovered?.index === index;
          const pointer = isHovered ? hovered : { x: 50, y: 50 };

          return (
            <motion.div
              key={item.label}
              onPointerEnter={(event) => handlePointerEnter(event, index)}
              onPointerLeave={() => setHovered(null)}
              className="
                menu relative flex cursor-pointer flex-col overflow-hidden
                rounded-2xl border p-6 min-h-70
              "
              style={{
                borderColor: "var(--primary-color)",
                backgroundColor: "rgba(var(--tertiary-color-rgb), 0.8)",
              }}
            >
              <AnimatePresence mode="wait">
                {isHovered && (
                  /*
                    ลดการเคลื่อนไหว: วงกลมที่ขยายออกคือการเคลื่อนที่ล้วน ๆ จึง
                    เหลือไว้แค่ cross-fade ซึ่งยังบอกสถานะ hover ได้เหมือนเดิม
                  */
                  <motion.div
                    key={`hover-bg-${index}`}
                    initial={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : {
                            clipPath: `circle(0% at ${pointer.x}% ${pointer.y}%)`,
                            opacity: 1,
                          }
                    }
                    animate={
                      prefersReducedMotion
                        ? { opacity: 1 }
                        : {
                            clipPath: `circle(150% at ${pointer.x}% ${pointer.y}%)`,
                            opacity: 1,
                          }
                    }
                    exit={
                      prefersReducedMotion
                        ? { opacity: 0 }
                        : {
                            clipPath: `circle(0% at ${pointer.x}% ${pointer.y}%)`,
                            opacity: 1,
                          }
                    }
                    transition={{
                      duration: MOTION_DURATION.base / 1000,
                      ease: "easeOut",
                    }}
                    className="absolute inset-0 z-0"
                    style={{
                      background: "rgba(var(--secondary-color-rgb), 0.1)",
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Label Container */}
              <motion.div
                className={`
                  relative z-10 flex w-full
                  ${
                    isHovered
                      ? "items-start justify-start"
                      : "flex-1 items-center justify-center"
                  }
                `}
              >
                <motion.h3
                  className="
                    menu-title relative
                    font-bold text-(--primary-color)
                    text-2xl md:text-4xl
                    pb-2
                  "
                >
                  {item.label}
                </motion.h3>
              </motion.div>

              {/* Spacer */}
              {isHovered && <div className="h-8" />}

              {/* Sub-menu */}
              <AnimatePresence>
                {isHovered && item.subMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: MOTION_DURATION.slow / 1000,
                      ease: "easeOut",
                    }}
                    className="
                      relative z-10
                      flex flex-col [@media(max-height:780px)]:grid [@media(max-height:700px)]:grid-cols-2 gap-3
                    "
                  >
                    {item.subMenu.map((sub, subIndex) => (
                      <motion.div
                        key={sub.label}
                        initial={{
                          opacity: 0,
                          x: prefersReducedMotion ? 0 : -20,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: MOTION_DURATION.base / 1000,
                          delay: prefersReducedMotion ? 0 : subIndex * 0.08,
                        }}
                        /* transition-colors ไม่ใช่ transition-all: มีแค่สีพื้นหลัง
                           กับสีตัวอักษรที่เปลี่ยนตอน hover */
                        className="
                          rounded-xl border border-(--primary-color)
                          bg-(--tertiary-bg-color)/10 px-4 py-3
                          backdrop-blur-sm
                          text-(--secondary-color)
                          hover:bg-(--primary-color)
                          hover:text-(--tertiary-color)
                          transition-colors duration-150
                        "
                        onClick={() => navigate(sub.path)}
                      >
                        <span className="text-sm md:text-base font-medium">
                          {sub.label}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default Home;
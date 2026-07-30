import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// i18n
import { useTranslation } from "react-i18next";

// Hooks
import { useReducedMotion } from "../../hooks/useReducedMotion";

/*
  จำนวน particle ต่อการคลิกหนึ่งครั้ง และเพดานรวมที่อยู่บนจอพร้อมกัน

  เดิมไม่มีเพดาน คลิกรัว ๆ จึงสะสมได้หลายร้อยชิ้น แต่ละชิ้นมี textShadow เรืองแสง
  ซึ่ง paint แพง เพดานนี้ทำให้กรณีแย่สุดถูกจำกัดไว้ที่สามชุดพร้อมกัน
*/
const PARTICLES_PER_BURST = 45;
const MAX_PARTICLES = 135;

type Particle = {
  id: number;
  char: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rotate: number;
};


const LetterChargeEffect = () => {

  // i18n
  const { t } = useTranslation();

  const prefersReducedMotion = useReducedMotion();

  // Data
  const [particles, setParticles] = useState<Particle[]>([]);

  /*
    Date.now() + index collided whenever two bursts landed inside the same
    millisecond, which produced duplicate React keys and made the cleanup
    below remove particles belonging to the other burst.
  */
  const nextParticleId = useRef(0);
  const timeoutIds = useRef<number[]>([]);

  // Pending cleanups must be cancelled so they cannot fire after unmount.
  useEffect(() => {
    const pending = timeoutIds.current;

    return () => {
      pending.forEach(window.clearTimeout);
    };
  }, []);

  const CHARS = t('project.title');

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    /* เอฟเฟกต์นี้เป็นการตกแต่งล้วน ๆ ไม่มีข้อมูลใดหายไปถ้าไม่แสดง */
    if (prefersReducedMotion) return;

    const clickX = e.clientX;
    const clickY = e.clientY;

    const newParticles: Particle[] = Array.from({
      length: PARTICLES_PER_BURST,
    }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 350;

      return {
        id: nextParticleId.current++,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        x: clickX + Math.cos(angle) * distance,
        y: clickY + Math.sin(angle) * distance,
        dx: clickX,
        dy: clickY,
        // Generated here rather than during render, so a re-render cannot
        // reshuffle the starting angle of an in-flight particle.
        rotate: Math.random() * 360,
      };
    });

    const newIds = new Set(newParticles.map((particle) => particle.id));

    /*
      ตัดชุดที่เก่าที่สุดทิ้งเมื่อเกินเพดาน ชุดที่ถูกตัดจะมี timeout ค้างอยู่แต่
      ไม่เป็นไร เพราะ filter ตาม id ทำงานได้แม้ particle นั้นถูกลบไปแล้ว
    */
    setParticles((prev) => [...prev, ...newParticles].slice(-MAX_PARTICLES));

    const timeoutId = window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newIds.has(p.id)));

      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
    }, 900);

    timeoutIds.current.push(timeoutId);
  };

  return (
    <div
      onClick={handleClick}
      className="fixed inset-0 pointer-events-auto z-20"
    >
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            initial={{
              x: particle.x,
              y: particle.y,
              opacity: 0,
              scale: 1.8,
              rotate: particle.rotate,
            }}
            animate={{
              x: particle.dx,
              y: particle.dy,
              opacity: [0, 1, 1, 0],
              scale: [1.8, 1.2, 0.3],
              rotate: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: "easeInOut",
            }}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              color: "var(--primary-color)",
              fontSize: "18px",
              fontWeight: "bold",
              textShadow: "0 0 8px var(--primary-color)",
              pointerEvents: "none",
            }}
          >
            {particle.char}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default LetterChargeEffect;
import { useEffect, useRef } from "react";

// Hooks
import { useTheme } from "../../hooks/useTheme";
import { useReducedMotion } from "../../hooks/useReducedMotion";

// Add props type so className is accepted
type MatrixRainingCodeProps = {
  className?: string;
};

const MatrixRainingCode = ({ className = "" }: MatrixRainingCodeProps) => {
  // Properly type canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();

  /*
    สีถูกอ่านจาก ThemeProvider แล้วเก็บไว้ใน ref

    เดิม draw() เรียก getComputedStyle(document.documentElement) สองครั้งต่อเฟรม
    = 50 ครั้งต่อวินาที ทั้งที่ค่าเปลี่ยนเฉพาะตอนสลับธีม แต่ละครั้งบังคับให้
    เบราว์เซอร์คำนวณ style ใหม่ ตอนนี้อ่านจาก context ตรง ๆ และเก็บใน ref เพื่อ
    ให้ลูป rAF เห็นค่าล่าสุดโดยไม่ต้องรีสตาร์ต animation ตอนเปลี่ยนธีม
  */
  const colorsRef = useRef({
    primary: theme.colors["--primary-color"],
    tertiaryRgb: theme.colors["--tertiary-color-rgb"],
  });

  useEffect(() => {
    colorsRef.current = {
      primary: theme.colors["--primary-color"],
      tertiaryRgb: theme.colors["--tertiary-color-rgb"],
    };
  }, [theme]);

  useEffect(() => {
    /* ตัวอักษรตกเต็มจอแบบไม่หยุดเป็นตัวกระตุ้นอาการเวียนศีรษะโดยตรง */
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COLUMN_WIDTH = 20;

    let width = 0;
    let height = 0;
    let drops: number[] = [];

    /*
      ปรับขนาด backing store ตาม devicePixelRatio ไม่อย่างนั้นตัวอักษรจะเบลอ
      บนจอความละเอียดสูง เพราะ canvas ถูกยืดจากบัฟเฟอร์ที่เล็กกว่าจริง
    */
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;

      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const columns = Math.floor(width / COLUMN_WIDTH);

      drops = new Array(columns).fill(1);
    };

    resize();

    const characters = "nsbusermanagement";
    const charArray = characters.split("");

    const frameRate = 25;
    let lastFrameTime = 0;
    let animationId: number;

    const draw = () => {
      const { primary, tertiaryRgb } = colorsRef.current;

      ctx.fillStyle = `rgba(${tertiaryRgb}, 0.12)`;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = primary;
      ctx.font = "15px Noto Sans Thai, sans-serif";

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        ctx.fillText(text, i * COLUMN_WIDTH, drops[i] * COLUMN_WIDTH);

        if (drops[i] * COLUMN_WIDTH > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    /* rAF ส่ง timestamp มาให้อยู่แล้ว จึงไม่ต้องเรียก Date.now() ทุกเฟรม */
    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTime > 1000 / frameRate) {
        draw();
        lastFrameTime = timestamp;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    /*
      เดิมมือถือไม่ผูก listener นี้ไว้เลย ทำให้หมุนจอแล้ว canvas ค้างขนาดเดิม
      จนภาพยืด ตอนนี้ผูกทุกอุปกรณ์ — resize บนมือถือเกิดไม่บ่อยจนต้องกังวล
    */
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`fixed top-0 left-0 z-[-1] ${className}`}
    />
  );
};

export default MatrixRainingCode;

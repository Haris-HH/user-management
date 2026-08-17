import { useState } from "react";

// Material UI
import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";
import type { SwitchProps } from "@mui/material/Switch";

// Constants
import { MOTION_DURATION } from "../../constants/motion";

const IosSwitch = styled((props: SwitchProps) => {
  const { onChange, checked, ...rest } = props;
  const [isChecked, setIsChecked] = useState<boolean>(checked ?? false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
    if (onChange) {
      onChange(event, event.target.checked);
    }
  };

  return (
    <Switch
      focusVisibleClassName=".Mui-focusVisible"
      disableRipple
      checked={isChecked}
      onChange={handleChange}
      {...rest}
    />
  );
})(({ theme }) => ({
  width: 45,
  height: 26,
  padding: 0,
  position: "relative",
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(19px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "#65C466",
        opacity: 1,
      },
    },
  },
  "& .MuiSwitch-thumb": {
    width: 22,
    height: 22,
    backgroundColor: "var(--theme-panel)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    fontWeight: "bold",
    color: "var(--theme-accent-soft)",
    "&:before": {
      content: '"Off"',
      position: "absolute",
      width: "100%",
      textAlign: "center",
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb": {
    backgroundColor: "var(--theme-accent-soft)",
    "&:before": {
      content: '"On"',
      color: "var(--theme-panel)",
    },
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: "var(--theme-accent-soft)",
    opacity: 1,
    /* 500ms ช้าเกินไปสำหรับ toggle — สวิตช์ต้องตอบสนองทันทีที่กด ไม่อย่างนั้น
       ผู้ใช้จะไม่แน่ใจว่าการกดติดหรือไม่ */
    transition: theme.transitions.create(["background-color"], {
      duration: MOTION_DURATION.fast,
    }),
  },
}));

export default IosSwitch;

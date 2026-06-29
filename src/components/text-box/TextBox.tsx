import React, { useState } from "react"

// Material UI
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

type TextBoxProps = {
  id?: string
  value?: string | number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  label: string
  placeholder?: string
  labelFontSize?: string
  sx?: object
  disabled?: boolean
  title?: string
  error?: boolean
  helperText?: string
  variant?: "outlined" | "filled" | "standard"
  required?: boolean
  type?: string
  register?: any;
  isMultiline?: boolean;
  rows?: number;
  autoComplete?: string;
  minHeight?: string;
  warningText?: string;
  startAdornment?: React.ReactNode;
}

const TextBox: React.FC<TextBoxProps> = ({
  id,
  value,
  onChange,
  onKeyDown,
  label,
  placeholder,
  labelFontSize = "14px",
  sx,
  disabled,
  title,
  error,
  helperText,
  variant = "outlined",
  required = false,
  type = "text",
  register,
  isMultiline = false,
  rows,
  autoComplete,
  minHeight = "30px",
  onBlur,
  warningText,
  startAdornment,
  ...props
}) => {
  // State
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === "password";
  const actualType = isPasswordType && showPassword ? "text" : type;

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event)
      if (register) {
        register.onChange({
          target: { name: register.name, value: event.target.value || "" },
        });
      }
    }
  }

  return (
    <div className="flex flex-col w-full">
      <Typography sx={{ fontSize: labelFontSize || undefined, color:'var(--primary-color)' }} variant='subtitle1'>
        {`${label}`}
        {
          required && <span className="text-red-500"> *</span>
        }
        {
          warningText && <span className="text-[#9F0C0C] ml-4">{warningText}</span>
        }
      </Typography>
      <TextField
        id={id}
        value={value}
        type={actualType}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        placeholder={placeholder || ""}
        disabled={disabled}
        error={error}
        helperText={helperText}
        variant={variant}
        multiline={isMultiline}
        rows={rows}
        autoComplete={autoComplete ?? (type === "password" ? "current-password" : undefined)}
        sx={{
          borderRadius: "5px",
          backgroundColor: "transparent",

          "& .MuiOutlinedInput-root": {
            backgroundColor: "var(--tertiary-color)",
            borderRadius: "5px",

            "& fieldset": {
              borderColor: "var(--primary-color)",
            },

            "&:hover fieldset": {
              borderColor: "var(--primary-color)",
            },

            "&.Mui-focused fieldset": {
              borderColor: "var(--primary-color)",
            },
          },

          "& .MuiInputBase-root": {
            height: minHeight,
            minHeight: minHeight,
            padding: "0 8px",
            fontSize: labelFontSize,
            color: "var(--primary-color)",
            display: "flex",
            alignItems: "center",
          },

          "& .MuiInputBase-input": {
            height: "100%",
            boxSizing: "border-box",
            padding: "0 !important",
            color: "var(--primary-color)",
            backgroundColor: "transparent !important",

            fontSize: "16px",
            fontFamily: "inherit",
            fontWeight: 400,
            lineHeight: 1.5,

            "&:-webkit-autofill": {
              WebkitBoxShadow:
                "0 0 0 1000px var(--tertiary-color) inset !important",
              WebkitTextFillColor:
                "var(--primary-color) !important",
              caretColor: "var(--primary-color)",

              fontSize: "16px",
              fontFamily: "inherit",
              fontWeight: 400,
              lineHeight: 1.5,

              transition: "background-color 5000s ease-in-out 0s",
            },

            "&:-webkit-autofill:hover": {
              WebkitBoxShadow:
                "0 0 0 1000px var(--tertiary-color) inset !important",
              WebkitTextFillColor:
                "var(--primary-color) !important",

              fontSize: "16px",
              fontFamily: "inherit",
            },

            "&:-webkit-autofill:focus": {
              WebkitBoxShadow:
                "0 0 0 1000px var(--tertiary-color) inset !important",
              WebkitTextFillColor:
                "var(--primary-color) !important",

              fontSize: "16px",
              fontFamily: "inherit",
            },
          },

          "& .MuiOutlinedInput-root.Mui-disabled": {
            backgroundColor: "rgba(var(--primary-color-rgb), 0.05) !important",
            cursor: "not-allowed",

            "& fieldset": {
              borderColor: "var(--primary-color) !important",
            },
          },

          "& .MuiInputBase-input.Mui-disabled": {
            color: "var(--primary-color) !important",
            WebkitTextFillColor: "var(--primary-color) !important",
            cursor: "not-allowed",
          },

          "& .MuiInputBase-root.Mui-disabled": {
            color: "var(--primary-color) !important",
          },

          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
          {
            WebkitAppearance: "none",
            margin: 0,
          },
          "& input[type=number]": {
            MozAppearance: "textfield",
          },

          ...sx,
        }}
        slotProps={{
          inputLabel: {
            sx: { 
              fontSize: labelFontSize,
            },
          },
          input: {
            startAdornment: startAdornment ? (
              <InputAdornment position="start">
                {startAdornment}
              </InputAdornment>
            ) : undefined,
            endAdornment: isPasswordType ? (
              <InputAdornment position="end" className="mr-2">
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  sx={{
                    padding: "4px",
                  }}
                >
                  {showPassword ? (
                    <VisibilityOff
                      sx={{ color: "var(--primary-color)", fontSize: "20px" }}
                    />
                  ) : (
                    <Visibility
                      sx={{ color: "var(--primary-color)", fontSize: "20px" }}
                    />
                  )}
                </IconButton>
              </InputAdornment>
            ) : type === "number" ? (
              <InputAdornment position="end">
                <Box sx={{ display:"flex", flexDirection:"column", mr: "-5px" }}>
                  <IconButton sx={{ p: 0, mt: "0px" }}>
                    <KeyboardArrowUpIcon
                      sx={{ 
                        color: "var(--primary-color)", 
                        fontSize: "20px",
                        "&:hover": {
                          backgroundColor: "rgba(var(--secondary-color-rgb), 0.2)",
                          cursor: "pointer"
                        } 
                      }}
                    />
                  </IconButton>
                  <IconButton sx={{ p: 0, mt: "-5px" }}>
                    <KeyboardArrowDownIcon
                      sx={{ 
                        color: "var(--primary-color)", 
                        fontSize: "20px",
                        "&:hover": {
                          backgroundColor: "rgba(var(--secondary-color-rgb), 0.2)",
                          cursor: "pointer"
                        } 
                      }}
                    />
                  </IconButton>
                </Box>
              </InputAdornment>
            ) : undefined,
          },
        }}
        title={title || ""}
        {...props}
      />
    </div>
  )
}

export default TextBox
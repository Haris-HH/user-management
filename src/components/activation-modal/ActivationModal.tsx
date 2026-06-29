import { useEffect, useState } from "react";
import dayjs from "dayjs";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";

// Icons
import EventIcon from "@mui/icons-material/Event";

// Components
import DatePickerBuddhist from "../date-picker-buddhist/DatePickerBuddhist";

// i18n
import { useTranslation } from "react-i18next";

type ActivationTime = "now" | "schedule";

export type ActivationConfirmData = {
  activationTime: ActivationTime;
  approveDate: Date;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ActivationConfirmData) => void;
};

const defaultApproveDate = () => dayjs().add(1, "day").toDate();

const ActivationModal = ({ open, onClose, onConfirm }: Props) => {
  // i18n
  const { t } = useTranslation();

  // Data
  const [activationTime, setActivationTime] = useState<ActivationTime>("now");
  const [approveDate, setApproveDate] = useState<Date>(defaultApproveDate());

  useEffect(() => {
    if (!open) {
      setActivationTime("now");
      setApproveDate(defaultApproveDate());
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm({
      activationTime,
      approveDate:
        activationTime === "now"
          ? new Date()
          : approveDate,
    });
  };

  const getOptionStyle = (value: ActivationTime) => {
    const isSelected = activationTime === value;

    return {
      p: 2,
      borderRadius: 2,
      cursor: "pointer",
      border: isSelected
        ? "1px solid var(--primary-color)"
        : "1px solid rgba(var(--primary-color-rgb), 0.25)",
      backgroundColor: isSelected
        ? "rgba(var(--primary-color-rgb), 0.12)"
        : "var(--tertiary-color)",
      transition: "0.2s",
      "&:hover": {
        backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
      },
    };
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      slotProps={{
        paper: {
          sx: {
            backgroundColor: "var(--tertiary-color)",
            borderRadius: "12px",
            border: "1px solid rgba(var(--primary-color-rgb), 0.35)",
            overflow: "hidden",
          },
        },
      }}
    >
      <DialogTitle sx={{ px: 3, pt: 3, pb: 1 }}>
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--primary-color)",
          }}
        >
          {t('text.confirm-activation')}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--secondary-color)",
          }}
        >
          {t('text.confirm-activation-detail')}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pb: 3 }}>
        <RadioGroup
          value={activationTime}
          onChange={(event) =>
            setActivationTime(event.target.value as ActivationTime)
          }
          sx={{ gap: 2 }}
        >
          <Paper
            variant="outlined"
            sx={getOptionStyle("now")}
            onClick={() => setActivationTime("now")}
          >
            <FormControlLabel
              value="now"
              control={<Radio />}
              label={
                <Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--primary-color)",
                    }}
                  >
                    {t('text.active-now')}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "var(--secondary-color)",
                    }}
                  >
                    {t('text.active-now-detail')}
                  </Typography>
                </Box>
              }
              sx={{
                m: 0,
                width: "100%",
                "& .MuiRadio-root": {
                  color: "var(--primary-color)",
                },
                "& .Mui-checked": {
                  color: "var(--primary-color)",
                },
              }}
            />
          </Paper>

          <Paper
            variant="outlined"
            sx={getOptionStyle("schedule")}
            onClick={() => setActivationTime("schedule")}
          >
            <FormControlLabel
              value="schedule"
              control={<Radio />}
              label={
                <Box>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--primary-color)",
                    }}
                  >
                    {t('text.schedule-for-later')}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: 13,
                      color: "var(--secondary-color)",
                    }}
                  >
                    {t('text.schedule-for-later-detail')}
                  </Typography>
                </Box>
              }
              sx={{
                m: 0,
                width: "100%",
                "& .MuiRadio-root": {
                  color: "var(--primary-color)",
                },
                "& .Mui-checked": {
                  color: "var(--primary-color)",
                },
              }}
            />
          </Paper>
        </RadioGroup>

        <Collapse in={activationTime === "schedule"} unmountOnExit>
          <Box sx={{ mt: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
              }}
            >
              <EventIcon
                sx={{
                  fontSize: 18,
                  color: "var(--primary-color)",
                }}
              />

              <Typography
                sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--primary-color)",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {t('text.activation-date')}
              </Typography>
            </Box>

            <DatePickerBuddhist
              id="approve-date"
              value={approveDate}
              onChange={(value) => {
                setApproveDate(value || defaultApproveDate());
              }}
              label=""
              labelFontSize="15px"
              className="w-full"
              minDate={dayjs().add(1, "day")}
              sx={{
                width: "100%",
                borderRadius: "5px",
                backgroundColor: "var(--tertiary-color)",
                "& .MuiOutlinedInput-root": {
                  color: "var(--primary-color)",
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
                "& .MuiOutlinedInput-input": {
                  fontSize: 16,
                },
                "& .MuiSvgIcon-root": {
                  color: "var(--primary-color)",
                },
              }}
            />
          </Box>
        </Collapse>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 1,
          backgroundColor: "rgba(var(--primary-color-rgb), 0.06)",
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            width: 130,
            height: 35,
            backgroundColor: "var(--tertiary-color)",
            border: "1px solid var(--primary-color)",
            color: "var(--primary-color)",
            textTransform: "capitalize",
            "&:hover": {
              backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
              border: "1px solid var(--primary-color)",
            },
          }}
        >
          {t("button.cancel")}
        </Button>

        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={{
            width: 130,
            height: 35,
            backgroundColor: "var(--primary-color)",
            color: "var(--tertiary-color)",
            textTransform: "capitalize",
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "rgba(var(--primary-color-rgb), 0.85)",
              boxShadow: "none",
            },
          }}
        >
          {t("button.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ActivationModal;
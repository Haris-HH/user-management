import { useEffect, useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

// Components
import Dialog from '../dialog/Dialog';
import IosSwitch from "../switch/IosSwitch";
import AutoComplete from '../auto-complete/AutoComplete';

// Types
import type { OptionType } from "../../types/common";

// i18n
import { useTranslation } from 'react-i18next';

interface FormData {
  date: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  isShowToggle?: boolean;
}

const UpdateProfile = ({ 
  open, 
  onClose,
  isShowToggle = false,
}: Props) => {

  // i18n
  const { t } = useTranslation();

  // State
  const [scheduleStatus, setScheduleStatus] = useState(false);

  // Options
  const [dateOptions, setDateOptions] = useState<{ label: string, value: string }[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    date: "20",
  });

  useEffect(() => {
    const option = Array.from({ length: 31 }).map((_, index) => ({
      label: `${index + 1}`,
      value: `${index + 1}`,
    }))
    setDateOptions(option);
  }, []);

  const handleDropdownChange = (
    event: React.SyntheticEvent,
    key: keyof typeof formData,
    value: string | OptionType,
  ) => {
    event.preventDefault();
    setFormData((prev) => ({ ...prev, [key]: typeof value === "string" ? value : value?.value ?? 0 }));
  };

  return (
    <Dialog
      open={open}
      handleClose={onClose}
      dialogTitle={t('dialog.update-profile')}
      width="600px"
    >
      <Box className={`flex flex-col ${isShowToggle ? "gap-1": "gap-4"} text-(--primary-color)`}>
        {
          isShowToggle ?
          (
            <>
              <Box className='flex items-center justify-center h-25'>
                <p className='text-[20px]'>{t('text.update-profile-now')}</p>
              </Box>
            </>
          ) :
          (
            <Box className='flex flex-col pt-3 gap-3'>
              <Box className='flex justify-between items-center'>
                <p className='text-[20px]'>{t('text.update-profile-schedule')}</p>

                {/* Status */}
                <Box className='flex items-center justify-end space-x-2'>
                  <p className='text-[20px]'>{`${t('text.status')} :`}</p>
                  <IosSwitch onChange={() => setScheduleStatus(!scheduleStatus)} checked={scheduleStatus} />
                </Box>
              </Box>

              {/* Description */}
              <Box className='flex items-center justify-center'>
                <p className='text-[20px]'>{t('text.update-profile-auto')}</p>
              </Box>

              {/* Date Select */}
              <Box className='flex items-center justify-center'>
                <Box className='flex items-center justify-center text-[20px] gap-5'>
                  <span>{t('text.every-date')}</span>
                  <Box className='w-25'>
                    <AutoComplete 
                      id="date-select"
                      sx={{ marginTop: "5px" }}
                      value={formData.date}
                      onChange={(event, value) => handleDropdownChange(event, "date", value)}
                      options={dateOptions}
                      label=""
                      labelFontSize="16px"
                    />
                  </Box>
                  <span>{t('text.every-month')}</span>
                </Box>
              </Box>
            </Box>
          )
        }

        <Box className='flex items-center justify-center gap-2'>
          <Button
            variant="outlined"
            sx={{
              width: 130,
              height: 35,
              backgroundColor: "var(--tertiary-color)",
              border: "1px solid var(--primary-color)",
              color: "var(--primary-color)",
              "&:hover": {
                backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
              },
              textTransform: "capitalize",
              boxShadow: "0px 3px 3px rgba(0, 0, 0, 0.2)",
            }}
          >
            {t('button.cancel')}
          </Button>
          <Button
            variant="contained"
            sx={{
              width: 130,
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              "&:hover": {
                backgroundColor: "rgba(var(--primary-color-rgb), 0.8)",
              },
              textTransform: "capitalize",
              boxShadow: "0px 3px 3px rgba(0, 0, 0, 0.2)",
            }}
          >
            {t('button.confirm')}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

export default UpdateProfile;
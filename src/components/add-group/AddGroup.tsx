import { useState } from 'react'
import { useForm } from "react-hook-form";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

// Components
import Dialog from '../dialog/Dialog';
import TextBox from '../text-box/TextBox';

// i18n
import { useTranslation } from 'react-i18next';

interface FormData {
  groupName: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (groupName: string) => void;
}

const AddGroup = ({ 
  open, 
  onClose,
  onConfirm,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    groupName: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    setError,
    clearErrors,
    reset,
    trigger,
  } = useForm<FormData>();

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleConfirmClick = (data: FormData) => {
    onConfirm(data.groupName);
    handleClose();
  }

  const handleClose = () => {
    reset();
    setFormData({ groupName: "" });
    onClose();
  };

  return (
    <Dialog
      open={open}
      handleClose={handleClose}
      dialogTitle={t('dialog.add-group')}
      width="600px"
    >
      <form className="flex flex-col gap-4 pt-3" onSubmit={handleSubmit(handleConfirmClick)}>
        <TextBox
          sx={{ marginTop: "5px" }}
          id="group-name"
          label={t('component.group-name')}
          placeholder={t('placeholder.group-name')}
          labelFontSize="16px"
          value={formData.groupName}
          onChange={(event) =>
            handleTextChange("groupName", event.target.value)
          }
          helperText={errors.groupName?.message?.toString() ?? ""}
          register={register("groupName", {
            required: t("text.text-required", { textField: t("component.group-name") }),
          })}
          error={!!errors.groupName}
        />
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
                backgroundColor:  "rgba(var(--secondary-color-rgb), 0.1)",
              },
              textTransform: "capitalize",
              boxShadow: "0px 3px 3px rgba(0, 0, 0, 0.2)",
            }}
            onClick={handleClose}
          >
            {t('button.cancel')}
          </Button>
          <Button
            type='submit'
            variant="contained"
            sx={{
              width: 130,
              height: 35,
              backgroundColor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              "&:hover": {
                backgroundColor:  "rgba(var(--primary-color-rgb), 0.8)",
              },
              textTransform: "capitalize",
              boxShadow: "0px 3px 3px rgba(0, 0, 0, 0.2)",
            }}
          >
            {t('button.confirm')}
          </Button>
        </Box>
      </form>
    </Dialog>
  )
}

export default AddGroup;
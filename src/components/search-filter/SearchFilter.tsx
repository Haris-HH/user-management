import React, { useState } from 'react'

// Material UI
import Button from "@mui/material/Button";

import SearchIcon from '@mui/icons-material/Search';

// Components
import Dialog from '../dialog/Dialog';
import TextBox from '../text-box/TextBox';
import AutoComplete from '../auto-complete/AutoComplete';

// i18n
import { useTranslation } from 'react-i18next';

// Types
import type { OptionType } from "../../types/common";

interface FormData {
  pid: string;
  name: string;
  agency: string;
  bh: string;
  bk: string;
  org: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
}

const SearchFilter = ({ 
  open, 
  onClose,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  // Options
  const [agencyOptions, setAgencyOptions] = useState<{ label: string, value: string }[]>([]);
  const [bhOptions, setBhOptions] = useState<{ label: string, value: string }[]>([]);
  const [bkOptions, setBkOptions] = useState<{ label: string, value: string }[]>([]);
  const [orgOptions, setOrgOptions] = useState<{ label: string, value: string }[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    pid: "",
    name: "",
    agency: "",
    bh: "",
    bk: "",
    org: "",
  });

  const handleTextChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

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
      dialogTitle={t('dialog.search-condition')}
      width="1400px"
    >
      <div className="grid grid-cols-3 gap-2 pt-5 px-5">
        <TextBox
          sx={{ marginTop: "5px" }}
          id="pid"
          label={t('component.pid')}
          placeholder={t('placeholder.pid')}
          labelFontSize="16px"
          value={formData.pid}
          onChange={(event) =>
            handleTextChange("pid", event.target.value)
          }
        />

        <TextBox
          sx={{ marginTop: "5px" }}
          id="name"
          label={t('component.fullname')}
          placeholder={t('placeholder.fullname')}
          labelFontSize="16px"
          value={formData.name}
          onChange={(event) =>
            handleTextChange("name", event.target.value)
          }
        />

        <AutoComplete 
          id="agency-select"
          sx={{ marginTop: "5px" }}
          value={formData.agency}
          onChange={(event, value) => handleDropdownChange(event, "agency", value)}
          options={agencyOptions}
          label={t('component.agency')}
          placeholder={t('placeholder.agency')}
          labelFontSize="16px"
        />

        <AutoComplete 
          id="bh-select"
          sx={{ marginTop: "5px" }}
          value={formData.bh}
          onChange={(event, value) => handleDropdownChange(event, "bh", value)}
          options={bhOptions}
          label={t('component.bh')}
          placeholder={t('placeholder.bh')}
          labelFontSize="16px"
        />

        <AutoComplete 
          id="bk-select"
          sx={{ marginTop: "5px" }}
          value={formData.bk}
          onChange={(event, value) => handleDropdownChange(event, "bk", value)}
          options={bkOptions}
          label={t('component.bk')}
          placeholder={t('placeholder.bk')}
          labelFontSize="16px"
        />

        <AutoComplete 
          id="org-select"
          sx={{ marginTop: "5px" }}
          value={formData.org}
          onChange={(event, value) => handleDropdownChange(event, "org", value)}
          options={orgOptions}
          label={t('component.org')}
          placeholder={t('placeholder.org')}
          labelFontSize="16px"
        />

        <div className='col-span-3 flex items-center justify-center pt-5 gap-2'>
          <Button
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
              "& .MuiButton-startIcon svg": {
                color: "var(--tertiary-color)",
              },
            }}
            startIcon={<SearchIcon />}
          >
            {t('button.search')}
          </Button>
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
              textTransform: "capitalize"
            }}
          >
            {t('button.clear')}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}

export default SearchFilter;
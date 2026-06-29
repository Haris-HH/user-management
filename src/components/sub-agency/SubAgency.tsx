import { useState } from "react";

// Material UI
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

// Components
import TextBox from "../../components/text-box/TextBox";

// i18n
import { useTranslation } from 'react-i18next';

// Constants
import { MAX_SUB_AGENCY } from "../../hooks/useColumnItems";

type Props = {
  value?: string[];
  onChange?: (values: string[]) => void;
};

const SubAgency = ({ value, onChange }: Props) => {
  // i18n
  const { t } = useTranslation();

  const [subAgencies, setSubAgencies] = useState<string[]>(
    value && value.length > 0 ? value : [""]
  );

  const updateSubAgencies = (newValues: string[]) => {
    setSubAgencies(newValues);
    onChange?.(newValues);
  };

  const handleAddClick = () => {
    if (subAgencies.length >= MAX_SUB_AGENCY) return;

    updateSubAgencies([...subAgencies, ""]);
  };

  const handleRemoveClick = (index: number) => {
    if (subAgencies.length === 1) return;

    const newValues = subAgencies.filter((_, itemIndex) => itemIndex !== index);
    updateSubAgencies(newValues);
  };

  const handleTextChange = (index: number, text: string) => {
    const newValues = [...subAgencies];
    newValues[index] = text;

    updateSubAgencies(newValues);
  };

  return (
    <>
      {subAgencies.map((subAgency, index) => (
        <Box
          key={`sub-agency-${index}`}
          sx={{
            display: "flex",
            alignItems: "flex-end",
            gap: 1,
          }}
        >
          <TextBox
            sx={{ marginTop: "5px" }}
            id={`sub-agency-${index + 1}`}
            label={t('component.sub-agency', { number: index + 1 })}
            placeholder={t('placeholder.sub-agency', { number: index + 1 })}
            labelFontSize="16px"
            value={subAgency}
            onChange={(event) => handleTextChange(index, event.target.value)}
          />

          <IconButton
            onClick={handleAddClick}
            disabled={subAgencies.length >= MAX_SUB_AGENCY}
            sx={{
              mb: "1px",
              color: "var(--primary-color)",
            }}
          >
            <AddIcon />
          </IconButton>

          <IconButton
            onClick={() => handleRemoveClick(index)}
            disabled={subAgencies.length === 1}
            sx={{
              mb: "1px",
              color: "var(--danger-color)",

              "&.Mui-disabled": {
                color: "rgba(var(--primary-color-rgb), 0.3)",
              },
            }}
          >
            <RemoveIcon />
          </IconButton>
        </Box>
      ))}
    </>
  );
};

export default SubAgency;
import React, { useMemo, useState } from "react";

// Material UI
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import type { AutocompleteRenderInputParams } from "@mui/material/Autocomplete";
import type { UseFormRegisterReturn } from "react-hook-form";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { OptionType } from "../../types/common";

export type { OptionType };

type AutoCompleteValue = OptionType | string | null;

/*
  The freeSolo and non-freeSolo Autocompletes render with the same visual
  styling apart from the error border width, so the shared sx is built once
  here instead of being duplicated across both branches.
*/
const buildFieldSx = (labelFontSize: string, errorBorderWidth: string) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: "5px",

    "& fieldset": {
      borderColor: "var(--theme-accent)",
    },

    "&.Mui-error fieldset": {
      borderColor: "var(--theme-red)",
      borderWidth: errorBorderWidth,
    },

    "&:hover fieldset": {
      borderColor: "var(--theme-accent)",
    },

    "&.Mui-focused fieldset": {
      borderColor: "var(--theme-accent)",
    },
  },

  backgroundColor: "var(--theme-panel)",

  "& .MuiInputBase-root": {
    minHeight: "30px",
    padding: "2px 8px",
    fontSize: labelFontSize,
    color: "var(--theme-accent)",
  },

  "& .MuiInputBase-input": {
    height: "25px",
    padding: "0 !important",
    backgroundColor: "var(--theme-panel) !important",
    color: "var(--theme-accent)",
  },

  "& .MuiSvgIcon-root": {
    color: "var(--theme-accent)",
  },

  "& .MuiOutlinedInput-root.Mui-disabled": {
    backgroundColor: "rgba(var(--theme-accent-rgb), 0.05) !important",
    cursor: "not-allowed",

    "& fieldset": {
      borderColor: "rgba(var(--theme-accent-rgb), 0.70) !important",
    },
  },

  "& .MuiInputBase-input.Mui-disabled": {
    color: "rgba(var(--theme-accent-rgb), 0.70) !important",
    WebkitTextFillColor: "rgba(var(--theme-accent-rgb), 0.70) !important",
    backgroundColor: "rgba(var(--theme-accent-rgb), 0.05) !important",
    cursor: "not-allowed",
  },

  "& .MuiInputBase-root.Mui-disabled": {
    color: "var(--theme-accent) !important",
  },
});

const BASE_PAPER_SX = {
  backgroundColor: "var(--theme-panel) !important",
  color: "var(--theme-accent) !important",
  border: "1px solid var(--theme-accent)",

  "& .MuiAutocomplete-listbox": {
    backgroundColor: "var(--theme-panel) !important",
    padding: 0,
  },

  "& .MuiAutocomplete-option": {
    color: "var(--theme-accent) !important",
    backgroundColor: "var(--theme-panel) !important",
  },

  "& .MuiAutocomplete-option:hover, & .Mui-focused": {
    backgroundColor: "rgba(var(--theme-accent-rgb), 0.20) !important",
  },

  "& .MuiAutocomplete-option[aria-selected='true']": {
    backgroundColor: "var(--theme-accent) !important",
    color: "var(--theme-panel) !important",
  },

  "& .MuiAutocomplete-noOptions": {
    color: "var(--theme-accent) !important",
    backgroundColor: "var(--theme-panel) !important",
  },
};

// freeSolo additionally neutralises the nested outlined-input border.
const FREE_SOLO_PAPER_SX = {
  ...BASE_PAPER_SX,

  "& .MuiOutlinedInput-root": {
    border: "1px solid var(--theme-accent)",
    borderRadius: "5px",
  },

  "& .MuiOutlinedInput-notchedOutline": {
    border: "none !important",
  },
};

type AutoCompleteProps = {
  id?: string;
  value: string | null;
  inputValue?: string;
  onChange: (
    event: React.SyntheticEvent<Element, Event>,
    value: OptionType | null
  ) => void;
  onInputChange?: (
    event: React.SyntheticEvent<Element, Event>,
    value: string
  ) => void;
  options: OptionType[];
  label: string;
  placeholder?: string;
  labelFontSize?: string;
  sx?: object;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  error?: boolean;
  helperText?: string;
  register?: Partial<UseFormRegisterReturn>;
  freeSolo?: boolean;
  disablePortal?: boolean;
};

const AutoComplete: React.FC<AutoCompleteProps> = ({
  id,
  value,
  inputValue: controlledInputValue,
  onChange,
  onInputChange,
  options,
  label,
  placeholder,
  labelFontSize = "14px",
  sx,
  disabled,
  title,
  error = false,
  helperText,
  required = false,
  register,
  freeSolo = false,
  disablePortal = false,
  ...props
}) => {
  const { t } = useTranslation();

  const matchedOption = useMemo(
    () =>
      value === null || value === undefined
        ? undefined
        : options.find((option) => String(option.value) === String(value)),
    [options, value]
  );

  const selectedValue = useMemo<AutoCompleteValue>(() => {
    if (value === null || value === undefined) {
      return null;
    }

    return matchedOption ?? (freeSolo ? String(value) : null);
  }, [matchedOption, value, freeSolo]);

  /*
    Text shown for the current value. Resolving it depends on `options`
    because they often load after the value is set, and only then can the
    code be displayed as its human-readable label.
  */
  const resolvedLabel =
    value === null || value === undefined
      ? ""
      : matchedOption?.label ?? String(value);

  const [innerInputValue, setInnerInputValue] = useState(resolvedLabel);
  const [syncedLabel, setSyncedLabel] = useState(resolvedLabel);

  /*
    Re-sync during render instead of in an effect. The previous effect ran on
    every change of the `options` identity, so a parent that rebuilt its
    options array inline while the user was typing reset the box back to the
    selected label and discarded the keystrokes. Comparing against the last
    synced label re-syncs only when the label genuinely changes.
  */
  if (controlledInputValue === undefined && resolvedLabel !== syncedLabel) {
    setSyncedLabel(resolvedLabel);
    setInnerInputValue(resolvedLabel);
  }

  const inputValue = controlledInputValue ?? innerInputValue;

  const handleSelectionChange = (
    event: React.SyntheticEvent<Element, Event>,
    newValue: AutoCompleteValue
  ) => {
    let formattedValue: OptionType | null;

    if (typeof newValue === "string") {
      formattedValue = {
        value: newValue.trim(),
        label: newValue.trim(),
      };
    } else if (newValue?.inputValue) {
      formattedValue = {
        value: newValue.inputValue.trim(),
        label: newValue.inputValue.trim(),
      };
    } else {
      formattedValue = newValue;
    }

    onChange(event, formattedValue);

    register?.onChange?.({
      target: {
        name: register.name,
        value: formattedValue?.value ?? "",
      },
    });
  };

  const handleInputChange = (
    event: React.SyntheticEvent<Element, Event>,
    newInputValue: string,
    reason: string
  ) => {
    if (reason === "reset") return;

    if (controlledInputValue === undefined) {
      setInnerInputValue(newInputValue);
    }

    onInputChange?.(event, newInputValue);

    if (freeSolo) {
      register?.onChange?.({
        target: {
          name: register.name,
          value: newInputValue,
        },
      });
    }

    if (freeSolo && newInputValue === "") {
      onChange(event, null);
    }
  };

  const fieldSx = useMemo(
    () => ({
      ...buildFieldSx(labelFontSize, freeSolo ? "2px" : "1px"),
      ...sx,
    }),
    [labelFontSize, freeSolo, sx]
  );

  const renderHighlightedText = (label: string, searchValue: string) => {
    if (!searchValue) return label;

    const index = label.toLowerCase().indexOf(searchValue.toLowerCase());
    if (index === -1) return label;

    return (
      <>
        {label.slice(0, index)}
        <b className="font-extrabold">
          {label.slice(index, index + searchValue.length)}
        </b>
        <span className="font-light">
          {label.slice(index + searchValue.length)}
        </span>
      </>
    );
  };


  const commonProps = {
    id,
    disablePortal,
    options,
    onChange: handleSelectionChange,
    onInputChange: handleInputChange,
    disabled,
    title: title || "",
    noOptionsText: t("text.data-not-found"),
    renderInput: (params: AutocompleteRenderInputParams) => (
      <TextField
        {...params}
        error={error}
        helperText={helperText}
        placeholder={placeholder || ""}
      />
    ),
    renderOption: (
      optionProps: React.HTMLAttributes<HTMLLIElement> & { key: React.Key },
      option: OptionType,
      state: { inputValue: string }
    ) => {
      const { key, ...otherProps } = optionProps;

      return (
        <li {...otherProps} key={key}>
          {renderHighlightedText(option.label, state.inputValue)}
        </li>
      );
    },
  };

  return (
    <div className="flex flex-col w-full">
      <Typography
        sx={{
          fontSize: labelFontSize,
          color: "var(--theme-accent)",
        }}
        variant="subtitle1"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Typography>

      {
        freeSolo ? (
          <Autocomplete<OptionType, false, false, boolean>
            {...commonProps}
            freeSolo
            value={selectedValue}
            inputValue={inputValue}
            getOptionLabel={(option) => {
              if (typeof option === "string") return option;
              return option.inputValue ?? option.label ?? "";
            }}
            isOptionEqualToValue={(option, selected) => {
              if (typeof selected === "string") {
                return (
                  String(option.value) === selected ||
                  option.label === selected
                );
              }

              return String(option.value) === String(selected.value);
            }}
            filterOptions={(optionList, params) => {
              const searchValue = params.inputValue.trim().toLowerCase();

              const filtered = optionList.filter((option) =>
                option.label.toLowerCase().includes(searchValue)
              );

              const exists = optionList.some(
                (option) => option.label.toLowerCase() === searchValue
              );

              if (searchValue !== "" && !exists) {
                return [
                  {
                    value: params.inputValue.trim(),
                    label: `${t("button.add")} "${params.inputValue.trim()}"`,
                    inputValue: params.inputValue.trim(),
                  },
                ];
              }

              return filtered;
            }}
            sx={fieldSx}
            slotProps={{ paper: { sx: FREE_SOLO_PAPER_SX } }}
            {...props}
          />
        ) : (
          <Autocomplete<OptionType, false, false, false>
            {...commonProps}
            value={selectedValue as OptionType | null}
            getOptionLabel={(option) => option.label ?? ""}
            isOptionEqualToValue={(option, selected) =>
              String(option.value) === String(selected.value)
            }
            filterOptions={(optionList, params) =>
              optionList.filter((option) =>
                option.label.toLowerCase().includes(params.inputValue.toLowerCase())
              )
            }
            sx={fieldSx}
            slotProps={{ paper: { sx: BASE_PAPER_SX } }}
            {...props}
          />
        )
      }
    </div>
  );
};

export default AutoComplete;

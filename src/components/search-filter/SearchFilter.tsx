import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";

// Material UI
import Button from "@mui/material/Button";
import SearchIcon from "@mui/icons-material/Search";

// Components
import Dialog from "../dialog/Dialog";
import TextBox from "../text-box/TextBox";
import AutoComplete from "../auto-complete/AutoComplete";

// i18n
import { useTranslation } from "react-i18next";

// Types
import type { OptionType, NsbBk, NsbOrg } from "../../types/common";

// Utils
import { buildOptions } from "../../utils/commonFunctions";

// Store
import type { RootState } from "../../store/store";

// API
import { getBk, getOrg } from "../../features/dropdown/api/DropdownApi";

export interface FormData {
  pid: string;
  name: string;
  agency: string;
  bh: string;
  bk: string;
  org: string;
}

type Props = {
  open: boolean;
  value: FormData;
  onClose: () => void;
  onSearch?: (formData: FormData) => void;
};

const initialFormData: FormData = {
  pid: "",
  name: "",
  agency: "",
  bh: "",
  bk: "",
  org: "",
};

const SearchFilter = ({ open, value, onClose, onSearch }: Props) => {
  // i18n
  const { t, i18n } = useTranslation();

  // Data
  const [bk, setBk] = useState<NsbBk[]>([]);
  const [org, setOrg] = useState<NsbOrg[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Redux
  const { agency, bh } = useSelector((state: RootState) => state.dropdown);

  const agencyOptions = useMemo(() => {
    const labelKey = i18n.language === "th" ? "ou_abbr_th" : "ou_abbr_en";

    return buildOptions(
      agency,
      t("dropdown.all-agency"),
      labelKey,
      "ou_code",
      true,
      ""
    );
  }, [agency, i18n.language, t]);

  const bhOptions = useMemo(() => {
    const labelKey = i18n.language === "th" ? "bh_abbr_th" : "bh_abbr_en";

    const filteredBh = formData.agency
      ? bh.filter((item) => item.ou_code === formData.agency)
      : bh;

    return buildOptions(
      filteredBh,
      t("dropdown.all-bh"),
      labelKey,
      "bh_code",
      true,
      ""
    );
  }, [bh, formData.agency, i18n.language, t]);

  const bkOptions = useMemo(() => {
    const labelKey = i18n.language === "th" ? "bk_abbr_th" : "bk_abbr_en";

    return buildOptions(
      bk,
      t("dropdown.all-bk"),
      labelKey,
      "bk_code",
      true,
      ""
    );
  }, [bk, i18n.language, t]);

  const orgOptions = useMemo(() => {
    const labelKey = i18n.language === "th" ? "org_abbr_th" : "org_abbr_en";

    return buildOptions(
      org,
      t("dropdown.all-org"),
      labelKey,
      "org_code",
      true,
      ""
    );
  }, [org, i18n.language, t]);

  const fetchBkList = useCallback(async (bhCode: string) => {
    try {
      const res = await getBk({
        limit: "100",
        ...(bhCode ? { bh_code: bhCode } : {}),
      });

      setBk(res.data ?? []);
    } catch (error) {
      console.log(error);
      setBk([]);
    }
  }, []);

  const fetchOrgList = useCallback(async (bkCode: string) => {
    try {
      const res = await getOrg({
        limit: "100",
        ...(bkCode ? { bk_code: bkCode } : {}),
      });

      setOrg(res.data ?? []);
    } catch (error) {
      console.log(error);
      setOrg([]);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    fetchBkList(formData.bh);
  }, [open, formData.bh, fetchBkList]);

  useEffect(() => {
    if (!open) return;

    fetchOrgList(formData.bk);
  }, [open, formData.bk, fetchOrgList]);

  useEffect(() => {
    if (!open) return;
    setFormData(value);
  }, [open, value]);

  const handleTextChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleDropdownChange = (
    _event: React.SyntheticEvent,
    key: keyof FormData,
    value: string | OptionType | null
  ) => {
    const selectedValue = typeof value === "string" ? value : value?.value ?? "";

    setFormData((prev) => {
      if (key === "agency") {
        return {
          ...prev,
          agency: selectedValue,
          bh: "",
          bk: "",
          org: "",
        };
      }

      if (key === "bh") {
        return {
          ...prev,
          bh: selectedValue,
          bk: "",
          org: "",
        };
      }

      if (key === "bk") {
        return {
          ...prev,
          bk: selectedValue,
          org: "",
        };
      }

      return {
        ...prev,
        [key]: selectedValue,
      };
    });
  };

  const handleSearch = () => {
    onSearch?.(formData);
    onClose();
  };

  const handleClear = () => {
    setFormData(initialFormData);
    setBk([]);
    setOrg([]);
  };

  return (
    <Dialog
      open={open}
      handleClose={onClose}
      dialogTitle={t("dialog.search-condition")}
      width="1400px"
    >
      <div className="grid grid-cols-3 gap-2 pt-5 px-5">
        <TextBox
          sx={{ marginTop: "5px" }}
          id="pid"
          label={t("component.pid")}
          placeholder={t("placeholder.pid")}
          labelFontSize="16px"
          value={formData.pid}
          onChange={(event) => handleTextChange("pid", event.target.value)}
        />

        <TextBox
          sx={{ marginTop: "5px" }}
          id="name"
          label={t("component.fullname")}
          placeholder={t("placeholder.fullname")}
          labelFontSize="16px"
          value={formData.name}
          onChange={(event) => handleTextChange("name", event.target.value)}
        />

        <AutoComplete
          id="agency-select"
          sx={{ marginTop: "5px" }}
          value={formData.agency}
          onChange={(event, value) =>
            handleDropdownChange(event, "agency", value)
          }
          options={agencyOptions}
          label={t("component.agency")}
          placeholder={t("placeholder.agency")}
          labelFontSize="16px"
          disablePortal
        />

        <AutoComplete
          id="bh-select"
          sx={{ marginTop: "5px" }}
          value={formData.bh}
          onChange={(event, value) => handleDropdownChange(event, "bh", value)}
          options={bhOptions}
          label={t("component.bh")}
          placeholder={t("placeholder.bh")}
          labelFontSize="16px"
          disablePortal
        />

        <AutoComplete
          id="bk-select"
          sx={{ marginTop: "5px" }}
          value={formData.bk}
          onChange={(event, value) => handleDropdownChange(event, "bk", value)}
          options={bkOptions}
          label={t("component.bk")}
          placeholder={t("placeholder.bk")}
          labelFontSize="16px"
          disabled={!formData.bh}
          disablePortal
        />

        <AutoComplete
          id="org-select"
          sx={{ marginTop: "5px" }}
          value={formData.org}
          onChange={(event, value) => handleDropdownChange(event, "org", value)}
          options={orgOptions}
          label={t("component.org")}
          placeholder={t("placeholder.org")}
          labelFontSize="16px"
          disabled={!formData.bk}
          disablePortal
        />

        <div className="col-span-3 flex items-center justify-center pt-5 gap-2">
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
              "& .MuiButton-startIcon svg": {
                color: "var(--tertiary-color)",
              },
            }}
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            {t("button.search")}
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
                backgroundColor: "rgba(var(--primary-color-rgb), 0.08)",
              },
              textTransform: "capitalize",
            }}
            onClick={handleClear}
          >
            {t("button.clear")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

export default SearchFilter;
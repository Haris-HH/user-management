import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from 'react-router-dom';

// Material UI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";

// Components
import MainTitleWithBreadcrumbs from '../components/main-title/MainTitleWithBreadcrumbs';
import ImageUpload from '../components/image-upload/ImageUpload';
import TextBox from '../components/text-box/TextBox';
import AutoComplete from '../components/auto-complete/AutoComplete';
import PermissionTable from '../components/permission-table/PermissionTable';
import LoadingScreen from '../components/loading-screen/LoadingScreen';
import SubAgency from '../components/sub-agency/SubAgency';

// Icons
import ClearIcon from "../assets/svg/clear.svg?react";

// Types
import type {
  OptionType,
  CameraInCheckpoint,
  GroupPermissions,
  User,
  CreateUser,
  UpdateUser,
  NsbBk,
  NsbOrg,
} from "../types/common";

// Hooks
import usePermissionUiList from "../hooks/usePermissionUiList";

// i18n
import { useTranslation } from 'react-i18next';

// Store
import type { RootState } from "../store/store";
import { useAppDispatch } from "../store/hooks";

// Utils
import {
  buildOptions,
  isValidThaiID,
  isValidEmail,
  isValidPassword,
  generatePassword,
  formatThaiID,
  formatPhone,
  normalizeText,
} from "../utils/commonFunctions";
import { PopupMessage, PopupMessageWithCancelAndDeny, PopupMessageWithCancel } from "../utils/popupMessage";

// API
import { getCameras, getBk, getOrg } from "../features/dropdown/api/DropdownApi";
import { requestUpload, removeUpload  } from '../features/upload/api/UploadApi';
import { createUserApi, updateUserApi, getUserApi } from "../features/users/api/UsersApi";
import { setAuthUser } from "../features/auth-user/api/AuthUserSlice";
import { getTitle, getAgency, createTitle, createPosition } from "../features/dropdown/api/DropdownApi";
import {
  fetchTitle,
  fetchPosition,
} from "../features/dropdown/api/DropdownSlice";

interface FormData {
  username: string;
  password: string;
  prefix: string;
  first_name: string;
  last_name: string;
  pid: string;
  email: string;
  phone: string;
  position: string;
  agency: string;
  bh: string;
  bk: string;
  org: string;
  permission: string;
  end_date: string;
  life_date: string;
  status: "active" | "inactive" | "suspend";
  detail: string;
  sub_unit: string[];
}

const UserForm = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const permissionUiList = usePermissionUiList();

  const editingUser = location.state?.user as User | undefined;
  const tab = location.state?.page || "add_approve_user";
  const returnTo = location.state?.returnTo || "/add-approve-user";
  const isEditMode = Boolean(editingUser?.user_id);

  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [isLoading, setIsLoading] = useState(false);
  const getActiveStatus = (
    status?: string
  ): FormData["status"] => {
    switch (status) {
      case "active":
        return "active";
      case "suspend":
        return "suspend";
      default:
        return "inactive";
    }
  };
  const [activeStatus, setActiveStatus] = useState<FormData["status"]>(() =>
    getActiveStatus(editingUser?.active_status)
  );

  // Data
  const [permissions, setPermissions] = useState<GroupPermissions>(
    editingUser?.permissions ?? {}
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    editingUser?.image_url ?? null
  );
  const [checkpointData, setCheckpointData] = useState<CameraInCheckpoint[]>([]);
  const [tempUploadedUrls, setTempUploadedUrls] = useState<string[]>([]);
  const [deletedImageUrls, setDeletedImageUrls] = useState<string[]>([]);
  const [bk, setBk] = useState<NsbBk[]>([]);
  const [org, setOrg] = useState<NsbOrg[]>([]);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    username: editingUser?.username ?? "",
    password: "",
    prefix: editingUser?.title_id ? String(editingUser.title_id) : "",
    first_name: editingUser?.firstname ?? "",
    last_name: editingUser?.lastname ?? "",
    pid: formatThaiID(editingUser?.idcard) ?? "",
    email: editingUser?.email ?? "",
    phone: formatPhone(editingUser?.phone) ?? "",
    position: editingUser?.position_id ? String(editingUser.position_id) : "",
    agency: editingUser?.ou_code ?? "",
    bh: editingUser?.bh_code ?? "",
    bk: editingUser?.bk_code ?? "",
    org: editingUser?.org_code ?? "",
    permission: editingUser?.user_group_id ?? "",
    end_date: "",
    life_date: "",
    status: editingUser?.account_status ?? "active",
    detail: editingUser?.details ?? "",
    sub_unit: editingUser?.sub_unit ?? [],
  });

  // Redux
  const {
    agency,
    bh,
    title,
    position,
    area,
    policeStation,
    province,
    userGroup,
  } = useSelector((state: RootState) => state.dropdown);
  const { user } = useSelector((state: RootState) => state.authUser);

  // Ref
  const tempUploadedUrlsRef = useRef<string[]>([]);

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

  useEffect(() => {
    if (!editingUser) return;

    reset({
      username: editingUser.username ?? "",
      password: "",
      prefix: editingUser.title_id ? String(editingUser.title_id) : "",
      first_name: editingUser.firstname ?? "",
      last_name: editingUser.lastname ?? "",
      pid: editingUser.idcard ?? "",
      email: editingUser.email ?? "",
      phone: editingUser.phone ?? "",
      position: editingUser.position_id ? String(editingUser.position_id) : "",
      agency: editingUser.ou_code ?? "",
      bh: editingUser.bh_code ?? "",
      bk: editingUser.bk_code ?? "",
      org: editingUser.org_code ?? "",
      permission: editingUser.user_group_id ?? "",
      end_date: "",
      life_date: "",
      status: editingUser.account_status ?? "active",
      detail: editingUser.details ?? "",
    });

    setPermissions(editingUser.permissions ?? {});
    setImageUrl(editingUser.image_url ?? null);
    setActiveStatus(editingUser.account_status ?? "active");
    setValue("status", editingUser.account_status ?? "active");
  }, [editingUser, reset]);

  useEffect(() => {
    tempUploadedUrlsRef.current = tempUploadedUrls;
  }, [tempUploadedUrls]);

  useEffect(() => {
    return () => {
      setIsLoading(true);
      const urls = tempUploadedUrlsRef.current;

      if (urls.length > 0) {
        removeUpload({ keys: urls }).catch(console.error);
      }
      setIsLoading(false);
    };
  }, []);

  const agencyOptions = useMemo(() => {
    const langKeyAgency = i18n.language === "th" ? "ou_abbr_th" : "ou_abbr_en";
    return buildOptions(agency, "", langKeyAgency, "ou_code", false);
  }, [agency, i18n.language]);

  const bhOptions = useMemo(() => {
    const langKeyBh = i18n.language === "th" ? "bh_abbr_th" : "bh_abbr_en";
    const filteredBh = formData.agency
      ? bh.filter((item) => item.ou_code === formData.agency)
      : bh;

    return buildOptions(filteredBh, "", langKeyBh, "bh_code", false);
  }, [bh, i18n.language, formData.agency]);

  const bkOptions = useMemo(() => {
    const langKeyBk = i18n.language === "th" ? "bk_abbr_th" : "bk_abbr_en";
    const filteredBk = formData.bh
      ? bk.filter((item) => item.bh_code === formData.bh)
      : bk;

    return buildOptions(filteredBk, "", langKeyBk, "bk_code", false);
  }, [bk, i18n.language, formData.bh]);

  const orgOptions = useMemo(() => {
    const langKeyOrg = i18n.language === "th" ? "org_abbr_th" : "org_abbr_en";
    const filteredOrg = formData.bk
      ? org.filter((item) => item.bk_code === formData.bk)
      : org;

    return buildOptions(filteredOrg, "", langKeyOrg, "org_code", false);
  }, [org, i18n.language, formData.bk]);

  const titleOptions = useMemo(() => {
    const langKeyTitle = i18n.language === "th" ? "title_abbr_th" : "title_abbr_en";
    return buildOptions(title, "", langKeyTitle, "id", false);
  }, [title, i18n.language]);

  const positionOptions = useMemo(() => {
    const langKeyPosition = i18n.language === "th" ? "position_th" : "position_en";
    return buildOptions(position, "", langKeyPosition, "id", false);
  }, [position, i18n.language]);

  const permissionOptions = useMemo(() => {
    return buildOptions(userGroup, "", "group_name", "group_id", false);
  }, [userGroup]);

  const internalPolice: boolean = useMemo(() => {
    const agencyData = agency.find((a) => a.ou_code === formData.agency);
    return agencyData?.ou_codename === "police" || false;
  }, [formData.agency])

  const fetchBkList = useCallback(async (bhCode?: string) => {
    try {
      const params: Record<string, string> = {
        limit: "100",
        ...(bhCode && bhCode !== "0"
          ? { bh_code: bhCode }
          : {}),
      };

      const res = await getBk(params);
      setBk(res.data ?? []);
    } catch (error) {
      setBk([]);
    }
  }, []);

  const fetchOrgList = useCallback(async (bkCode?: string) => {
    try {
      const params: Record<string, string> = {
        limit: "100",
        ...(bkCode && bkCode !== "0"
          ? { bk_code: bkCode }
          : {}),
      };

      const res = await getOrg(params);
      setOrg(res.data ?? []);
    } catch (error) {
      setOrg([]);
    }
  }, []);

  useEffect(() => {
    fetchBkList(formData.bh);
  }, [fetchBkList, formData.bh]);

  useEffect(() => {
    fetchOrgList(formData.bk);
  }, [fetchOrgList, formData.bk]);

  useEffect(() => {
    if (!formData.permission) return;

    const userGroupData = userGroup.find(
      (ug) => ug.group_id === formData.permission
    );

    if (!userGroupData) return;

    setFormData((prev) => ({
      ...prev,
      end_date: String(userGroupData.approved_lifetime ?? ""),
      life_date: String(userGroupData.login_lifetime ?? ""),
    }));
  }, [formData.permission, userGroup]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const updated = await Promise.all(
        area.map(async (a) => {
          const res = await getCameras({
            filter: `police_region_id=${a.id}`,
          });

          const updatedCamera = res.data.map((c) => {
            const policeStationData = policeStation.find(
              (ps) => ps.id === c.police_station_id
            );
            const provinceData = province.find(
              (p) => p.province_code === c.province_code
            );

            return {
              ...c,
              police_station_name: policeStationData?.station_name ?? "-",
              province_name:
                i18n.language === "th"
                  ? provinceData?.name_th ?? "-"
                  : provinceData?.name_en ?? "-",
            };
          });

          return {
            ...a,
            camera_list: updatedCamera,
          };
        })
      );

      setCheckpointData(updated);
    } catch (error) {
      await PopupMessage(t("popup.fetch-error"), "", "error");
    } finally {
      setIsLoading(false);
    }
  }, [area, policeStation, province, i18n.language, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const status = getActiveStatus(editingUser?.active_status);

    setActiveStatus(status);
    setValue("status", status);
  }, [editingUser, setValue]);

  const statusDescription = {
    active: t('placeholder.active'),
    inactive: t('placeholder.inactive'),
    suspend: t('placeholder.suspend'),
  };

  const currentDescription =
    statusDescription[
      activeStatus as keyof typeof statusDescription
    ] ?? "";

  const hasPageChange = useMemo(() => {
    return (
      imageUrl !== (editingUser?.image_url ?? null) ||
      deletedImageUrls.length > 0 ||
      tempUploadedUrls.length > 0 ||
      formData.password !== "" ||
      formData.prefix !== (editingUser?.title_id ? String(editingUser.title_id) : "") ||
      formData.first_name !== (editingUser?.firstname ?? "") ||
      formData.last_name !== (editingUser?.lastname ?? "") ||
      formData.pid.replaceAll("-", "") !== (editingUser?.idcard ?? "") ||
      formData.email !== (editingUser?.email ?? "") ||
      formData.phone.replaceAll("-", "") !== (editingUser?.phone ?? "") ||
      formData.position !== (editingUser?.position ?? "") ||
      formData.agency !== (editingUser?.ou_code ?? "") ||
      formData.bh !== (editingUser?.bh_code ?? "") ||
      formData.bk !== (editingUser?.bk_code ?? "") ||
      formData.org !== (editingUser?.org_code ?? "") ||
      formData.permission !== (editingUser?.user_group_id ?? "") ||
      formData.status !== (editingUser?.account_status ?? "active") ||
      formData.detail !== (editingUser?.details ?? "")
    );
  }, [formData, imageUrl, deletedImageUrls, tempUploadedUrls, editingUser]);

  const handleTextChange = (key: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setValue(key, value);
  };

  const handleDropdownChange = (
    event: React.SyntheticEvent,
    key: keyof FormData,
    value: string | OptionType | null,
  ) => {
    event.preventDefault();

    const selectedValue =
      typeof value === "string" ? value : value?.value ?? "";

    setFormData((prev) => {
      const next = {
        ...prev,
        [key]: selectedValue,
      };

      if (key === "agency") {
        next.bh = "";
        next.bk = "";
        next.org = "";
      }

      if (key === "bh") {
        next.bk = "";
        next.org = "";
      }

      if (key === "bk") {
        next.org = "";
      }

      return next;
    });

    setValue(key, selectedValue);

    if (key === "permission") {
      const selectedGroup = userGroup.find(
        (item) => item.group_id === selectedValue
      );

      if (!selectedGroup) {
        setPermissions({});
        return;
      }

      setFormData((prev) => ({
        ...prev,
        permission: selectedValue,
        end_date: String(selectedGroup.approved_lifetime ?? ""),
        life_date: String(selectedGroup.login_lifetime ?? ""),
      }));

      setPermissions(structuredClone(selectedGroup.permissions ?? {}));
    }
  };

  const handlePidChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 13);
    const formattedPid = formatThaiID(digits);

    handleTextChange("pid", formattedPid);
    handleTextChange("username", digits);

    if (!digits) {
      clearErrors("pid");
      return;
    }

    if (digits.length !== 13 || !isValidThaiID(digits)) {
      setError("pid", {
        type: "manual",
        message: t("text.invalid-pid"),
      });
      return;
    }

    clearErrors("pid");
  };

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const formattedPhone = formatPhone(digits);

    handleTextChange("phone", formattedPhone);

    if (!digits) {
      clearErrors("phone");
      return;
    }

    if (digits.length !== 10) {
      setError("phone", {
        type: "manual",
        message: t("text.invalid-phone"),
      });
      return;
    }

    clearErrors("phone");
  };

  const handleEmailChange = (value: string) => {
    handleTextChange("email", value);

    if (!value) {
      clearErrors("email");
      return;
    }

    if (!isValidEmail(value)) {
      setError("email", {
        type: "manual",
        message: t("text.invalid-email"),
      });
      return;
    }

    clearErrors("email");
  };

  const handlePasswordChange = (value: string) => {
    handleTextChange("password", value);

    if (!value) {
      clearErrors("password");
      return;
    }

    if (!isValidPassword(value)) {
      setError("password", {
        type: "manual",
        message: t("text.invalid-password"),
      });
      return;
    }

    clearErrors("password");
  };

  const addChangedField = <T extends Record<string, any>>(
    payload: T,
    key: keyof T,
    currentValue: any,
    originalValue: any
  ) => {
    if (currentValue !== originalValue) {
      payload[key] = currentValue;
    }
  };

  const findTitle = (name: any) => {
    const keyword = normalizeText(name);

    return title.find((item) =>
      [
        item.title_en,
        item.title_th,
        item.title_abbr_en,
        item.title_abbr_th,
        item.id,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const findPosition = (name: any) => {
    const keyword = normalizeText(name);

    return position.find((item) =>
      [
        item.position_en,
        item.position_th,
        item.id,
      ]
        .map(normalizeText)
        .includes(keyword)
    );
  };

  const createNewTitle = async () => {
    return await createTitle({
      title_group: "custom",
      title_en: formData.prefix,
      title_th: formData.prefix,
      title_abbr_en: formData.prefix,
      title_abbr_th: formData.prefix,
    });
  }

  const createNewPosition = async () => {
    return await createPosition({
      category: "custom",
      position_en: formData.position,
      position_th: formData.position,
    });
  }

  const handleSaveClick = async () => {
    try {
      setIsLoading(true);

      let title_id = 0;
      if (formData.prefix) {
        const titleData = findTitle(formData.prefix);
        if (titleData) {
          title_id = titleData.id;
        }
        else {
          const res = await createNewTitle();
          title_id = res.data?.id ?? 0;
          dispatch(fetchTitle({ limit: "100" }));
        }
      }
      let position_id = 0;
      if (formData.position) {
        const positionData = findPosition(formData.position);
        if (positionData) {
          position_id = positionData.id;
        }
        else {
          const res = await createNewPosition();
          position_id = res.data?.id ?? 0;
          dispatch(fetchPosition({ limit: "100" }));
        }
      }

      if (isEditMode && editingUser?.user_id) {
        if (activeStatus === "suspend") {
          const confirmSuspend = await PopupMessageWithCancel(
            t("popup.update-confirm"),
            t("popup.suspend-confirm-detail"),
            t("button.confirm"),
            t("button.cancel"),
            "warning",
          );
          if (!confirmSuspend) {
            setIsLoading(false);
            return;
          }
        }

        const updatePayload: UpdateUser = {
          user_id: editingUser.user_id,
        };

        addChangedField(updatePayload, "user_group_id", formData.permission, editingUser.user_group_id ?? "");
        addChangedField(updatePayload, "image_url", imageUrl, editingUser.image_url ?? null);
        if (title_id !== 0) {
          addChangedField(updatePayload, "title_id", title_id, editingUser.title_id);
        }
        if (position_id !== 0) {
          addChangedField(updatePayload, "position_id", position_id, editingUser.position ?? "");
        }
        addChangedField(updatePayload, "bh_code", formData.bh, editingUser.bh_code ?? "");
        addChangedField(updatePayload, "bk_code", formData.bk, editingUser.bk_code ?? "");
        addChangedField(updatePayload, "org_code", formData.org, editingUser.org_code ?? "");
        addChangedField(updatePayload, "username", formData.username, editingUser.username ?? "");
        addChangedField(updatePayload, "firstname", formData.first_name, editingUser.firstname ?? "");
        addChangedField(updatePayload, "lastname", formData.last_name, editingUser.lastname ?? "");
        addChangedField(updatePayload, "idcard", formData.pid.replaceAll("-", ""), editingUser.idcard ?? "");
        addChangedField(updatePayload, "phone", formData.phone.replaceAll("-", ""), editingUser.phone ?? "");
        addChangedField(updatePayload, "email", formData.email, editingUser.email ?? "");
        addChangedField(updatePayload, "ou_code", formData.agency, editingUser.ou_code ?? "");
        addChangedField(updatePayload, "active_status", activeStatus, editingUser.active_status ?? "active");
        addChangedField(updatePayload, "detail", formData.detail, editingUser.details ?? "");
        addChangedField(updatePayload, "sub_unit", formData.sub_unit, editingUser.sub_unit ?? []);

        if (JSON.stringify(permissions ?? {}) !== JSON.stringify(editingUser.permissions ?? {})) {
          updatePayload.permissions = permissions;
        }

        if (formData.password) {
          updatePayload.password = formData.password;
        }

        const hasChangedData = Object.keys(updatePayload).length > 1;

        if (hasChangedData) {
          await updateUserApi(updatePayload);

          if (user?.user_id === editingUser.user_id) {
            await updateUserInfo(editingUser.user_id);
          }
        }

        await PopupMessage(t("popup.update-success"), "", "success");
      } 
      else {
        const createPayload: CreateUser = {
          ...(formData.permission && { user_group_id: formData.permission }),
          ...(imageUrl && { image_url: imageUrl }),
          ...((formData.prefix && title_id !== 0) && { title_id: title_id }),
          ...((formData.position && position_id !== 0) && { position_id: position_id }),
          ...(formData.bh && { bh_code: formData.bh }),
          ...(formData.bk && { bk_code: formData.bk }),
          ...(formData.org && { org_code: formData.org }),
          ...(formData.username && { username: formData.username }),
          ...(formData.first_name && { firstname: formData.first_name }),
          ...(formData.last_name && { lastname: formData.last_name }),
          ...(formData.pid && { idcard: formData.pid.replaceAll("-", "") }),
          ...(formData.phone && { phone: formData.phone.replaceAll("-", "") }),
          ...(formData.email && { email: formData.email }),
          ...(formData.agency && { ou_code: formData.agency }),
          ...(permissions && { permissions }),
          ...(formData.password && { password: formData.password }),
          ...(formData.sub_unit && { sub_unit: formData.sub_unit }),
        };

        await createUserApi(createPayload);
        await PopupMessage(t("popup.create-success"), "", "success");
      }

      const unusedTempImages = tempUploadedUrls.filter((image) => image !== imageUrl);

      if (unusedTempImages.length > 0) {
        await removeUpload({ keys: unusedTempImages });
      }

      if (deletedImageUrls.length > 0) {
        await removeUpload({ keys: deletedImageUrls });
      }

      setTempUploadedUrls([]);
      setDeletedImageUrls([]);
      navigate(returnTo, { replace: true });
    } 
    catch (error) {
      await PopupMessage(t("popup.save-error"), "", "error");
    } 
    finally {
      setIsLoading(false);
    }
  };

  const updateUserInfo = async (userId: string) => {
    const userResponse = await getUserApi({ filter: `user_id=${userId}` });
    const titleData = await getTitle({ filter: `id=${userResponse.data[0]?.title_id}` });
    const nsbOuData = await getAgency({ filter: `ou_code=${userResponse.data[0]?.ou_code}` });
    
    dispatch(
      setAuthUser({
        user_id: userResponse.data[0]?.user_id ?? "-",
        hash_id: userResponse.data[0]?.hash_id ?? "-",
        title_name_th: titleData.data[0]?.title_abbr_th ?? "",
        title_name_en: titleData.data[0]?.title_abbr_en ?? "",
        first_name: userResponse.data[0]?.firstname ?? "-",
        last_name: userResponse.data[0]?.lastname ?? "-",
        image_url: userResponse.data[0]?.image_url ?? "-",
        permission: userResponse.data[0]?.permissions ?? {},
        agency: {
          ou_code: userResponse.data[0]?.ou_code,
          ou_abbr_th: nsbOuData.data[0]?.ou_abbr_th ?? "-",
          ou_abbr_en: nsbOuData.data[0]?.ou_abbr_en ?? "-",
        },
      })
    );
  }

  const handleResetPassword = () => {
    const password = generatePassword();
    handleTextChange("password", password);
    clearErrors("password");
  };

  const handleImageChange = async (file: File | null) => {
    try {
      if (!file) {
        return;
      }

      setIsLoading(true);

      const oldImageUrl = imageUrl;

      const uploadFormData = new FormData();
      uploadFormData.append("files", file);

      const res = await requestUpload(uploadFormData);
      const uploadedUrl = res.data?.[0]?.url;

      if (!uploadedUrl) {
        throw new Error("Upload response URL not found");
      }

      if (oldImageUrl) {
        setDeletedImageUrls((prev) =>
          prev.includes(oldImageUrl) ? prev : [...prev, oldImageUrl]
        );
      }

      if (uploadedUrl) {
        setTempUploadedUrls(prev => [...prev, uploadedUrl]);
        setImageUrl(uploadedUrl);
      }
    } 
    catch (error) {
      await PopupMessage(t("popup.upload-error"), "", "error");
    } 
    finally {
      setIsLoading(false);
    }
  };

  const handleGroupPermissionsChange = (permissions: GroupPermissions) => {
    setPermissions(permissions);
  };

  const goBack = () => {
    navigate(returnTo, { replace: true });
  };

  const handleCancelClick = async () => {
    setIsLoading(true);
    if (!hasPageChange) {
      goBack();
      return;
    }

    const result = await PopupMessageWithCancelAndDeny(
      t("popup.unsaved-change-title"),
      t("popup.unsaved-change-message"),
      t("button.save"),
      t("button.not-save"),
      t("button.cancel"),
      "warning"
    );

    if (result.isConfirmed) {
      await handleSaveClick();
      return;
    }

    if (result.isDenied) {
      if (tempUploadedUrls.length > 0) {
        await removeUpload({ keys: tempUploadedUrls });
      }

      goBack();
    }
    setIsLoading(false);
  };

  const handleImageDelete = () => {
    if (imageUrl) {
      setDeletedImageUrls((prev) =>
        prev.includes(imageUrl) ? prev : [...prev, imageUrl]
      );
    }

    setImageUrl(null);
  };

  const onChangeActiveStatus = (status: FormData["status"]) => {
    setActiveStatus(status);

    setValue("status", status, {
      shouldValidate: true,
      shouldDirty: true,
    });

    if (status === "active") {
      setValue("detail", "");
      handleTextChange("detail", "");
      clearErrors("detail");
    } 
    else {
      trigger("detail");
    }
  };

  const handleSubAgencyChange = (values: string[]) => {
    setFormData((prev) => ({
      ...prev,
      sub_unit: values,
    }));
  }

  return (
    <section id="user-form" className="flex flex-col h-full w-full">
      {isLoading && <LoadingScreen />}

      <Box className="p-4 flex flex-col gap-4 h-full w-full">
        <MainTitleWithBreadcrumbs
          header={{ label: t("pages.add-approve-user"), to: "/add-approve-user" }}
          breadcrumbPaths={[
            {
              label: isEditMode ? t("pages.edit-user") : t("pages.add-user"),
            },
          ]}
        />

        <form
          className="flex flex-col flex-1 bg-(--tertiary-color) border border-(--primary-color) rounded-sm shadow px-15 pt-15 pb-5 gap-2 overflow-y-auto"
          onSubmit={handleSubmit(handleSaveClick)}
        >
          <Box className="grid grid-cols-[220px_1fr] gap-4">
            <Box className="flex items-start justify-center">
              <ImageUpload
                initialImage={imageUrl ?? undefined}
                onImageChange={handleImageChange}
                onImageDelete={handleImageDelete}
              />
            </Box>

            <Box className="flex flex-col gap-4">
              <Box className="flex flex-col gap-4 px-2">
                <Typography variant="h6" sx={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary-color)" }}>
                  {t("text.username")}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    columnGap: 10,
                    rowGap: 2,
                    gridTemplateColumns: {
                      md: "1fr",
                      xl: "repeat(2, minmax(0,1fr)) 300px",
                    },
                  }}
                >
                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="username"
                    label={t("component.username")}
                    placeholder={t("placeholder.username")}
                    autoComplete="username"
                    labelFontSize="16px"
                    value={formData.username}
                    onChange={(event) => handleTextChange("username", event.target.value)}
                    register={register("username")}
                    disabled
                  />

                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="password"
                    label={t("component.password")}
                    placeholder={t("placeholder.password")}
                    labelFontSize="16px"
                    value={formData.password}
                    type="password"
                    required={!isEditMode}
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    helperText={errors.password?.message?.toString() ?? ""}
                    register={register("password", {
                      required: !isEditMode
                        ? t("text.text-required", { textField: t("component.password") })
                        : false,
                    })}
                    error={!!errors.password}
                  />

                  <Box sx={{ display: "flex", alignItems: "flex-end", pb: errors.password ? "40px" : 0 }}>
                    <Button
                      variant="contained"
                      sx={{
                        width: t("button.reset-password-size"),
                        height: 35,
                        backgroundColor: "var(--primary-color)",
                        color: "var(--tertiary-color)",
                        mb: "1px",
                        "&:hover": { backgroundColor: "rgba(var(--primary-color-rgb), 0.7)" },
                        textTransform: "capitalize",
                      }}
                      startIcon={<ClearIcon className="h-6 w-6" style={{ color: "var(--tertiary-color)" }} />}
                      onClick={handleResetPassword}
                    >
                      {t("button.reset-password")}
                    </Button>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ borderColor: "#0c5d9f94", borderWidth: "1.5px", mt: 1 }} />

              <Box className="flex flex-col gap-4 px-2">
                <Typography variant="h6" sx={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary-color)" }}>
                  {t("text.information")}
                </Typography>

                <Box
                  sx={{
                    display: "grid",
                    columnGap: 3,
                    rowGap: 2,
                    gridTemplateColumns: {
                      md: "1fr",
                      xl: "repeat(3, minmax(0,1fr))",
                    },
                  }}
                >
                  <AutoComplete
                    id="title-select"
                    sx={{ marginTop: "5px" }}
                    value={formData.prefix}
                    onChange={(event, value) => handleDropdownChange(event, "prefix", value)}
                    onInputChange={(_, value) => handleTextChange("prefix", value)}
                    options={titleOptions}
                    label={t("component.title")}
                    placeholder={t("placeholder.title")}
                    labelFontSize="16px"
                    freeSolo
                  />

                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="first-name"
                    label={t("component.first-name")}
                    placeholder={t("placeholder.first-name")}
                    labelFontSize="16px"
                    value={formData.first_name}
                    required
                    onChange={(event) => handleTextChange("first_name", event.target.value)}
                    helperText={errors.first_name?.message?.toString() ?? ""}
                    register={register("first_name", {
                      required: t("text.text-required", { textField: t("component.first-name") }),
                    })}
                    error={!!errors.first_name}
                  />

                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="last-name"
                    label={t("component.last-name")}
                    placeholder={t("placeholder.last-name")}
                    labelFontSize="16px"
                    value={formData.last_name}
                    required
                    onChange={(event) => handleTextChange("last_name", event.target.value)}
                    helperText={errors.last_name?.message?.toString() ?? ""}
                    register={register("last_name", {
                      required: t("text.text-required", { textField: t("component.last-name") }),
                    })}
                    error={!!errors.last_name}
                  />

                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="pid"
                    label={t("component.pid-2")}
                    placeholder={t("placeholder.pid-2")}
                    labelFontSize="16px"
                    required
                    value={formData.pid}
                    onChange={(event) => handlePidChange(event.target.value)}
                    helperText={errors.pid?.message?.toString() ?? ""}
                    register={register("pid", {
                      required: t("text.text-required", { textField: t("component.pid-2") }),
                    })}
                    error={!!errors.pid}
                  />

                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="phone"
                    label={t("component.phone")}
                    placeholder={t("placeholder.phone")}
                    labelFontSize="16px"
                    required
                    value={formData.phone}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                    helperText={errors.phone?.message?.toString() ?? ""}
                    register={register("phone", {
                      required: t("text.text-required", { textField: t("component.phone") }),
                    })}
                    error={!!errors.phone}
                  />

                  <TextBox
                    sx={{ marginTop: "5px" }}
                    id="email"
                    label={t("component.email")}
                    placeholder={t("placeholder.email")}
                    labelFontSize="16px"
                    required
                    value={formData.email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    helperText={errors.email?.message?.toString() ?? ""}
                    register={register("email", {
                      required: t("text.text-required", { textField: t("component.email") }),
                    })}
                    error={!!errors.email}
                  />

                  <AutoComplete
                    id="position-select"
                    sx={{ marginTop: "5px" }}
                    value={formData.position}
                    onChange={(event, value) => handleDropdownChange(event, "position", value)}
                    onInputChange={(_, value) => handleTextChange("position", value)}
                    options={positionOptions}
                    label={t("component.position")}
                    placeholder={t("placeholder.position")}
                    labelFontSize="16px"
                    freeSolo
                  />

                  <AutoComplete
                    id="agency-select"
                    sx={{ marginTop: "5px" }}
                    value={formData.agency}
                    onChange={(event, value) => handleDropdownChange(event, "agency", value)}
                    options={agencyOptions}
                    label={t("component.agency")}
                    placeholder={t("placeholder.agency")}
                    labelFontSize="16px"
                    required
                    helperText={errors.agency?.message?.toString() ?? ""}
                    register={register("agency", {
                      required: t("text.text-required", { textField: t("component.agency") }),
                    })}
                    error={!!errors.agency}
                  />

                  {
                    internalPolice && (
                      <>
                        <AutoComplete
                          id="bh-select"
                          sx={{ marginTop: "5px" }}
                          value={formData.bh}
                          onChange={(event, value) => handleDropdownChange(event, "bh", value)}
                          options={bhOptions}
                          label={t("component.bh")}
                          placeholder={t("placeholder.bh")}
                          labelFontSize="16px"
                          disabled={!formData.agency}
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
                          disabled={!formData.agency || !formData.bh}
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
                          disabled={!formData.agency || !formData.bh || !formData.bk}
                        />
                      </>
                    )
                  }

                  {
                    (!internalPolice && formData.agency) && (
                      <SubAgency
                        onChange={handleSubAgencyChange}
                      />
                    )
                  }
                </Box>
              </Box>
            </Box>
          </Box>

          {tab === "manage_user" && (
            <>
              <Divider
                sx={{
                  borderColor: "#0c5d9f94",
                  borderWidth: "1.5px",
                  mt: 5,
                }}
              />

              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: "1.2rem",
                    fontWeight: "bold",
                    color: "var(--primary-color)",
                    mb: 2,
                  }}
                >
                  {t("text.active-status")}
                </Typography>

                <FormControl error={!!errors.status}>
                  <RadioGroup
                    row
                    value={activeStatus}
                    onChange={(e) =>
                      onChangeActiveStatus(
                        e.target.value as FormData["status"]
                      )
                    }
                    sx={{
                      gap: 3,
                      color: "var(--primary-color)",
                      "& .MuiRadio-root": {
                        color: "var(--primary-color)",
                      },
                      "& .Mui-checked": {
                        color: "var(--primary-color)",
                      },
                    }}
                  >
                    <FormControlLabel
                      value="active"
                      control={<Radio />}
                      label={t("text.active")}
                    />

                    <FormControlLabel
                      value="inactive"
                      control={<Radio />}
                      label={t("text.inactive")}
                    />

                    <FormControlLabel
                      value="suspend"
                      control={<Radio />}
                      label={t("text.suspend")}
                    />
                  </RadioGroup>

                  <input
                    type="hidden"
                    {...register("status", {
                      required: t("text.text-required", {
                        textField: t("text.active-status"),
                      }),
                    })}
                  />

                  <FormHelperText>
                    {errors.status?.message}
                  </FormHelperText>
                </FormControl>

                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={5}
                    disabled={activeStatus === "active"}
                    placeholder={currentDescription}
                    value={formData.detail}
                    error={!!errors.detail}
                    helperText={errors.detail?.message}
                    {...register("detail", {
                      validate: (value = "") => {
                        if (activeStatus !== "active" && !value.trim()) {
                          return t("text.text-required", {
                            textField: t("text.reason"),
                          });
                        }

                        return true;
                      },
                      onChange: (event) => {
                        handleTextChange("detail", event.target.value);
                      },
                    })}
                    sx={{
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

                        "&.Mui-disabled fieldset": {
                          borderColor: "var(--primary-color)",
                        },
                      },

                      "& .MuiOutlinedInput-input.Mui-disabled": {
                        WebkitTextFillColor: "var(--primary-color)",
                      },

                      "& textarea.Mui-disabled": {
                        WebkitTextFillColor: "var(--primary-color)",
                      },

                      "& .MuiOutlinedInput-root.Mui-disabled fieldset": {
                        borderColor: "var(--primary-color)",
                      },
                    }}
                  />
                </Box>
              </Box>
            </>
          )}

          <Divider sx={{ borderColor: "#0c5d9f94", borderWidth: "1.5px", mt: 5 }} />

          <Typography variant="h6" sx={{ fontSize: "1.2rem", fontWeight: "bold", color: "var(--primary-color)" }}>
            {t("text.permission")}
          </Typography>

          <Box className="mt-2"
            sx={{
              display: "grid",
              columnGap: 3,
              rowGap: 2,
              gridTemplateColumns: {
                md: "1fr",
                xl: "repeat(3, minmax(0,1fr))",
              },
            }}
          >
            <AutoComplete
              id="permission-select"
              sx={{ marginTop: "5px" }}
              value={formData.permission}
              onChange={(event, value) => handleDropdownChange(event, "permission", value)}
              options={permissionOptions}
              label={t("component.permission")}
              placeholder={t("placeholder.permission")}
              labelFontSize="16px"
              required
              helperText={errors.permission?.message?.toString() ?? ""}
              register={register("permission", {
                required: t("text.text-required", { textField: t("component.permission") }),
              })}
              error={!!errors.permission}
            />

            <TextBox
              sx={{ marginTop: "5px" }}
              id="end_date"
              type="number"
              label={t("component.end-date")}
              placeholder={t("placeholder.end-date")}
              labelFontSize="16px"
              warningText={t("text.end-date-warning-text")}
              value={formData.end_date}
              onChange={(event) => handleTextChange("end_date", event.target.value)}
              disabled={!formData.permission}
            />

            <TextBox
              sx={{ marginTop: "5px" }}
              id="life_date"
              type="number"
              label={t("component.life-date")}
              placeholder={t("placeholder.life-date")}
              labelFontSize="16px"
              warningText={t("text.life-date-warning-text")}
              value={formData.life_date}
              onChange={(event) => handleTextChange("life_date", event.target.value)}
              disabled={!formData.permission}
            />
          </Box>

          <Box
            className="rounded-sm bg-(--tertiary-color) border border-(--primary-color) p-4 mt-4"
            sx={{ 
              boxShadow: "1px 1px 5px rgba(0, 0, 0, 0.1)",
              display: "grid",
              columnGap: 5,
              rowGap: 2,
              gridTemplateColumns: {
                md: "1fr",
                xl: "repeat(2, minmax(0,1fr))",
              },
            }}
          >
            <PermissionTable
              permissionUiList={permissionUiList}
              checkpointList={checkpointData}
              permissions={permissions}
              onPermissionsChange={handleGroupPermissionsChange}
              disabled={!formData.permission}
            />
          </Box>

          <Box className="mt-2 flex justify-end items-center gap-2">
            <Button
              variant="outlined"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--tertiary-color)",
                border: "1px solid var(--primary-color)",
                color: "var(--primary-color)",
                "&:hover": { backgroundColor: "rgba(var(--primary-color-rgb), 0.8)" },
                textTransform: "capitalize",
              }}
              onClick={handleCancelClick}
            >
              {t("button.cancel")}
            </Button>

            <Button
              variant="contained"
              type="submit"
              sx={{
                width: 130,
                height: 35,
                backgroundColor: "var(--primary-color)",
                color: "var(--tertiary-color)",
                "&:hover": { backgroundColor: "rgba(var(--primary-color-rgb), 0.8)" },
                textTransform: "capitalize",
              }}
            >
              {t("button.save")}
            </Button>
          </Box>
        </form>
      </Box>
    </section>
  );
};

export default UserForm;
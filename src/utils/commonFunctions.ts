// Types
import type { ValidateUserDataParams } from "../types/common";

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{6,}$/;
  return passwordRegex.test(password);
};

export const  isValidThaiID = (id: string): boolean => {
  const cleaned = id.replace(/\D/g, '');
  
  const digits = cleaned.split('').map(Number);

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (13 - i);
  }

  const mod = sum % 11;
  const checkDigit = (11 - mod) % 10;

  return checkDigit === digits[12];
};

export const loadFont = async (fontPath: string): Promise<string> => {
  const response = await fetch(fontPath);
  const arrayBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < uint8Array.byteLength; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
};

export const capitalizeWords = (text: string) => {
  if (!text) return "";
  return text.replace(/\b\w/g, (char) => char.toUpperCase());
}

export const buildOptions = (
  list: any[],
  defaultLabel: string,
  label: string = "name",
  value: string = "code",
  isAll: boolean = true,
  allValue: string = "0",
) => {
  const options = list.map((item) => ({
    label: item[label],
    value: item[value],
  }));

  return isAll
    ? [{ label: defaultLabel, value: allValue }, ...options]
    : options;
};

export const generatePassword = (length: number = 12): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specials = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = uppercase + lowercase + numbers + specials;

  const password = [
    uppercase[Math.floor(Math.random() * uppercase.length)],
    lowercase[Math.floor(Math.random() * lowercase.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    specials[Math.floor(Math.random() * specials.length)],
  ];

  for (let i = password.length; i < Math.max(length, 6); i++) {
    password.push(
      allChars[Math.floor(Math.random() * allChars.length)]
    );
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join("");
};

export const formatPhone = (value: string | undefined) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;

  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

export const formatThaiID = (value: string | undefined) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 13);

  if (digits.length <= 1) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 1)}-${digits.slice(1)}`;
  if (digits.length <= 10) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10)}`;

  return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5, 10)}-${digits.slice(10, 12)}-${digits.slice(12)}`;
};

export const normalizeText = (value: any) => value?.toString().trim().toLowerCase() ?? "";

export const validateUserImportData = ({
  nationalId = "",
  phoneNumber = "",
  firstName = "",
  lastName = "",
  ouData,
  t,
}: ValidateUserDataParams) => {
  const isValidNationalId =
    nationalId.length === 13 && isValidThaiID(nationalId);

  const isValidPhoneNumber =
    /^\d{10}$/.test(phoneNumber) && phoneNumber.startsWith("0");

  const isNameEmpty = !firstName?.trim();
  const isLastNameEmpty = !lastName?.trim();

  const isEmptyRow =
    !isValidNationalId &&
    !isValidPhoneNumber &&
    isNameEmpty &&
    isLastNameEmpty;

  if (isEmptyRow) {
    return {
      shouldSkip: true,
      isInvalid: false,
      errorDetail: [],
      error: "",
    };
  }

  const errorDetail: string[] = [];

  if (!isValidNationalId) errorDetail.push(t("text.invalid-pid"));
  if (!isValidPhoneNumber) errorDetail.push(t("text.invalid-phone"));
  if (isNameEmpty) errorDetail.push(t("text.invalid-name"));
  if (isLastNameEmpty) errorDetail.push(t("text.invalid-last-name"));

  if (!ouData) errorDetail.push(t("text.invalid-agency"));

  return {
    shouldSkip: false,
    isInvalid: errorDetail.length > 0,
    errorDetail,
    error: errorDetail.join(", "),
  };
};
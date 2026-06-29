import CryptoJS from "crypto-js";

const SECRET_KEY = "NSB@Admin";

export const encryptUserId = (userId: number): string => {
  const ciphertext = CryptoJS.AES.encrypt(
    userId.toString(),
    SECRET_KEY
  ).toString();
  return encodeURIComponent(ciphertext);
};

export const decryptUserId = (hash: string): number => {
  const bytes = CryptoJS.AES.decrypt(decodeURIComponent(hash), SECRET_KEY);
  return parseInt(bytes.toString(CryptoJS.enc.Utf8), 10);
};

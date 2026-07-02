// Types
import type { 
  UploadedResponse,
  DeleteFileResponse,
} from "../../../types/response";

// Api
import { fetchClient } from "../../../api/fetchClient";

export const requestUpload = async (
  body: FormData
): Promise<UploadedResponse> => {
  return fetchClient<UploadedResponse>("/upload/", {
    method: "POST",
    body,
    isFormData: true,
  });
};

export const removeUpload = async (
  body: { keys: string[] }
): Promise<DeleteFileResponse> => {
  return fetchClient<DeleteFileResponse>("/upload/remove", {
    method: "POST",
    body: JSON.stringify(body),
  });
};
import { toast } from "react-toastify";

/**
 * Non-blocking replacement for the old "operation complete" SweetAlert2
 * popup. Confirm/warning/error popups still go through `popupMessage.tsx` —
 * this is only for success notifications that don't need an explicit
 * acknowledgement.
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}

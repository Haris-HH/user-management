// Types
import type { PermissionUiList } from "../types/common";

export const PERMISSION_UI_LIST: PermissionUiList[] = [
  {
    name: "ตรวจหาทะเบียนรถ",
    active: true,
    edit: true,
    group_list: [
      "แบบระบุเงื่อนไข",
      "ก่อน/หลังผ่านด่านตรวจ",
    ],
  },
  {
    name: "ตรวจหาใบหน้า",
    active: true,
    edit: true,
    group_list: [
      "ค้นหาด้วยใบหน้า",
      "ค้นหาด้วยหมายเลขทะเบียน",
    ],
  },
  {
    name: "ระบบวิเคราะห์ยานพาหนะ",
    active: true,
    edit: true,
    group_list: [
      "ทะเบียนปลอม",
      "สวมทะเบียน",
      "วิเคราะห์ยานพาหนะจากทะเบียน (Convoy)",
      "วิเคราะห์ยานพาหนะจากด่านตรวจ",
    ],
  },
  {
    name: "ตัวช่วย",
    active: true,
    edit: true,
    group_list: [
      "แผนที่จุดตรวจ",
      "ขอไฟล์ VDO ย้อนหลัง",
    ],
  },
  {
    name: "Admin",
    active: true,
    edit: true,
    group_list: [
      "รายการขอไฟล์ VDO ย้อนหลัง",
      "ยื่นคำขอใช้งาน",
    ],
  },
  {
    name: "บริหาร Website",
    active: true,
    edit: true,
    group_list: [
      "จัดการประกาศ",
    ],
  },
]
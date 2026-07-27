// Types
import type { TopUsers } from "../types/common";
import type { TopUsersResponse } from "../types/response";

/*
  These fixtures previously described a long-removed shape: they were
  annotated as TopUsersResponse but carried { messages, results, ... } while
  the endpoint (and StatisticTopUsers) actually read BasicResponse.data, so
  the Top Users chart rendered empty whenever VITE_IS_DEV was set. The same
  people and monthly usage figures are kept, remapped onto the real
  TopUsers shape.
*/
const mockTopInternalUsersData: TopUsers[] = [
  {
    rank: 1,
    user_id: "3440299987644",
    title_id: 1,
    title: "นาย",
    firstname: "กิตติเดช",
    lastname: "ห้าวหาญ",
    idcard: "3440299987644",
    phone: "0998978576",
    username: "3440299987644",
    ou_code: "00",
    ou_name: "สำนักงานตำรวจแห่งชาติ",
    org_code: "00010000",
    months: {
      "2026-04": 3500,
      "2026-03": 2500,
      "2026-02": 5050,
    },
    total: 11050,
  },
  {
    rank: 2,
    user_id: "1440276788123",
    title_id: 1,
    title: "นาย",
    firstname: "สมศักดิ์",
    lastname: "บุญหาญ",
    idcard: "1440276788123",
    phone: "0818000573",
    username: "1440276788123",
    ou_code: "00",
    ou_name: "สำนักงานตำรวจแห่งชาติ",
    org_code: "00010000",
    months: {
      "2026-04": 2450,
      "2026-03": 1750,
      "2026-02": 5000,
    },
    total: 9200,
  },
];

const mockTopExternalUsersData: TopUsers[] = [
  {
    rank: 1,
    user_id: "3440299987678",
    title_id: 1,
    title: "นาย",
    firstname: "อดิสร",
    lastname: "ศิริพจนา",
    idcard: "3440299987678",
    phone: "0998978876",
    username: "3440299987678",
    ou_code: "00",
    ou_name: "สำนักงานตำรวจแห่งชาติ",
    org_code: "00010000",
    months: {
      "2026-04": 6500,
      "2026-03": 6750,
      "2026-02": 7700,
    },
    total: 20950,
  },
  {
    rank: 2,
    user_id: "1440276789998",
    title_id: 1,
    title: "นาย",
    firstname: "ชาติชาย",
    lastname: "พงษ์ศรี",
    idcard: "1440276789998",
    phone: "0998978876",
    username: "1440276789998",
    ou_code: "00",
    ou_name: "สำนักงานตำรวจแห่งชาติ",
    org_code: "00010000",
    months: {
      "2026-04": 5450,
      "2026-03": 6000,
      "2026-02": 7150,
    },
    total: 18600,
  },
];

export const mockTopInternalUsers: TopUsersResponse = {
  endpoint: "/api/v0/log-management/access-logs/statistics/user-max-access",
  message: "OK",
  statusCode: 200,
  status: "Successful",
  success: true,
  data: mockTopInternalUsersData,
};

export const mockTopExternalUsers: TopUsersResponse = {
  endpoint: "/api/v0/log-management/access-logs/statistics/user-max-access",
  message: "OK",
  statusCode: 200,
  status: "Successful",
  success: true,
  data: mockTopExternalUsersData,
};

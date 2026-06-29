import React, { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs';
import buddhistEra from "dayjs/plugin/buddhistEra";
import { useSelector } from 'react-redux';

// Store
import type { RootState } from "../store/store";

// Material UI
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import type { SelectChangeEvent } from '@mui/material';

// Components
import MainTitle from "../components/main-title/MainTitle";
import DatePickerBuddhist from "../components/date-picker-buddhist/DatePickerBuddhist";
import PaginationBelowTableComponent from "../components/pagination/PaginationBelowTable";
import LoadingScreen from '../components/loading-screen/LoadingScreen';

// API
import { getTopUsersChart } from "../features/usage-chart/api/UsageChartApi";
import { getUserApi } from "../features/users/api/UsersApi";

// Types
import type { TopUsersResponse } from "../types/response";
import type { TopUsers, User } from "../types/common";

// Constants
import { ROWS_PER_PAGE_OPTIONS } from "../constants/dropdown";

// Hooks
import usePageTitle from "../hooks/usePageTitle";

// Utils
import { formatPhone, formatThaiID } from '../utils/commonFunctions';

dayjs.extend(buddhistEra);

interface FormData {
  month_year: Date | null;
}

// i18n
import { useTranslation } from 'react-i18next';

const StatisticTopUsers = () => {
  // i18n
  const { t, i18n } = useTranslation();

  // Set Page Title
  usePageTitle(t('pages.statistics'));

  // State
  const [policeState, setPoliceState] = useState<"internal" | "external">("internal");
  const [isLoading, setIsLoading] = useState(false);

  // Data
  const [topUsersData, setTopUsersData] = useState<TopUsersResponse | null>(null);
  
  // Constants
  const TOP_INTERNAL_VALUE = 1;
  const TOP_EXTERNAL_VALUE = 1;
  const MONTH_RANGE = 3;

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [rowsPerPage, setRowsPerPage] = useState(
    ROWS_PER_PAGE_OPTIONS[0],
  );
  const [rowsPerPageOptions] = useState(ROWS_PER_PAGE_OPTIONS);

  // Form Data
  const [formData, setFormData] = useState<FormData>({
    month_year: dayjs().toDate(),
  });

  // Slice
  const { title, agency } = useSelector((state: RootState) => state.dropdown);

  useEffect(() => {
    if (!formData.month_year) return;

    fetchData();
  }, [
    formData.month_year, 
    policeState,
    page,
    rowsPerPage,
  ]);

  const getFilters = useCallback((): Record<string, string> => {
    const filters: Record<string, string> = {
      start_month: dayjs(formData.month_year).format("YYYY-MM"),
      ou_code: policeState === "internal" ? "00" : "05",
      event_type: "login",
      count_month: "3",
      min_count: policeState === "internal"
        ? TOP_INTERNAL_VALUE.toString()
        : TOP_EXTERNAL_VALUE.toString(),
      page: page.toString(),
      limit: rowsPerPage.toString(),
    };

    return filters;
  }, [
    formData.month_year, 
    policeState,
    page,
    rowsPerPage,
  ]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const res = await getTopUsersChart(getFilters());
      const topUsers = res.data ?? [];
      setTotalPages(res.pagination?.maxPage ?? 1);

      const userIds = [...new Set(topUsers.map((item) => item.user_id))];

      let userMap = new Map<string, User>();

      if (userIds.length > 0) {
        const usersRes = await getUserApi({
          filter: `user_id=${userIds.join("|")}`,
        });

        userMap = new Map(
          usersRes.data?.map((user) => [user.user_id, user]) ?? []
        );
      }

      const updatedData: TopUsers[] = topUsers.map((user) => {
        const userInfo = userMap.get(user.user_id);

        const titleName = title.find(
          (titleItem) => titleItem.id === userInfo?.title_id
        );

        const agencyName = agency.find(
          (agencyItem) => agencyItem.ou_code === userInfo?.ou_code
        );

        return {
          ...user,
          pid: userInfo?.idcard ?? "",
          title_id: userInfo?.title_id,
          title:
            i18n.language === "th"
              ? titleName?.title_abbr_th ?? ""
              : titleName?.title_abbr_en ?? "",
          firstname: userInfo?.firstname ?? "",
          lastname: userInfo?.lastname ?? "",
          idcard: userInfo?.idcard ?? "-",
          phone: userInfo?.phone ?? "-",
          ou_name:
            i18n.language === "th"
              ? agencyName?.ou_abbr_th ?? "-"
              : agencyName?.ou_abbr_en ?? "-",
        };
      });

      setTopUsersData({
        ...res,
        data: updatedData,
      });
    } catch (error) {
      setTopUsersData(null);
    } finally {
      setIsLoading(false);
    }
  }, [getFilters, title, agency, i18n.language]);

  const handleStateChange = (value: "internal" | "external") => {
    setPoliceState(value);
  };

  const handleRowsPerPageChange = async (event: SelectChangeEvent) => {
    const limit = parseInt(event.target.value)
    setRowsPerPage(limit);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    event.preventDefault();
    setPage(value);
    setPageInput(value.toString());
  };

  const handlePageInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cleaned = event.target.value.replace(/\D/g, "");

    setPageInput(cleaned);
  };

  const handlePageInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    const nextPage = Number(pageInput);

    if (!nextPage) {
      setPageInput(page.toString());
      return;
    }

    const validPage = Math.min(Math.max(nextPage, 1), totalPages);

    setPage(validPage);
    setPageInput(validPage.toString());
  };

  const handleDateTimeChange = (key: keyof typeof formData, date: Date | null) => {
    setFormData((prevState) => ({
      ...prevState,
      [key]: date,
    }));
  };

  const monthKeys = Array.from({ length: MONTH_RANGE }, (_, index) =>
    dayjs(formData.month_year)
      .subtract(MONTH_RANGE - index - 1, "month")
      .format("YYYY-MM")
  );

  return (
    <section id="statistic-top-users" className="flex flex-col h-full w-full p-2">
      {isLoading && <LoadingScreen />}
      {/* Main Title */}
      <MainTitle title={t('pages.statistics')} />
      <Box className='p-4 flex flex-col gap-2 bg-(--main-bg-color) min-h-0 h-full w-full rounded-lg border border-(--primary-color) overflow-y-auto'>
        {/* Chart */}
        <Box 
          className="w-full bg-(--tertiary-color) p-4 flex flex-col gap-4"
          sx={{
            boxShadow: "-2px 3px 2px rgba(0,0,0,0.1)"
          }}
        >
          <Box className="flex flex-col gap-2">
            <Box className='flex gap-2'>
              <Box className='flex gap-2 w-50'>
                <DatePickerBuddhist
                  value={formData.month_year}
                  sx={{
                    marginTop: "5px",
                    borderRadius: "5px",
                    backgroundColor: "white",
                    "& .MuiTextField-root": {
                      height: "fit-content",
                    },
                    "& .MuiOutlinedInput-input": {
                      fontSize: 14,
                    },
                  }}
                  className="w-full"
                  id="month-year"
                  onChange={(value) =>
                    handleDateTimeChange("month_year", value)
                  }

                  label={t('component.main-month')}
                  labelFontSize="14px"
                  views={["year", "month"]}
                  openTo="month"
                  format='MMMM YYYY'
                  maxDate={dayjs()}
                />
              </Box>
              <Box className='flex items-end'>
                <Box 
                  className='flex justify-center items-center text-(--tertiary-color) text-[14px] bg-(--primary-color) h-10.5 w-20 rounded-[5px]'
                  style={{
                    fontFamily: "Noto Sans Thai",
                    fontWeight: 700,
                  }}
                >
                  {t('text.three-month')}
                </Box>
              </Box>
            </Box>
            <Box className='flex gap-3 items-center mt-5'>
              <Button
                variant="contained"
                sx={{
                  width: 180,
                  height: 40,
                  backgroundColor: policeState === "internal" ? "var(--primary-color)" : "var(--tertiary-color)",
                  color: policeState === "internal" ? "var(--tertiary-color)" : "var(--primary-color)",
                  border: policeState === "internal" ? "none" : "1px solid var(--primary-color)",
                  "&:hover": {
                    backgroundColor: policeState === "internal" ? "rgba(var(--primary-color-rgb), 0.8)" : "rgba(var(--secondary-color-rgb), 0.05)",
                  },
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
                onClick={() => handleStateChange("internal")}
              >
                {t('button.internal-police')}
              </Button>
              <Button
                variant="contained"
                sx={{
                  width: 180,
                  height: 40,
                  backgroundColor: policeState === "external" ? "var(--primary-color)" : "var(--tertiary-color)",
                  color: policeState === "external" ? "var(--tertiary-color)" : "var(--primary-color)",
                  border: policeState === "external" ? "none" : "1px solid var(--primary-color)",
                  "&:hover": {
                    backgroundColor: policeState === "external" ? "rgba(var(--primary-color-rgb), 0.8)" : "rgba(var(--secondary-color-rgb), 0.05)",
                  },
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
                onClick={() => handleStateChange("external")}
              >
                {t('button.external-police')}
              </Button>
            </Box>

            {/* Table */}
            <TableContainer
              component={Paper}
              className="mt-3 flex-1"
              sx={{
                backgroundColor: "transparent",
                overflow: "auto"
              }}
            >
              <Table
                size="small"
                sx={{ minWidth: 650, backgroundColor: "var(--tertiary-color)" }}
                stickyHeader
              >
                {/* ================= HEADER ================= */}
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: "var(--primary-color)",
                      position: "sticky",
                      top: 0,
                      zIndex: 2,
                      height: 40,
                      "& th": {
                        color: "var(--tertiary-color)",
                        border: "1px solid rgba(var(--primary-color-rgb), 0.5)",
                        padding: "6px 8px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <TableCell align="center" sx={{ width: "3%" }}>
                      {t("table.header.no")}
                    </TableCell>
                    <TableCell align="center" sx={{ width: "8%" }}>
                      {t("table.header.pid")}
                    </TableCell>
                    <TableCell align="center" sx={{ width: "12%" }}>
                      {t("table.header.first-name")}
                    </TableCell>
                    <TableCell align="center" sx={{ width: "8%" }}>
                      {t("table.header.mobile")}
                    </TableCell>
                    <TableCell align="center" sx={{ width: "10%" }}>
                      {t("table.header.agency")}
                    </TableCell>

                    {monthKeys.map((month) => (
                      <TableCell key={month} align="center" sx={{ width: "8%" }}>
                        {dayjs(month)
                          .locale(i18n.language)
                          .format(i18n.language === "th" ? "MMMM BBBB" : "MMMM YYYY")}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                {/* ================= BODY ================= */}
                <TableBody>
                  {topUsersData?.data?.length ? (
                    topUsersData.data.map((item) => (
                      <TableRow
                        key={item.user_id}
                        sx={{
                          "& td": {
                            border: "1px solid rgba(var(--primary-color-rgb), 0.5)",
                            padding: "6px 8px",
                            color: "var(--primary-color)",
                            whiteSpace: "nowrap",
                          },
                        }}
                      >
                        <TableCell align="center">{item.rank}</TableCell>

                        <TableCell align="center">
                          {formatThaiID(item.idcard ?? "")}
                        </TableCell>

                        <TableCell align="center">
                          {`${item.title ? `${item.title} ` : ""}${item.firstname ?? ""} ${
                            item.lastname ?? ""
                          }`}
                        </TableCell>

                        <TableCell align="center">
                          {formatPhone(item.phone ?? "")}
                        </TableCell>

                        <TableCell align="center">{item.ou_name ?? "-"}</TableCell>

                        {monthKeys.map((month) => {
                          const count = item.months?.[month] ?? 0;

                          const isCurrentMonth =
                            month === dayjs(formData.month_year).format("YYYY-MM");

                          return (
                            <TableCell
                              key={`${item.user_id}-${month}`}
                              align="center"
                              sx={{
                                backgroundColor: isCurrentMonth
                                  ? "rgba(var(--primary-color-rgb), 0.5)"
                                  : "rgba(var(--primary-color-rgb), 0.2)",
                                fontWeight: isCurrentMonth ? 700 : 400,
                                color: isCurrentMonth
                                  ? "var(--secondary-color) !important"
                                  : "var(--primary-color) !important",
                              }}
                            >
                              {count.toLocaleString()}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell 
                        align="center" 
                        colSpan={5 + monthKeys.length}
                        sx={{ color: "var(--secondary-color)" }}
                      >
                        {t("text.no-data")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        <Box className={`${(topUsersData?.data && topUsersData?.data?.length > 0) ? "flex" : "hidden"} items-center justify-between py-3 pl-1 mt-auto`}>
          <PaginationBelowTableComponent 
            page={page} 
            onChange={handlePageChange}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={rowsPerPageOptions}
            handleRowsPerPageChange={handleRowsPerPageChange}
            totalPages={totalPages}
            pageInput={pageInput.toString()}
            handlePageInputKeyDown={handlePageInputKeyDown}
            handlePageInputChange={handlePageInputChange}
          />
        </Box>
      </Box>
    </section>
  )
}

export default StatisticTopUsers;
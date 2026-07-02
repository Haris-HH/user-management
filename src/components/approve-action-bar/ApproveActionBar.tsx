import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs';

// Material UI
import Box from "@mui/material/Box";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from "@mui/material/Button";

// Components
import ActivationModal from '../activation-modal/ActivationModal';

// Icons
import PDFIcon from "../../assets/icons/pdf.png";
import ExcelIcon from "../../assets/icons/excel.png";
import {
  FaTrash,
} from "react-icons/fa";

// i18n
import { useTranslation } from 'react-i18next';

// Utils
import { exportExcel } from '../../utils/exportData';

// Types
import type { User } from "../../types/common";
import type { ActivationConfirmData } from '../activation-modal/ActivationModal';

// PDF
import {
  downloadAddApproveUsersPdf,
} from "../../pdf/AddApproveUsersPdf";

type Props = {
  tab: number;
  onTabSelectChange: (tabIndex: number) => void;
  data: User[];
  userSelected: string[];
  onDelete: () => void;
  onApprove: (data: ActivationConfirmData) => void;
  onReject: () => void;
  onWait: () => void;
}

const ApproveActionBar = ({
  tab,
  onTabSelectChange, 
  data,
  userSelected,
  onDelete,
  onApprove,
  onReject,
  onWait,
} : Props) => {

  // i18n
  const { t, i18n } = useTranslation();

  // State
  const [openActivationModal, setOpenActivationModal] = useState<boolean>(false);

  // Data
  const [tabValue, setTabValue] = useState(tab);

  const hasSelectedUser = userSelected.length > 0;

  useEffect(() => {
    setTabValue(tab);
  }, [tab])

  const tapProps = (index: number) => {
    return {
      id: `tab-${index}`,
      sx:{
        backgroundColor: "var(--tertiary-color)",
        color: "var(--primary-color)",
        fontWeight: 700,
        fontSize: "16px",
        padding: "5px 50px",
        border: "1px solid var(--primary-color)",
        textTransform: "capitalize",
        "&.Mui-selected": {
          backgroundColor: "var(--primary-color)",
          color: "var(--tertiary-color)",
        },
      }
    };
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    event.preventDefault();
    setTabValue(newValue);
    onTabSelectChange(newValue);
  };

  const handleDeleteClick = () => {
    if (onDelete) onDelete(); 
  }

  const handleExportExcel = async () => {
    const dateFormat = i18n.language === "th" ? "BBBB-MM-DD" : "YYYY-MM-DD";
    const dataDateFormat = i18n.language === "th" ? "DD/MM/BBBB HH:mm:ss" : "DD/MM/YYYY HH:mm:ss";
    await exportExcel({
      sheetName: `${t('file-name.manage-user')}_${tabValue === 0 ? t('tabs.pending') : tabValue === 1 ? t('tabs.approved') : t('tabs.rejected')}`,
      fileName: `${t('file-name.manage-user')}_${dayjs().format(dateFormat)}.xlsx`,
      headers: [
        t('table.header.no'),
        t('table.header.pid'),
        t('table.header.prefix'),
        t('table.header.first-name'),
        t('table.header.last-name'),
        t('table.header.position'),
        t('table.header.agency'),
        t('table.header.bh'),
        t('table.header.bk'),
        t('table.header.org'),
        t('table.header.email'),
        t('table.header.mobile'),
        ...(tabValue === 0
          ? [
              t("table.header.group-name"),
              t("table.header.update-profile-status"),
              t("table.header.latest-update-profile-date"),
            ]
          : []),

        ...(tabValue === 1
          ? [
              t("table.header.approve-date"),
              t("table.header.active-date"),
              t("table.header.group-name"),
              t("table.header.update-profile-status"),
              t("table.header.latest-update-profile-date"),
            ]
          : []),

        ...(tabValue === 2
          ? [
              t("table.header.unapprove-date"),
              t("table.header.group-name"),
              t("table.header.status-change-remark"),
            ]
          : []),
      ],
      data: data,
      mapRow: (data, index) => [
        index + 1,
        data.idcard || "-",
        data.title || "-",
        data.firstname || "-",
        data.lastname || "-",
        data.position || "-",
        data.ou_name || "-",
        data.bh_name || "-",
        data.bk_name || "-",
        data.org_name || "-",
        data.email || "-",
        data.phone || "-",
        ...(tabValue === 0
          ? [
              data.user_group_name || "-",
              data.police_profile_status || "-",
              data.police_profile_status_datetime
                ? dayjs(data.police_profile_status_datetime).format(dataDateFormat)
                : "-",
            ]
          : []),

        ...(tabValue === 1
          ? [
              data.approve_date ? dayjs(data.approve_date).format(dataDateFormat) : "-",
              data.active_datetime
                ? dayjs(data.active_datetime).format(dataDateFormat)
                : "-",
              data.user_group_name || "-",
              data.police_profile_status || "-",
              data.police_profile_status_datetime
                ? dayjs(data.police_profile_status_datetime).format(dataDateFormat)
                : "-",
            ]
          : []),

        ...(tabValue === 2
          ? [
              data.approve_date ? dayjs(data.approve_date).format(dataDateFormat) : "-",
              data.user_group_name || "-",
              data.details || "-",
            ]
          : []),
      ],
      columnStyles: {
        2: { alignment: { horizontal: "center" } },
      },
    });
  };

  const handleExportPdf = async () => {
    const dateFormat = i18n.language === "th" ? "BBBB-MM-DD" : "YYYY-MM-DD";
    const pdfName = `${t('file-name.add-approve-user')}_${dayjs().format(dateFormat)}.pdf`;
    await downloadAddApproveUsersPdf(
      data,
      pdfName,
      t,
      i18n,
      tabValue
    );
  };

  const confirmApprove = (data: ActivationConfirmData) => {
    if (onApprove) onApprove(data); 
    setOpenActivationModal(false);
  }

  const handleWaitClick = () => {
    if (onWait) onWait();
  }

  const handleRejectClick = () => {
    if (onReject) onReject();
  }

  return (
    <Box className="flex justify-between items-center">
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{
          overflow: "hidden",
          textTransform: "capitalize",
          "& .MuiTab-root": {
            borderRight: "none",
          },
          "& .MuiTab-root:first-of-type": {
            borderRight: "1px solid var(--primary-color)",
            borderTopLeftRadius: "12px",
          },
          "& .MuiTab-root:last-of-type": {
            borderRight: "1px solid var(--primary-color)",
            borderTopRightRadius: "12px",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "transparent",
          },
        }}
      >
        <Tab label={t('tabs.pending')} {...tapProps(0)} />
        <Tab label={t('tabs.approved')} {...tapProps(1)} />
        <Tab label={t('tabs.rejected')} {...tapProps(2)} />
      </Tabs>

      <Box className="flex gap-2 ml-2">
        <Button
          variant="outlined"
          sx={{
            width: 130,
            height: 40,
            backgroundColor: "var(--tertiary-color)",
            color: "var(--primary-color)",
            border: "1px solid var(--primary-color)",
            "&:hover": {
              backgroundColor: "rgba(var(--tertiary-color-rgb), 0.7)",
            },
            textTransform: "capitalize",
            "&.Mui-disabled": {
              backgroundColor: "var(--tertiary-color)",
              color: "var(--primary-color)",
              opacity: 0.5,
            },
          }}
          startIcon={
            <img src={PDFIcon} alt='PDF' className='w-5 h-6' />
          }
          disabled={data.length === 0}
          onClick={handleExportPdf}
        >
          {t('button.export')}
        </Button>
        <Button
          variant="outlined"
          sx={{
            width: 130,
            height: 40,
            backgroundColor: "var(--tertiary-color)",
            color: "var(--primary-color)",
            border: "1px solid var(--primary-color)",
            "&:hover": {
              backgroundColor: "rgba(var(--tertiary-color-rgb), 0.7)",
            },
            textTransform: "capitalize",
            "&.Mui-disabled": {
              backgroundColor: "var(--tertiary-color)",
              color: "var(--primary-color)",
              opacity: 0.5,
            },
          }}
          startIcon={
            <img src={ExcelIcon} alt='Excel' className='w-5 h-6' />
          }
          disabled={data.length === 0}
          onClick={handleExportExcel}
        >
          {t('button.export')}
        </Button>
        <>
          {
            tabValue === 1 && (
              <Button
                variant="contained"
                sx={{
                  width: 130,
                  height: 40,
                  backgroundColor: "var(--approve-bg-color)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgb(var(--approve-bg-color-rgb), 0.8)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(var(--approve-bg-color-rgb), 0.5)",
                    color: "var(--secondary-color)",
                    cursor: "not-allowed",
                  },
                  textTransform: "capitalize"
                }}
                disabled={!hasSelectedUser}
                onClick={() => setOpenActivationModal(true)}
              >
                {t('button.active')}
              </Button>
            )
          }
          {
            tabValue === 2 ?
            (
              <Button
                variant="contained"
                sx={{
                  width: 130,
                  height: 40,
                  backgroundColor: "var(--waiting-approve-bg-color)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgb(var(--waiting-approve-bg-color-rgb), 0.8)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(var(--waiting-approve-bg-color-rgb), 0.5)",
                    color: "var(--secondary-color)",
                    cursor: "not-allowed",
                  },
                  textTransform: "capitalize"
                }}
                disabled={!hasSelectedUser}
                onClick={handleWaitClick}
              >
                {t('button.pending')}
              </Button>
            ) :
            (
              <Button
                variant="contained"
                sx={{
                  width: 130,
                  height: 40,
                  backgroundColor: "var(--not-approve-bg-color)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgb(var(--not-approve-bg-color-rgb), 0.8)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(var(--not-approve-bg-color-rgb), 0.5)",
                    color: "var(--secondary-color)",
                    cursor: "not-allowed",
                  },
                  textTransform: "capitalize"
                }}
                disabled={!hasSelectedUser}
                onClick={handleRejectClick}
              >
                {t('button.rejected')}
              </Button>
            )
          }
          {
            tabValue === 1 &&
            (
              <Button
                variant="contained"
                sx={{
                  width: 130,
                  height: 40,
                  backgroundColor: "var(--waiting-approve-bg-color)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgb(var(--waiting-approve-bg-color-rgb), 0.8)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(var(--waiting-approve-bg-color-rgb), 0.5)",
                    color: "var(--secondary-color)",
                    cursor: "not-allowed",
                  },
                  textTransform: "capitalize"
                }}
                disabled={!hasSelectedUser}
                onClick={handleWaitClick}
              >
                {t('button.pending')}
              </Button>
            )
          }
          {
            tabValue !== 1 && (
              <Button
                variant="contained"
                sx={{
                  width: 130,
                  height: 40,
                  backgroundColor: "var(--approve-bg-color)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgb(var(--approve-bg-color-rgb), 0.8)",
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "rgba(var(--approve-bg-color-rgb), 0.5)",
                    color: "var(--secondary-color)",
                    cursor: "not-allowed",
                  },
                  textTransform: "capitalize"
                }}
                disabled={!hasSelectedUser}
                onClick={() => setOpenActivationModal(true)}
              >
                {t('button.approved')}
              </Button>
            )
          }
        </>
        <Button
          sx={{
            height: "35px",
            minWidth: "30px",
          }}
          disabled={!hasSelectedUser}
          onClick={handleDeleteClick}
        >
          <FaTrash
            color={!hasSelectedUser ? "var(--trash-icon)" : "var(--trash-active-icon)"}
            size={20}
          />
        </Button>
      </Box>

      {
        openActivationModal && (
          <ActivationModal
            open={openActivationModal}
            onClose={() => setOpenActivationModal(false)}
            onConfirm={confirmApprove}
          />
        )
      }
    </Box>
  )
}

export default ApproveActionBar;
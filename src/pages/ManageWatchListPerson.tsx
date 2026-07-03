// Material UI
import Box from "@mui/material/Box"

// i18n
import { useTranslation } from "react-i18next";

// Components
import usePageTitle from "../hooks/usePageTitle";
import MainTitle from "../components/main-title/MainTitle";
import ManageGroup from "../components/manage-group/ManageGroup";

const ManageWatchListPerson = () => {
  // i18n
  const { t } = useTranslation();

  // Set Page Title
  usePageTitle(t("pages.manage-watch-list-person"));

  return (
    <section id="manage-watch-list-person">
      <Box className="p-6 flex flex-col gap-4">
        <MainTitle title={t("pages.manage-watch-list-person")} />

        <ManageGroup group_type="watchlist" />
      </Box>
    </section>
  );
};

export default ManageWatchListPerson;
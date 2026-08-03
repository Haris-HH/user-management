// Material UI
import Box from "@mui/material/Box";

// Components
import MainTitle from '../components/main-title/MainTitle';
import ManageGroup from "../components/manage-group/ManageGroup";

// i18n
import { useTranslation } from 'react-i18next';

// Hooks
import usePageTitle from "../hooks/usePageTitle";
import { usePermission } from "../hooks/usePermission";

// Constants
import { USER_MANAGEMENT_UI_KEY } from "../constants/permissions";

const ManageWatchListPlate = () => {
  // i18n
  const { t } = useTranslation();

  // Permission
  const { canEdit } = usePermission(
    USER_MANAGEMENT_UI_KEY,
    "manage-watch-list-plate"
  );

  // Set Page Title
  usePageTitle(t('pages.manage-watch-list-plate'));

  return (
    <section id='manage-watch-list-plate'>
      <Box className='p-6 flex flex-col gap-4'>
        {/* Main Title */}
        <MainTitle title={t('pages.manage-watch-list-plate')} />

        <ManageGroup group_type="plate" canEdit={canEdit} />
      </Box>
    </section>
  )
}

export default ManageWatchListPlate;
// Material UI
import Box from "@mui/material/Box";

// Components
import MainTitle from '../components/main-title/MainTitle';
import ManageGroup from "../components/manage-group/ManageGroup";

// i18n
import { useTranslation } from 'react-i18next';

// Hooks
import usePageTitle from "../hooks/usePageTitle";

const ManageWatchListCheckpoint = () => {
  // i18n
  const { t } = useTranslation();

  // Set Page Title
  usePageTitle(t('pages.manage-watch-list-checkpoint'));

  return (
    <section id='manage-watch-list-checkpoint'>
      <Box className='p-6 flex flex-col gap-4'>
        {/* Main Title */}
        <MainTitle title={t('pages.manage-watch-list-checkpoint')} />

        <ManageGroup group_type="checkpoint" />
      </Box>
    </section>
  )
}

export default ManageWatchListCheckpoint;
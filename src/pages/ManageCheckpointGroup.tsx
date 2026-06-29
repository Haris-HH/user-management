// Material UI
import Box from "@mui/material/Box";

// Components
import MainTitle from '../components/main-title/MainTitle';
import CheckpointGroupList from '../components/group-list/CheckpointGroupList';
import CheckpointList from '../components/checkpoint-list/CheckpointList';

// i18n
import { useTranslation } from 'react-i18next';

// Hooks
import usePageTitle from "../hooks/usePageTitle";

const ManageCheckpointGroup = () => {
  // i18n
  const { t } = useTranslation();

  // Set Page Title
  usePageTitle(t('pages.manage-checkpoint-group'));

  return (
    <section id='manage-checkpoint-group'>
      <Box className='p-6 flex flex-col gap-4'>
        {/* Main Title */}
        <MainTitle title={t('pages.manage-checkpoint-group')} />

        <Box className="grid grid-cols-[30vw_1fr] gap-5">
          <CheckpointGroupList />
          <CheckpointList />
        </Box>
      </Box>
    </section>
  )
}

export default ManageCheckpointGroup;
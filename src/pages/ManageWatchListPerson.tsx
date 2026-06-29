// Material UI
import Box from "@mui/material/Box";

// Components
import MainTitle from '../components/main-title/MainTitle';
import GroupList from '../components/group-list/GroupList';
import UserList from '../components/user-list/UserList';

// i18n
import { useTranslation } from 'react-i18next';

// Hooks
import usePageTitle from "../hooks/usePageTitle";

const ManageWatchListPerson = () => {
  // i18n
  const { t } = useTranslation();

  // Set Page Title
  usePageTitle(t('pages.manage-watch-list-person'));

  return (
    <section id='manage-watch-list-person'>
      <Box className='p-6 flex flex-col gap-4'>
        {/* Main Title */}
        <MainTitle title={t('pages.manage-watch-list-person')} />

        <Box className="grid grid-cols-[30vw_1fr] gap-5">
          <GroupList />
          <UserList />
        </Box>
      </Box>
    </section>
  )
}

export default ManageWatchListPerson;
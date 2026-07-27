// Material UI
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';

// i18n
import { useTranslation } from 'react-i18next';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: "var(--tertiary-color)",
  '&:hover': {
    backgroundColor: "rgba(var(--secondary-color-rgb), 0.05)",
    borderBottomColor: "var(--primary-color)",
  },
  marginLeft: 0,
  width: '100%',
  borderBottom: "1px solid rgba(var(--primary-color-rgb), 0.5)",
  borderBottomRightRadius: "0px",
  borderBottomLeftRadius: "0px",
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: '200px',
  },
}));

const SearchIconWrapper = styled('div')(() => ({
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  right: 5,
  top: 0,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'var(--secondary-color)',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 1),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

type Props = {
  value?: string | number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void
}

const SearchInput = ({
  value,
  onChange,
  onKeyDown,
}: Props) => {
  // i18n
  const { t } = useTranslation();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event);
    }
  }

  return (
    <Search>
      <StyledInputBase
        placeholder={t('placeholder.search')}
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
      />
      <SearchIconWrapper>
        <SearchIcon sx={{ fontSize: "20px", color: "rgba(var(--secondary-color-rgb), 0.5)" }} />
      </SearchIconWrapper>
    </Search>
  )
}

export default SearchInput;
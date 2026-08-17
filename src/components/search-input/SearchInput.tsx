// Material UI
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { styled } from '@mui/material/styles';

// i18n
import { useTranslation } from 'react-i18next';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: "var(--theme-panel)",
  '&:hover': {
    backgroundColor: "rgba(var(--theme-accent-soft-rgb), 0.05)",
    borderBottomColor: "var(--theme-accent)",
  },
  marginLeft: 0,
  width: '100%',
  borderBottom: "1px solid rgba(var(--theme-accent-rgb), 0.50)",
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
  color: 'var(--theme-accent-soft)',
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
        <SearchIcon sx={{ fontSize: "20px", color: "rgba(var(--theme-accent-soft-rgb), 0.50)" }} />
      </SearchIconWrapper>
    </Search>
  )
}

export default SearchInput;
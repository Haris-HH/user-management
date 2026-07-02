// Material UI
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import { styled, alpha } from '@mui/material/styles';
import { useState } from 'react';

// i18n
import { useTranslation } from 'react-i18next';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: "rgba(var(--secondary-color-rgb), 0.8)",
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.70),
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
  right: 0,
  top: 0,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
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
        <SearchIcon sx={{ fontSize: "20px", color: "var(--tertiary-color)" }} />
      </SearchIconWrapper>
    </Search>
  )
}

export default SearchInput;
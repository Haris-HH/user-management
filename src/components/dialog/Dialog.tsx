// Material UI
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';

type Props = {
  open: boolean;
  handleClose: () => void;
  dialogTitle: string;
  children: React.ReactNode;
  width?: string;
  disabled?: boolean;
}

const DialogComponent = ({ 
  open, 
  handleClose, 
  dialogTitle, 
  children,
  width = "450px", 
  disabled = false,
}: Props) => {
  return (
    <Dialog 
      open={open} 
      fullWidth 
      maxWidth={false}
      slotProps={{
        root: {
          sx: {
            zIndex: 9998,
          }
        },
        paper: {
          sx: {
            width: width,
            borderRadius: "5px",
            overflow: "visible",
          },
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "var(--primary-color)",
          color: "var(--tertiary-color)",
          py: 0,
          px: 2,
        }}
      >
        <div className='flex justify-between items-center'>
          <span className='text-[15px]'>{dialogTitle}</span>
          <IconButton disabled={disabled}>
            <HighlightOffIcon onClick={handleClose} 
              sx={{ 
                color: "var(--tertiary-color)", 
                mr: "-15px", 
                fontSize: "20px",
                cursor: disabled ? "not-allowed" : "pointer"
              }} 
            />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(--tertiary-color)",
          overflow: "visible",
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default DialogComponent;
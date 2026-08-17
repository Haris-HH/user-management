// Material UI
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
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
            backgroundColor: "var(--theme-panel)",
            border: "1px solid rgba(var(--theme-accent-rgb), 0.35)",
          },
        }
      }}
    >
      <DialogTitle
        sx={{
          py: 1,
          px: 2,
          color: "var(--theme-accent)",
        }}
      >
        <div className='flex flex-col'>
          <div className='flex justify-between items-center'>
            <span className='text-xl'>{dialogTitle}</span>
            <IconButton disabled={disabled}>
              <HighlightOffIcon onClick={handleClose} 
                sx={{ 
                  color: "var(--theme-accent)", 
                  mr: "-10px", 
                  fontSize: "20px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  ":hover": {
                    scale: disabled ? 1 : 1.1,
                  }
                }} 
              />
            </IconButton>
          </div>
          <Divider orientation='horizontal' sx={{ width: "100%", borderColor: "rgba(var(--theme-accent-rgb), 0.35)" }} />
        </div>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "var(--theme-panel)",
          overflow: "visible",
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default DialogComponent;
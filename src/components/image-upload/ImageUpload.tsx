import React, { useState, useEffect } from 'react'

// Material UI
import Box from "@mui/material/Box";

import FileUploadIcon from '@mui/icons-material/FileUpload';

// i18n
import { useTranslation } from 'react-i18next';

type Props = {
  initialImage?: string;
  onImageChange?: (file: File | null) => void;
  onImageDelete?: () => void;
};

const ImageUpload = ({ initialImage, onImageChange, onImageDelete }: Props) => {

  // i18n
  const { t } = useTranslation();

  // Data
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);

  // State
  const [isFileOverSize, setIsFileOverSize] = useState(false);

  // Re-sync from the `initialImage` prop when it changes externally. State is
  // adjusted during render (React's documented pattern for "adjusting state
  // when a prop changes") instead of in an effect, avoiding a synchronous
  // setState-in-effect and the extra render that effect would cause.
  const [prevInitialImage, setPrevInitialImage] = useState(initialImage);

  if (initialImage !== prevInitialImage) {
    setPrevInitialImage(initialImage);
    setUploadedImage(initialImage || null);
  }

  // Release the object URL created for a local preview once it's replaced or
  // the component unmounts, so it isn't leaked.
  useEffect(() => {
    return () => {
      if (uploadedImage?.startsWith("blob:")) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      setIsFileOverSize(true);
      event.target.value = "";
      return;
    }

    setUploadedImage(URL.createObjectURL(file));
    onImageChange?.(file);
    setIsFileOverSize(false);

    event.target.value = "";
  };

  const handleImageDelete = () => {
    setUploadedImage(null);
    onImageChange?.(null);
    onImageDelete?.();
  };

  return (
    <Box className="flex flex-col items-center justify-center w-50">
      <Box
        sx={{
          position: "relative",
          width: "200px",
          height: "230px",
          border: "2px solid var(--theme-accent)",
          borderRadius: "5px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          backgroundColor: "var(--theme-panel)",
        }}
      >
        {
          uploadedImage ? (
            <>
              <img
                src={uploadedImage}
                alt="Uploaded Image"
                style={{ 
                  width: "100%", 
                  height: "100%",
                  objectFit: "cover",
                  color: "var(--theme-accent)"
                }}
              />
              <button
                  onClick={handleImageDelete}
                  style={{
                    position: "absolute",
                    top: "5px",
                    right: "5px",
                    backgroundColor: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "25px",
                    height: "25px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "bold",
                    lineHeight: "25px",
                    textAlign: "center",
                  }}
              >
                ×
              </button>
            </>
          ) :
          (
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                cursor: "pointer",
                color: "var(--theme-accent)",
                fontSize: "14px",
              }}
            >
              <FileUploadIcon />
              <span className="font-semibold text-[15px]">{t('text.upload-image')}</span>
              <span style={{ fontSize: t('text.size-not-over-1-mb-font-size') }}>{t('text.size-not-over-1-mb')}</span>
              <span style={{ fontSize: t('text.support-file-font-size') }} >{t('text.support-file')}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </label>
          )
        }
      </Box>
      {
        isFileOverSize && (<label className="text-(--theme-red) text-xs mt-2">{`*${t('text.upload-image-not-over-2-mb')}`}</label>)
      }
    </Box>
  )
}

export default ImageUpload;
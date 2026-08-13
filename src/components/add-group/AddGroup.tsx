import { Controller, useForm } from "react-hook-form";

// Material UI
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import TelegramIcon from "@mui/icons-material/Telegram";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Icons
import DiscordIcon from "../../assets/svg/discord.svg?react";

// Components
import Dialog from "../dialog/Dialog";
import TextBox from "../text-box/TextBox";

// i18n
import { useTranslation } from "react-i18next";

export interface AddGroupFormData {
  groupName: string;
  botToken: string;
  chatId: string;
  webHookUrl: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: AddGroupFormData) => void | Promise<void>;
  isWatchList?: boolean;
  loading?: boolean;
};

type IntegrationSectionProps = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
};

const defaultValues: AddGroupFormData = {
  groupName: "",
  botToken: "",
  chatId: "",
  webHookUrl: "",
};

const IntegrationSection = ({
  icon,
  title,
  description,
  children,
}: IntegrationSectionProps) => {
  return (
    <Box
      component="fieldset"
      sx={{
        m: 0,
        p: 0,
        minWidth: 0,
        border: 0,
      }}
    >
      <Box
        sx={{
          overflow: "hidden",
          border: "1px solid rgba(var(--primary-color-rgb), 0.25)",
          borderRadius: "10px",
          bgcolor: "var(--tertiary-color)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          "&:focus-within": {
            borderColor: "var(--primary-color)",
            boxShadow: "0 0 0 3px rgba(var(--primary-color-rgb), 0.1)",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.25,
            px: 2,
            py: 1.5,
            bgcolor: "rgba(var(--primary-color-rgb), 0.05)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: "9px",
              color: "var(--primary-color)",
              bgcolor: "rgba(var(--primary-color-rgb), 0.1)",
              p: 1
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="legend"
              sx={{
                p: 0,
                color: "var(--primary-color)",
                fontSize: "15px",
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {title}
            </Typography>

            {description && (
              <Typography
                sx={{
                  mt: 0.25,
                  color: "rgba(var(--primary-color-rgb),0.6)",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                {description}
              </Typography>
            )}
          </Box>
        </Box>

        <Divider />

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

const AddGroup = ({
  open,
  onClose,
  onConfirm,
  loading = false,
  isWatchList = true,
}: Props) => {
  const { t } = useTranslation();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AddGroupFormData>({
    defaultValues,
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const submitting = loading || isSubmitting;

  const handleClose = () => {
    if (submitting) return;

    reset(defaultValues);
    onClose();
  };

  const handleConfirmClick = async (data: AddGroupFormData) => {
    const normalizedData: AddGroupFormData = {
      groupName: data.groupName.trim(),
      botToken: data.botToken.trim(),
      chatId: data.chatId.trim(),
      webHookUrl: data.webHookUrl.trim(),
    };

    await onConfirm(normalizedData);
    reset(defaultValues);
    onClose();
  };

  const validateWebhookUrl = (value: string) => {
    const trimmedValue = value.trim();

    if (!trimmedValue) return true;

    try {
      const url = new URL(trimmedValue);

      if (!["http:", "https:"].includes(url.protocol)) {
        return t("validation.invalid-url");
      }

      return true;
    } catch {
      return t("validation.invalid-url");
    }
  };

  return (
    <Dialog
      open={open}
      handleClose={handleClose}
      dialogTitle={t("dialog.add-group")}
      width="620px"
      disabled={submitting}
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(handleConfirmClick)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
          pt: 1,
        }}
      >
        <Controller
          name="groupName"
          control={control}
          rules={{
            required: t("text.text-required", {
              textField: t("component.group-name"),
            }),
            validate: (value) =>
              value.trim().length > 0 ||
              t("text.text-required", {
                textField: t("component.group-name"),
              }),
            maxLength: {
              value: 100,
              message: t(
                "validation.group-name-max-length"
              ),
            },
          }}
          render={({ field }) => (
            <TextBox
              {...field}
              id="group-name"
              label={t("component.group-name")}
              placeholder={t("placeholder.group-name")}
              autoComplete="off"
              required
              error={Boolean(errors.groupName)}
              helperText={errors.groupName?.message}
            />
          )}
        />

        {
          isWatchList && (
            <>
              <IntegrationSection
                icon={<TelegramIcon fontSize="small" />}
                title={t("text.telegram")}
                description={t(
                  "text.telegram-description"
                )}
              >
                <Controller
                  name="botToken"
                  control={control}
                  rules={{
                    validate: (value) => {
                      const chatId = getValues("chatId");

                      if (chatId.trim() && !value.trim()) {
                        return t(
                          "validation.telegram-bot-token-required"
                        );
                      }

                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <TextBox
                      {...field}
                      id="bot-token"
                      label={t("component.bot-token")}
                      placeholder={t("placeholder.bot-token")}
                      type="password"
                      autoComplete="new-password"
                      error={Boolean(errors.botToken)}
                      helperText={errors.botToken?.message}
                      onChange={(event) => {
                        field.onChange(event);
                        void trigger("chatId");
                      }}
                    />
                  )}
                />

                <Controller
                  name="chatId"
                  control={control}
                  rules={{
                    validate: (value) => {
                      const botToken = getValues("botToken");

                      if (botToken.trim() && !value.trim()) {
                        return t(
                          "validation.telegram-chat-id-required"
                        );
                      }

                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <TextBox
                      {...field}
                      id="chat-id"
                      label={t("component.chat-id")}
                      placeholder={t("placeholder.chat-id")}
                      autoComplete="off"
                      error={Boolean(errors.chatId)}
                      helperText={errors.chatId?.message}
                      onChange={(event) => {
                        field.onChange(event);
                        void trigger("botToken");
                      }}
                    />
                  )}
                />
              </IntegrationSection>

              <IntegrationSection
                icon={<DiscordIcon fontSize="small" style={{ color: "var(--primary-color)" }} />}
                title={t("text.discord")}
                description={t(
                  "text.discord-description"
                )}
              >
                <Controller
                  name="webHookUrl"
                  control={control}
                  rules={{
                    validate: validateWebhookUrl,
                  }}
                  render={({ field }) => (
                    <TextBox
                      {...field}
                      id="webhook-url"
                      label={t("component.webhook-url")}
                      placeholder={t("placeholder.webhook-url")}
                      type="url"
                      autoComplete="url"
                      error={Boolean(errors.webHookUrl)}
                      helperText={errors.webHookUrl?.message}
                    />
                  )}
                />
              </IntegrationSection>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "8px",
                  color: "text.secondary",
                  bgcolor: "rgba(var(--primary-color-rgb), 0.05)",
                }}
              >
                <InfoOutlinedIcon
                  sx={{
                    mt: "1px",
                    flexShrink: 0,
                    color: "var(--primary-color)",
                    fontSize: "18px",
                  }}
                />

                <Typography
                  sx={{
                    fontSize: "12px",
                    lineHeight: 1.5,
                    color: "rgba(var(--primary-color-rgb),0.6)",
                  }}
                >
                  {t(
                    "text.notification-integration-optional"
                    )}
                </Typography>
              </Box>

              <Divider />
            </>
          )
        }

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.25,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            disabled={submitting}
            onClick={handleClose}
            sx={{
              minWidth: 110,
              height: 38,
              borderRadius: "8px",
              borderColor: "var(--primary-color)",
              color: "var(--primary-color)",
              textTransform: "none",
              fontWeight: 500,
              boxShadow: "none",
              "&:hover": {
                borderColor: "var(--primary-color)",
                bgcolor: "rgba(var(--primary-color-rgb), 0.06)",
              },
            }}
          >
            {t("button.cancel")}
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              minWidth: 120,
              height: 38,
              borderRadius: "8px",
              bgcolor: "var(--primary-color)",
              color: "var(--tertiary-color)",
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 4px 10px rgba(var(--primary-color-rgb), 0.2)",
              "&:hover": {
                bgcolor: "rgba(var(--primary-color-rgb), 0.88)",
                boxShadow:
                  "0 6px 14px rgba(var(--primary-color-rgb), 0.25)",
              },
            }}
          >
            {t("button.confirm")}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};

export default AddGroup;
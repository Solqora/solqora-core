/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useCallback } from 'react';
import { Toast, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import { getTextContent } from '../../helpers';
import { ERROR_MESSAGES } from '../../constants/playground.constants';

export const useMessageActions = (
  message,
  setMessage,
  onMessageSend,
  saveMessages,
) => {
  const { t } = useTranslation();

  // 
  const handleMessageCopy = useCallback(
    (targetMessage) => {
      const textToCopy = getTextContent(targetMessage);

      if (!textToCopy) {
        Toast.warning({
          content: t(ERROR_MESSAGES.NO_TEXT_CONTENT),
          duration: 2,
        });
        return;
      }

      const copyToClipboard = async (text) => {
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(text);
            Toast.success({
              content: t(''),
              duration: 2,
            });
          } catch (err) {
            console.error('Clipboard API :', err);
            fallbackCopy(text);
          }
        } else {
          fallbackCopy(text);
        }
      };

      const fallbackCopy = (text) => {
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.cssText = `
          position: fixed;
          top: -9999px;
          left: -9999px;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        `;
          textArea.setAttribute('readonly', '');

          document.body.appendChild(textArea);
          textArea.select();
          textArea.setSelectionRange(0, text.length);

          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);

          if (successful) {
            Toast.success({
              content: t(''),
              duration: 2,
            });
          } else {
            throw new Error('execCommand copy failed');
          }
        } catch (err) {
          console.error(':', err);

          let errorMessage = t(ERROR_MESSAGES.COPY_FAILED);
          if (
            window.location.protocol === 'http:' &&
            window.location.hostname !== 'localhost'
          ) {
            errorMessage = t(ERROR_MESSAGES.COPY_HTTPS_REQUIRED);
          } else if (!navigator.clipboard && !document.execCommand) {
            errorMessage = t(ERROR_MESSAGES.BROWSER_NOT_SUPPORTED);
          }

          Toast.error({
            content: errorMessage,
            duration: 4,
          });
        }
      };

      copyToClipboard(textToCopy);
    },
    [t],
  );

  // 
  const handleMessageReset = useCallback(
    (targetMessage) => {
      setMessage((prevMessages) => {
        //  id 
        let messageIndex = prevMessages.findIndex(
          (msg) => msg === targetMessage,
        );

        //  id 
        if (messageIndex === -1) {
          messageIndex = prevMessages.findIndex(
            (msg) => msg.id === targetMessage.id,
          );
        }

        if (messageIndex === -1) return prevMessages;

        if (targetMessage.role === 'user') {
          const newMessages = prevMessages.slice(0, messageIndex);
          const contentToSend = getTextContent(targetMessage);

          setTimeout(() => {
            onMessageSend(contentToSend);
          }, 100);

          return newMessages;
        } else if (
          targetMessage.role === 'assistant' ||
          targetMessage.role === 'system'
        ) {
          let userMessageIndex = messageIndex - 1;
          while (
            userMessageIndex >= 0 &&
            prevMessages[userMessageIndex].role !== 'user'
          ) {
            userMessageIndex--;
          }

          if (userMessageIndex >= 0) {
            const userMessage = prevMessages[userMessageIndex];
            const newMessages = prevMessages.slice(0, userMessageIndex);
            const contentToSend = getTextContent(userMessage);

            setTimeout(() => {
              onMessageSend(contentToSend);
            }, 100);

            return newMessages;
          }
        }

        return prevMessages;
      });
    },
    [setMessage, onMessageSend],
  );

  // 
  const handleMessageDelete = useCallback(
    (targetMessage) => {
      Modal.confirm({
        title: t(''),
        content: t(''),
        okText: t(''),
        cancelText: t(''),
        okButtonProps: {
          type: 'danger',
        },
        onOk: () => {
          setMessage((prevMessages) => {
            //  id 
            let messageIndex = prevMessages.findIndex(
              (msg) => msg === targetMessage,
            );

            //  id 
            if (messageIndex === -1) {
              messageIndex = prevMessages.findIndex(
                (msg) => msg.id === targetMessage.id,
              );
            }

            if (messageIndex === -1) return prevMessages;

            let updatedMessages;
            if (
              targetMessage.role === 'user' &&
              messageIndex < prevMessages.length - 1
            ) {
              const nextMessage = prevMessages[messageIndex + 1];
              if (nextMessage.role === 'assistant') {
                Toast.success({
                  content: t(''),
                  duration: 2,
                });
                updatedMessages = prevMessages.filter(
                  (_, index) =>
                    index !== messageIndex && index !== messageIndex + 1,
                );
              } else {
                Toast.success({
                  content: t(''),
                  duration: 2,
                });
                updatedMessages = prevMessages.filter(
                  (msg) => msg.id !== targetMessage.id,
                );
              }
            } else {
              Toast.success({
                content: t(''),
                duration: 2,
              });
              updatedMessages = prevMessages.filter(
                (msg) => msg.id !== targetMessage.id,
              );
            }

            // 
            setTimeout(() => saveMessages(updatedMessages), 0);
            return updatedMessages;
          });
        },
      });
    },
    [setMessage, t, saveMessages],
  );

  // 
  const handleRoleToggle = useCallback(
    (targetMessage) => {
      if (
        !(targetMessage.role === 'assistant' || targetMessage.role === 'system')
      ) {
        return;
      }

      const newRole =
        targetMessage.role === 'assistant' ? 'system' : 'assistant';

      setMessage((prevMessages) => {
        const updatedMessages = prevMessages.map((msg) => {
          if (
            msg.id === targetMessage.id &&
            (msg.role === 'assistant' || msg.role === 'system')
          ) {
            return { ...msg, role: newRole };
          }
          return msg;
        });

        // 
        setTimeout(() => saveMessages(updatedMessages), 0);
        return updatedMessages;
      });

      Toast.success({
        content: t(
          `${newRole === 'system' ? 'System' : 'Assistant'}`,
        ),
        duration: 2,
      });
    },
    [setMessage, t, saveMessages],
  );

  return {
    handleMessageCopy,
    handleMessageReset,
    handleMessageDelete,
    handleRoleToggle,
  };
};

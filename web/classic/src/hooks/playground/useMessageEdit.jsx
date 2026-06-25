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

import { useCallback, useState, useRef } from 'react';
import { Toast, Modal } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';
import {
  getTextContent,
  buildApiPayload,
  createLoadingAssistantMessage,
} from '../../helpers';
import { MESSAGE_ROLES } from '../../constants/playground.constants';

export const useMessageEdit = (
  setMessage,
  inputs,
  parameterEnabled,
  sendRequest,
  saveMessages,
) => {
  const { t } = useTranslation();
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const editingMessageRef = useRef(null);

  const handleMessageEdit = useCallback((targetMessage) => {
    const editableContent = getTextContent(targetMessage);
    setEditingMessageId(targetMessage.id);
    editingMessageRef.current = targetMessage;
    setEditValue(editableContent);
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editingMessageId || !editValue.trim()) return;

    setMessage((prevMessages) => {
      let messageIndex = prevMessages.findIndex(
        (msg) => msg === editingMessageRef.current,
      );

      if (messageIndex === -1) {
        messageIndex = prevMessages.findIndex(
          (msg) => msg.id === editingMessageId,
        );
      }

      const targetMessage = prevMessages[messageIndex];
      let newContent;

      if (Array.isArray(targetMessage.content)) {
        newContent = targetMessage.content.map((item) =>
          item.type === 'text' ? { ...item, text: editValue.trim() } : item,
        );
      } else {
        newContent = editValue.trim();
      }

      const updatedMessages = prevMessages.map((msg) =>
        msg.id === editingMessageId ? { ...msg, content: newContent } : msg,
      );

      // 
      if (targetMessage.role === MESSAGE_ROLES.USER) {
        const hasSubsequentAssistantReply =
          messageIndex < prevMessages.length - 1 &&
          prevMessages[messageIndex + 1].role === MESSAGE_ROLES.ASSISTANT;

        if (hasSubsequentAssistantReply) {
          Modal.confirm({
            title: t(''),
            content: t('AI'),
            okText: t(''),
            cancelText: t(''),
            onOk: () => {
              const messagesUntilUser = updatedMessages.slice(
                0,
                messageIndex + 1,
              );
              setMessage(messagesUntilUser);
              // 
              setTimeout(() => saveMessages(messagesUntilUser), 0);

              setTimeout(() => {
                const payload = buildApiPayload(
                  messagesUntilUser,
                  null,
                  inputs,
                  parameterEnabled,
                );
                setMessage((prevMsg) => [
                  ...prevMsg,
                  createLoadingAssistantMessage(),
                ]);
                sendRequest(payload, inputs.stream);
              }, 100);
            },
            onCancel: () => {
              setMessage(updatedMessages);
              // 
              setTimeout(() => saveMessages(updatedMessages), 0);
            },
          });
          return prevMessages;
        }
      }

      // 
      setTimeout(() => saveMessages(updatedMessages), 0);
      return updatedMessages;
    });

    setEditingMessageId(null);
    editingMessageRef.current = null;
    setEditValue('');
    Toast.success({ content: t(''), duration: 2 });
  }, [
    editingMessageId,
    editValue,
    t,
    inputs,
    parameterEnabled,
    sendRequest,
    setMessage,
    saveMessages,
  ]);

  const handleEditCancel = useCallback(() => {
    setEditingMessageId(null);
    editingMessageRef.current = null;
    setEditValue('');
  }, []);

  return {
    editingMessageId,
    editValue,
    setEditValue,
    handleMessageEdit,
    handleEditSave,
    handleEditCancel,
  };
};

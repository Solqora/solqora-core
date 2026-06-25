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

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_MESSAGES,
  getDefaultMessages,
  DEFAULT_CONFIG,
  DEBUG_TABS,
  MESSAGE_STATUS,
} from '../../constants/playground.constants';
import {
  loadConfig,
  saveConfig,
  loadMessages,
  saveMessages,
} from '../../components/playground/configStorage';
import { processIncompleteThinkTags } from '../../helpers';

export const usePlaygroundState = () => {
  const { t } = useTranslation();

  // 
  const [savedConfig] = useState(() => loadConfig());
  const [initialMessages] = useState(() => {
    const loaded = loadMessages();
    // 
    if (
      loaded &&
      loaded.length === 2 &&
      loaded[0].id === '2' &&
      loaded[1].id === '3'
    ) {
      const hasOldChinese =
        loaded[0].content === '' ||
        loaded[1].content === '' ||
        loaded[1].content === '';

      if (hasOldChinese) {
        // 
        localStorage.removeItem('playground_messages');
        return null;
      }
    }
    return loaded;
  });

  // 
  const [inputs, setInputs] = useState(
    savedConfig.inputs || DEFAULT_CONFIG.inputs,
  );
  const [parameterEnabled, setParameterEnabled] = useState(
    savedConfig.parameterEnabled || DEFAULT_CONFIG.parameterEnabled,
  );
  const [showDebugPanel, setShowDebugPanel] = useState(
    savedConfig.showDebugPanel || DEFAULT_CONFIG.showDebugPanel,
  );
  const [customRequestMode, setCustomRequestMode] = useState(
    savedConfig.customRequestMode || DEFAULT_CONFIG.customRequestMode,
  );
  const [customRequestBody, setCustomRequestBody] = useState(
    savedConfig.customRequestBody || DEFAULT_CONFIG.customRequestBody,
  );

  // UI
  const [showSettings, setShowSettings] = useState(false);
  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [status, setStatus] = useState({});

  //  - 
  const [message, setMessage] = useState(
    () => initialMessages || getDefaultMessages(t),
  );

  // 
  useEffect(() => {
    // 
    if (!initialMessages) {
      setMessage(getDefaultMessages(t));
    }
  }, [t, initialMessages]); // 

  // 
  const [debugData, setDebugData] = useState({
    request: null,
    response: null,
    timestamp: null,
    previewRequest: null,
    previewTimestamp: null,
  });
  const [activeDebugTab, setActiveDebugTab] = useState(DEBUG_TABS.PREVIEW);
  const [previewPayload, setPreviewPayload] = useState(null);

  // 
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Refs
  const sseSourceRef = useRef(null);
  const chatRef = useRef(null);
  const saveConfigTimeoutRef = useRef(null);
  const saveMessagesTimeoutRef = useRef(null);

  // 
  const handleInputChange = useCallback((name, value) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleParameterToggle = useCallback((paramName) => {
    setParameterEnabled((prev) => ({
      ...prev,
      [paramName]: !prev[paramName],
    }));
  }, []);

  //  - 
  const saveMessagesImmediately = useCallback(
    (messagesToSave) => {
      // 
      saveMessages(messagesToSave || message);
    },
    [message],
  );

  // 
  const debouncedSaveConfig = useCallback(() => {
    if (saveConfigTimeoutRef.current) {
      clearTimeout(saveConfigTimeoutRef.current);
    }

    saveConfigTimeoutRef.current = setTimeout(() => {
      const configToSave = {
        inputs,
        parameterEnabled,
        showDebugPanel,
        customRequestMode,
        customRequestBody,
      };
      saveConfig(configToSave);
    }, 1000);
  }, [
    inputs,
    parameterEnabled,
    showDebugPanel,
    customRequestMode,
    customRequestBody,
  ]);

  // /
  const handleConfigImport = useCallback((importedConfig) => {
    if (importedConfig.inputs) {
      const parsedMaxTokens = parseInt(importedConfig.inputs.max_tokens, 10);
      setInputs((prev) => ({
        ...prev,
        ...importedConfig.inputs,
        max_tokens: Number.isNaN(parsedMaxTokens)
          ? importedConfig.inputs.max_tokens
          : parsedMaxTokens,
      }));
    }
    if (importedConfig.parameterEnabled) {
      setParameterEnabled((prev) => ({
        ...prev,
        ...importedConfig.parameterEnabled,
      }));
    }
    if (typeof importedConfig.showDebugPanel === 'boolean') {
      setShowDebugPanel(importedConfig.showDebugPanel);
    }
    if (importedConfig.customRequestMode) {
      setCustomRequestMode(importedConfig.customRequestMode);
    }
    if (importedConfig.customRequestBody) {
      setCustomRequestBody(importedConfig.customRequestBody);
    }
    // 
    if (importedConfig.messages && Array.isArray(importedConfig.messages)) {
      setMessage(importedConfig.messages);
    }
  }, []);

  const handleConfigReset = useCallback((options = {}) => {
    const { resetMessages = false } = options;

    setInputs(DEFAULT_CONFIG.inputs);
    setParameterEnabled(DEFAULT_CONFIG.parameterEnabled);
    setShowDebugPanel(DEFAULT_CONFIG.showDebugPanel);
    setCustomRequestMode(DEFAULT_CONFIG.customRequestMode);
    setCustomRequestBody(DEFAULT_CONFIG.customRequestBody);

    // 
    if (resetMessages) {
      setMessage([]);
      setTimeout(() => {
        setMessage(getDefaultMessages(t));
      }, 0);
    }
  }, []);

  // 
  useEffect(() => {
    return () => {
      if (saveConfigTimeoutRef.current) {
        clearTimeout(saveConfigTimeoutRef.current);
      }
    };
  }, []);

  //  LOADING/INCOMPLETE 
  useEffect(() => {
    if (!Array.isArray(message) || message.length === 0) return;

    const lastMsg = message[message.length - 1];
    if (
      lastMsg.status === MESSAGE_STATUS.LOADING ||
      lastMsg.status === MESSAGE_STATUS.INCOMPLETE
    ) {
      const processed = processIncompleteThinkTags(
        lastMsg.content || '',
        lastMsg.reasoningContent || '',
      );

      const fixedLastMsg = {
        ...lastMsg,
        status: MESSAGE_STATUS.COMPLETE,
        content: processed.content,
        reasoningContent: processed.reasoningContent || null,
        isThinkingComplete: true,
      };

      const updatedMessages = [...message.slice(0, -1), fixedLastMsg];
      setMessage(updatedMessages);

      // 
      setTimeout(() => saveMessagesImmediately(updatedMessages), 0);
    }
  }, []);

  return {
    // 
    inputs,
    parameterEnabled,
    showDebugPanel,
    customRequestMode,
    customRequestBody,

    // UI
    showSettings,
    models,
    groups,
    status,

    // 
    message,

    // 
    debugData,
    activeDebugTab,
    previewPayload,

    // 
    editingMessageId,
    editValue,

    // Refs
    sseSourceRef,
    chatRef,
    saveConfigTimeoutRef,

    // 
    setInputs,
    setParameterEnabled,
    setShowDebugPanel,
    setCustomRequestMode,
    setCustomRequestBody,
    setShowSettings,
    setModels,
    setGroups,
    setStatus,
    setMessage,
    setDebugData,
    setActiveDebugTab,
    setPreviewPayload,
    setEditingMessageId,
    setEditValue,

    // 
    handleInputChange,
    handleParameterToggle,
    debouncedSaveConfig,
    saveMessagesImmediately,
    handleConfigImport,
    handleConfigReset,
  };
};

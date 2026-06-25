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

import {
  STORAGE_KEYS,
  DEFAULT_CONFIG,
} from '../../constants/playground.constants';

const MESSAGES_STORAGE_KEY = 'playground_messages';

/**
 *  localStorage
 * @param {Object} config - 
 */
export const saveConfig = (config) => {
  try {
    const configToSave = {
      ...config,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(configToSave));
  } catch (error) {
    console.error(':', error);
  }
};

/**
 *  localStorage
 * @param {Array} messages - 
 */
export const saveMessages = (messages) => {
  try {
    const messagesToSave = {
      messages,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messagesToSave));
  } catch (error) {
    console.error(':', error);
  }
};

/**
 *  localStorage 
 * @returns {Object} 
 */
export const loadConfig = () => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      const parsedMaxTokens = parseInt(parsedConfig?.inputs?.max_tokens, 10);

      const mergedConfig = {
        inputs: {
          ...DEFAULT_CONFIG.inputs,
          ...parsedConfig.inputs,
          max_tokens: Number.isNaN(parsedMaxTokens)
            ? parsedConfig?.inputs?.max_tokens
            : parsedMaxTokens,
        },
        parameterEnabled: {
          ...DEFAULT_CONFIG.parameterEnabled,
          ...parsedConfig.parameterEnabled,
        },
        showDebugPanel:
          parsedConfig.showDebugPanel || DEFAULT_CONFIG.showDebugPanel,
        customRequestMode:
          parsedConfig.customRequestMode || DEFAULT_CONFIG.customRequestMode,
        customRequestBody:
          parsedConfig.customRequestBody || DEFAULT_CONFIG.customRequestBody,
      };

      return mergedConfig;
    }
  } catch (error) {
    console.error(':', error);
  }

  return DEFAULT_CONFIG;
};

/**
 *  localStorage 
 * @returns {Array}  null
 */
export const loadMessages = () => {
  try {
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      return parsedMessages.messages || null;
    }
  } catch (error) {
    console.error(':', error);
  }

  return null;
};

/**
 * 
 */
export const clearConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES); // 
  } catch (error) {
    console.error(':', error);
  }
};

/**
 * 
 */
export const clearMessages = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
  } catch (error) {
    console.error(':', error);
  }
};

/**
 * 
 * @returns {boolean} 
 */
export const hasStoredConfig = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.CONFIG) !== null;
  } catch (error) {
    console.error(':', error);
    return false;
  }
};

/**
 * 
 * @returns {string|null}  ISO 
 */
export const getConfigTimestamp = () => {
  try {
    const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      return parsedConfig.timestamp || null;
    }
  } catch (error) {
    console.error(':', error);
  }
  return null;
};

/**
 *  JSON 
 * @param {Object} config - 
 * @param {Array} messages - 
 */
export const exportConfig = (config, messages = null) => {
  try {
    const configToExport = {
      ...config,
      messages: messages || loadMessages(), // 
      exportTime: new Date().toISOString(),
      version: '1.0',
    };

    const dataStr = JSON.stringify(configToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `playground-config-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error(':', error);
  }
};

/**
 * 
 * @param {File} file -  JSON 
 * @returns {Promise<Object>} 
 */
export const importConfig = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target.result);

          if (importedConfig.inputs && importedConfig.parameterEnabled) {
            // 
            if (
              importedConfig.messages &&
              Array.isArray(importedConfig.messages)
            ) {
              saveMessages(importedConfig.messages);
            }

            resolve(importedConfig);
          } else {
            reject(new Error(''));
          }
        } catch (parseError) {
          reject(new Error(': ' + parseError.message));
        }
      };
      reader.onerror = () => reject(new Error(''));
      reader.readAsText(file);
    } catch (error) {
      reject(new Error(': ' + error.message));
    }
  });
};

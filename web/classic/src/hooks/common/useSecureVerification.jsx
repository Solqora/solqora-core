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

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SecureVerificationService } from '../../services/secureVerification';
import { showError, showSuccess } from '../../helpers';
import { isVerificationRequiredError } from '../../helpers/secureApiCall';

/**
 *  Hook
 * @param {Object} options - 
 * @param {Function} options.onSuccess - 
 * @param {Function} options.onError - 
 * @param {string} options.successMessage - 
 * @param {boolean} options.autoReset -  true
 */
export const useSecureVerification = ({
  onSuccess,
  onError,
  successMessage,
  autoReset = true,
} = {}) => {
  const { t } = useTranslation();

  // 
  const [verificationMethods, setVerificationMethods] = useState({
    has2FA: false,
    hasPasskey: false,
    passkeySupported: false,
  });

  // 
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 
  const [verificationState, setVerificationState] = useState({
    method: null, // '2fa' | 'passkey'
    loading: false,
    code: '',
    apiCall: null,
  });

  // 
  const checkVerificationMethods = useCallback(async () => {
    const methods =
      await SecureVerificationService.checkAvailableVerificationMethods();
    setVerificationMethods(methods);
    return methods;
  }, []);

  // 
  useEffect(() => {
    checkVerificationMethods();
  }, [checkVerificationMethods]);

  // 
  const resetState = useCallback(() => {
    setVerificationState({
      method: null,
      loading: false,
      code: '',
      apiCall: null,
    });
    setIsModalVisible(false);
  }, []);

  // 
  const startVerification = useCallback(
    async (apiCall, options = {}) => {
      const { preferredMethod, title, description } = options;

      // 
      const methods = await checkVerificationMethods();

      if (!methods.has2FA && !methods.hasPasskey) {
        const errorMessage = t(' Passkey ');
        showError(errorMessage);
        onError?.(new Error(errorMessage));
        return false;
      }

      // 
      let defaultMethod = preferredMethod;
      if (!defaultMethod) {
        if (methods.hasPasskey && methods.passkeySupported) {
          defaultMethod = 'passkey';
        } else if (methods.has2FA) {
          defaultMethod = '2fa';
        }
      }

      setVerificationState((prev) => ({
        ...prev,
        method: defaultMethod,
        apiCall,
        title,
        description,
      }));
      setIsModalVisible(true);

      return true;
    },
    [checkVerificationMethods, onError, t],
  );

  // 
  const executeVerification = useCallback(
    async (method, code = '') => {
      if (!verificationState.apiCall) {
        showError(t(''));
        return;
      }

      setVerificationState((prev) => ({ ...prev, loading: true }));

      try {
        //  API session
        await SecureVerificationService.verify(method, code);

        //  API
        const result = await verificationState.apiCall();

        // 
        if (successMessage) {
          showSuccess(successMessage);
        }

        // 
        onSuccess?.(result, method);

        // 
        if (autoReset) {
          resetState();
        }

        return result;
      } catch (error) {
        showError(error.message || t(''));
        onError?.(error);
        throw error;
      } finally {
        setVerificationState((prev) => ({ ...prev, loading: false }));
      }
    },
    [
      verificationState.apiCall,
      successMessage,
      onSuccess,
      onError,
      autoReset,
      resetState,
      t,
    ],
  );

  // 
  const setVerificationCode = useCallback((code) => {
    setVerificationState((prev) => ({ ...prev, code }));
  }, []);

  // 
  const switchVerificationMethod = useCallback((method) => {
    setVerificationState((prev) => ({ ...prev, method, code: '' }));
  }, []);

  // 
  const cancelVerification = useCallback(() => {
    resetState();
  }, [resetState]);

  // 
  const canUseMethod = useCallback(
    (method) => {
      switch (method) {
        case '2fa':
          return verificationMethods.has2FA;
        case 'passkey':
          return (
            verificationMethods.hasPasskey &&
            verificationMethods.passkeySupported
          );
        default:
          return false;
      }
    },
    [verificationMethods],
  );

  // 
  const getRecommendedMethod = useCallback(() => {
    if (
      verificationMethods.hasPasskey &&
      verificationMethods.passkeySupported
    ) {
      return 'passkey';
    }
    if (verificationMethods.has2FA) {
      return '2fa';
    }
    return null;
  }, [verificationMethods]);

  /**
   *  API 
   *  API 
   * @param {Function} apiCall - API 
   * @param {Object} options -  startVerification
   * @returns {Promise<any>}
   */
  const withVerification = useCallback(
    async (apiCall, options = {}) => {
      try {
        //  API
        return await apiCall();
      } catch (error) {
        // 
        if (isVerificationRequiredError(error)) {
          // 
          await startVerification(apiCall, options);
          // 
          return null;
        }
        // 
        throw error;
      }
    },
    [startVerification],
  );

  return {
    // 
    isModalVisible,
    verificationMethods,
    verificationState,

    // 
    startVerification,
    executeVerification,
    cancelVerification,
    resetState,
    setVerificationCode,
    switchVerificationMethod,
    checkVerificationMethods,

    // 
    canUseMethod,
    getRecommendedMethod,
    withVerification, // 

    // 
    hasAnyVerificationMethod:
      verificationMethods.has2FA || verificationMethods.hasPasskey,
    isLoading: verificationState.loading,
    currentMethod: verificationState.method,
    code: verificationState.code,
  };
};

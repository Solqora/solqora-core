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

import { API, showError } from '../helpers';
import {
  prepareCredentialRequestOptions,
  buildAssertionResult,
  isPasskeySupported,
} from '../helpers/passkey';

/**
 * 
 *  Session 
 */
export class SecureVerificationService {
  /**
   * 
   * @returns {Promise<{has2FA: boolean, hasPasskey: boolean, passkeySupported: boolean}>}
   */
  static async checkAvailableVerificationMethods() {
    try {
      const [twoFAResponse, passkeyResponse, passkeySupported] =
        await Promise.all([
          API.get('/api/user/2fa/status'),
          API.get('/api/user/passkey'),
          isPasskeySupported(),
        ]);

      // console.log('=== DEBUGGING VERIFICATION METHODS ===');
      // console.log('2FA Response:', JSON.stringify(twoFAResponse, null, 2));
      // console.log(
      //   'Passkey Response:',
      //   JSON.stringify(passkeyResponse, null, 2),
      // );

      const has2FA =
        twoFAResponse.data?.success &&
        twoFAResponse.data?.data?.enabled === true;
      const hasPasskey =
        passkeyResponse.data?.success &&
        passkeyResponse.data?.data?.enabled === true;

      console.log('has2FA calculation:', {
        success: twoFAResponse.data?.success,
        dataExists: !!twoFAResponse.data?.data,
        enabled: twoFAResponse.data?.data?.enabled,
        result: has2FA,
      });

      console.log('hasPasskey calculation:', {
        success: passkeyResponse.data?.success,
        dataExists: !!passkeyResponse.data?.data,
        enabled: passkeyResponse.data?.data?.enabled,
        result: hasPasskey,
      });

      const result = {
        has2FA,
        hasPasskey,
        passkeySupported,
      };

      return result;
    } catch (error) {
      console.error('Failed to check verification methods:', error);
      return {
        has2FA: false,
        hasPasskey: false,
        passkeySupported: false,
      };
    }
  }

  /**
   * 2FA
   * @param {string} code - 
   * @returns {Promise<void>}
   */
  static async verify2FA(code) {
    if (!code?.trim()) {
      throw new Error('');
    }

    //  API session
    const verifyResponse = await API.post('/api/verify', {
      method: '2fa',
      code: code.trim(),
    });

    if (!verifyResponse.data?.success) {
      throw new Error(verifyResponse.data?.message || '');
    }

    // session 
  }

  /**
   * Passkey
   * @returns {Promise<void>}
   */
  static async verifyPasskey() {
    try {
      // Passkey
      const beginResponse = await API.post('/api/user/passkey/verify/begin');
      if (!beginResponse.data?.success) {
        throw new Error(beginResponse.data?.message || '');
      }

      // WebAuthn
      const publicKey = prepareCredentialRequestOptions(
        beginResponse.data.data.options,
      );

      // WebAuthn
      const credential = await navigator.credentials.get({ publicKey });
      if (!credential) {
        throw new Error('Passkey ');
      }

      // 
      const assertionResult = buildAssertionResult(credential);

      // 
      const finishResponse = await API.post(
        '/api/user/passkey/verify/finish',
        assertionResult,
      );
      if (!finishResponse.data?.success) {
        throw new Error(finishResponse.data?.message || '');
      }

      //  API  sessionPasskey 
      const verifyResponse = await API.post('/api/verify', {
        method: 'passkey',
      });

      if (!verifyResponse.data?.success) {
        throw new Error(verifyResponse.data?.message || '');
      }

      // session 
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        throw new Error('Passkey ');
      } else if (error.name === 'InvalidStateError') {
        throw new Error('Passkey ');
      } else {
        throw error;
      }
    }
  }

  /**
   * 
   * @param {string} method - : '2fa' | 'passkey'
   * @param {string} code - 2FAmethod'2fa'
   * @returns {Promise<void>}
   */
  static async verify(method, code = '') {
    switch (method) {
      case '2fa':
        return await this.verify2FA(code);
      case 'passkey':
        return await this.verifyPasskey();
      default:
        throw new Error(`: ${method}`);
    }
  }
}

/**
 * API
 */
export const createApiCalls = {
  /**
   * API
   * @param {number} channelId - ID
   */
  viewChannelKey: (channelId) => async () => {
    //  API 
    const response = await API.post(`/api/channel/${channelId}/key`, {});
    return response.data;
  },

  /**
   * API
   * @param {string} url - API URL
   * @param {string} method - HTTP 'POST'
   * @param {Object} extraData - 
   */
  custom:
    (url, method = 'POST', extraData = {}) =>
    async () => {
      // 
      const data = extraData;

      let response;
      switch (method.toUpperCase()) {
        case 'GET':
          response = await API.get(url, { params: data });
          break;
        case 'POST':
          response = await API.post(url, data);
          break;
        case 'PUT':
          response = await API.put(url, data);
          break;
        case 'DELETE':
          response = await API.delete(url, { data });
          break;
        default:
          throw new Error(`HTTP: ${method}`);
      }
      return response.data;
    },
};

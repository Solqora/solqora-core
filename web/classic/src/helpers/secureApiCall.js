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

/**
 *  API 
 *  403 
 */

/**
 * 
 * @param {Error} error - 
 * @returns {boolean}
 */
export function isVerificationRequiredError(error) {
  if (!error.response) return false;

  const { status, data } = error.response;

  //  403 
  if (status === 403 && data) {
    const verificationCodes = [
      'VERIFICATION_REQUIRED',
      'VERIFICATION_EXPIRED',
      'VERIFICATION_INVALID',
    ];

    return verificationCodes.includes(data.code);
  }

  return false;
}

/**
 * 
 * @param {Error} error - 
 * @returns {Object} 
 */
export function extractVerificationInfo(error) {
  const data = error.response?.data || {};

  return {
    code: data.code,
    message: data.message || '',
    required: true,
  };
}

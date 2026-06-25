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

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from '@douyinfe/semi-ui';
import { useSecureVerification } from '../../../hooks/common/useSecureVerification';
import { createApiCalls } from '../../../services/secureVerification';
import SecureVerificationModal from '../modals/SecureVerificationModal';
import ChannelKeyDisplay from '../ui/ChannelKeyDisplay';

/**
 * 
 * 
 */
const ChannelKeyViewExample = ({ channelId }) => {
  const { t } = useTranslation();
  const [keyData, setKeyData] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

  //  Hook
  const {
    isModalVisible,
    verificationMethods,
    verificationState,
    startVerification,
    executeVerification,
    cancelVerification,
    setVerificationCode,
    switchVerificationMethod,
  } = useSecureVerification({
    onSuccess: (result) => {
      // 
      if (result.success && result.data?.key) {
        setKeyData(result.data.key);
        setShowKeyModal(true);
      }
    },
    successMessage: t(''),
  });

  // 
  const handleViewKey = async () => {
    const apiCall = createApiCalls.viewChannelKey(channelId);

    await startVerification(apiCall, {
      title: t(''),
      description: t(''),
      preferredMethod: 'passkey', // 
    });
  };

  return (
    <>
      {/*  */}
      <Button type='primary' theme='outline' onClick={handleViewKey}>
        {t('')}
      </Button>

      {/*  */}
      <SecureVerificationModal
        visible={isModalVisible}
        verificationMethods={verificationMethods}
        verificationState={verificationState}
        onVerify={executeVerification}
        onCancel={cancelVerification}
        onCodeChange={setVerificationCode}
        onMethodSwitch={switchVerificationMethod}
        title={verificationState.title}
        description={verificationState.description}
      />

      {/*  */}
      <Modal
        title={t('')}
        visible={showKeyModal}
        onCancel={() => setShowKeyModal(false)}
        footer={
          <Button type='primary' onClick={() => setShowKeyModal(false)}>
            {t('')}
          </Button>
        }
        width={700}
        style={{ maxWidth: '90vw' }}
      >
        <ChannelKeyDisplay
          keyData={keyData}
          showSuccessIcon={true}
          successText={t('')}
          showWarning={true}
        />
      </Modal>
    </>
  );
};

export default ChannelKeyViewExample;

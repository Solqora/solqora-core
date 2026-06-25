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

import React, { useState, useEffect } from 'react';
import { Modal, Typography, Input } from '@douyinfe/semi-ui';

const { Text } = Typography;

const ConfirmationDialog = ({
  visible,
  onCancel,
  onConfirm,
  title,
  type = 'danger',
  deployment,
  t,
  loading = false,
}) => {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!visible) {
      setConfirmText('');
    }
  }, [visible]);

  const requiredText = deployment?.container_name || deployment?.id || '';
  const isConfirmed = Boolean(requiredText) && confirmText === requiredText;

  const handleCancel = () => {
    setConfirmText('');
    onCancel();
  };

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      handleCancel();
    }
  };

  return (
    <Modal
      title={title}
      visible={visible}
      onCancel={handleCancel}
      onOk={handleConfirm}
      okText={t('')}
      cancelText={t('')}
      okButtonProps={{
        disabled: !isConfirmed,
        type: type === 'danger' ? 'danger' : 'primary',
        loading,
      }}
      width={480}
    >
      <div className='space-y-4'>
        <Text type='danger' strong>
          {t('')}
        </Text>
        <Text>
          {t('')}
          <Text code className='ml-1'>
            {requiredText || t('')}
          </Text>
        </Text>
        <Input
          value={confirmText}
          onChange={setConfirmText}
          placeholder={t('')}
          autoFocus
        />
        {!isConfirmed && confirmText && (
          <Text type='danger' size='small'>
            {t('')}
          </Text>
        )}
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;

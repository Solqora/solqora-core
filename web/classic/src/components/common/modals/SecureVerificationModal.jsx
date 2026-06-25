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

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Button,
  Input,
  Typography,
  Tabs,
  TabPane,
  Space,
  Spin,
} from '@douyinfe/semi-ui';

/**
 * 
 *  useSecureVerification Hook 
 * @param {Object} props
 * @param {boolean} props.visible - 
 * @param {Object} props.verificationMethods - 
 * @param {Object} props.verificationState - 
 * @param {Function} props.onVerify - 
 * @param {Function} props.onCancel - 
 * @param {Function} props.onCodeChange - 
 * @param {Function} props.onMethodSwitch - 
 * @param {string} props.title - 
 * @param {string} props.description - 
 */
const SecureVerificationModal = ({
  visible,
  verificationMethods,
  verificationState,
  onVerify,
  onCancel,
  onCodeChange,
  onMethodSwitch,
  title,
  description,
}) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const { has2FA, hasPasskey, passkeySupported } = verificationMethods;
  const { method, loading, code } = verificationState;

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      setVerifySuccess(false);
    } else {
      setIsAnimating(false);
    }
  }, [visible]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && code.trim() && !loading && method === '2fa') {
      onVerify(method, code);
    }
    if (e.key === 'Escape' && !loading) {
      onCancel();
    }
  };

  // 
  if (visible && !has2FA && !hasPasskey) {
    return (
      <Modal
        title={title || t('')}
        visible={visible}
        onCancel={onCancel}
        footer={<Button onClick={onCancel}>{t('')}</Button>}
        width={500}
        style={{ maxWidth: '90vw' }}
      >
        <div className='text-center py-6'>
          <div className='mb-4'>
            <svg
              className='w-16 h-16 text-yellow-500 mx-auto mb-4'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <Typography.Title heading={4} className='mb-2'>
            {t('')}
          </Typography.Title>
          <Typography.Text type='tertiary'>
            {t(' Passkey ')}
          </Typography.Text>
          <br />
          <Typography.Text type='tertiary'>
            {t(' → ')}
          </Typography.Text>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title={title || t('')}
      visible={visible}
      onCancel={loading ? undefined : onCancel}
      closeOnEsc={!loading}
      footer={null}
      width={460}
      centered
      style={{
        maxWidth: 'calc(100vw - 32px)',
      }}
      bodyStyle={{
        padding: '20px 24px',
      }}
    >
      <div style={{ width: '100%' }}>
        {/*  */}
        {description && (
          <Typography.Paragraph
            type='tertiary'
            style={{
              margin: '0 0 20px 0',
              fontSize: '14px',
              lineHeight: '1.6',
            }}
          >
            {description}
          </Typography.Paragraph>
        )}

        {/*  */}
        <Tabs
          activeKey={method}
          onChange={onMethodSwitch}
          type='line'
          size='default'
          style={{ margin: 0 }}
        >
          {has2FA && (
            <TabPane tab={t('')} itemKey='2fa'>
              <div style={{ paddingTop: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <Input
                    placeholder={t('68')}
                    value={code}
                    onChange={onCodeChange}
                    size='large'
                    maxLength={8}
                    onKeyDown={handleKeyDown}
                    autoFocus={method === '2fa'}
                    disabled={loading}
                    prefix={
                      <svg
                        style={{
                          width: 16,
                          height: 16,
                          marginRight: 8,
                          flexShrink: 0,
                        }}
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z'
                          clipRule='evenodd'
                        />
                      </svg>
                    }
                    style={{ width: '100%' }}
                  />
                </div>

                <Typography.Text
                  type='tertiary'
                  size='small'
                  style={{
                    display: 'block',
                    marginBottom: '20px',
                    fontSize: '13px',
                    lineHeight: '1.5',
                  }}
                >
                  {t('')}
                </Typography.Text>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button onClick={onCancel} disabled={loading}>
                    {t('')}
                  </Button>
                  <Button
                    theme='solid'
                    type='primary'
                    loading={loading}
                    disabled={!code.trim() || loading}
                    onClick={() => onVerify(method, code)}
                  >
                    {t('')}
                  </Button>
                </div>
              </div>
            </TabPane>
          )}

          {hasPasskey && passkeySupported && (
            <TabPane tab={t('Passkey')} itemKey='passkey'>
              <div style={{ paddingTop: '20px' }}>
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'var(--semi-color-primary-light-default)',
                    }}
                  >
                    <svg
                      style={{
                        width: 28,
                        height: 28,
                        color: 'var(--semi-color-primary)',
                      }}
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <Typography.Title
                    heading={5}
                    style={{ margin: '0 0 8px', fontSize: '16px' }}
                  >
                    {t(' Passkey ')}
                  </Typography.Title>
                  <Typography.Text
                    type='tertiary'
                    style={{
                      display: 'block',
                      margin: 0,
                      fontSize: '13px',
                      lineHeight: '1.5',
                    }}
                  >
                    {t('')}
                  </Typography.Text>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <Button onClick={onCancel} disabled={loading}>
                    {t('')}
                  </Button>
                  <Button
                    theme='solid'
                    type='primary'
                    loading={loading}
                    disabled={loading}
                    onClick={() => onVerify(method)}
                  >
                    {t(' Passkey')}
                  </Button>
                </div>
              </div>
            </TabPane>
          )}
        </Tabs>
      </div>
    </Modal>
  );
};

export default SecureVerificationModal;

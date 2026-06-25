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
import { API, showError, showSuccess, showWarning } from '../../../../helpers';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  Divider,
  Input,
  Modal,
  Tag,
  Typography,
  Steps,
  Space,
  Badge,
} from '@douyinfe/semi-ui';
import {
  IconShield,
  IconAlertTriangle,
  IconRefresh,
  IconCopy,
} from '@douyinfe/semi-icons';
import React, { useEffect, useState } from 'react';

import { QRCodeSVG } from 'qrcode.react';

const { Text, Paragraph } = Typography;

const TwoFASetting = ({ t }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({
    enabled: false,
    locked: false,
    backup_codes_remaining: 0,
  });

  // 
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [enableModalVisible, setEnableModalVisible] = useState(false);
  const [disableModalVisible, setDisableModalVisible] = useState(false);
  const [backupModalVisible, setBackupModalVisible] = useState(false);

  // 
  const [setupData, setSetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // 2FA
  const fetchStatus = async () => {
    try {
      const res = await API.get('/api/user/2fa/status');
      if (res.data.success) {
        setStatus(res.data.data);
      }
    } catch (error) {
      showError(t('2FA'));
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // 2FA
  const handleSetup2FA = async () => {
    setLoading(true);
    try {
      const res = await API.post('/api/user/2fa/setup');
      if (res.data.success) {
        setSetupData(res.data.data);
        setSetupModalVisible(true);
        setCurrentStep(0);
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('2FA'));
    } finally {
      setLoading(false);
    }
  };

  // 2FA
  const handleEnable2FA = async () => {
    if (!verificationCode) {
      showWarning(t(''));
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/api/user/2fa/enable', {
        code: verificationCode,
      });
      if (res.data.success) {
        showSuccess(t(''));
        setEnableModalVisible(false);
        setSetupModalVisible(false);
        setVerificationCode('');
        setCurrentStep(0);
        fetchStatus();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('2FA'));
    } finally {
      setLoading(false);
    }
  };

  // 2FA
  const handleDisable2FA = async () => {
    if (!verificationCode) {
      showWarning(t(''));
      return;
    }

    if (!confirmDisable) {
      showWarning(t(''));
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/api/user/2fa/disable', {
        code: verificationCode,
      });
      if (res.data.success) {
        showSuccess(t(''));
        setDisableModalVisible(false);
        setVerificationCode('');
        setConfirmDisable(false);
        fetchStatus();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t('2FA'));
    } finally {
      setLoading(false);
    }
  };

  // 
  const handleRegenerateBackupCodes = async () => {
    if (!verificationCode) {
      showWarning(t(''));
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/api/user/2fa/backup_codes', {
        code: verificationCode,
      });
      if (res.data.success) {
        setBackupCodes(res.data.data.backup_codes);
        showSuccess(t(''));
        setVerificationCode('');
        fetchStatus();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t(''));
    } finally {
      setLoading(false);
    }
  };

  // 
  const copyTextToClipboard = (text, successMessage = t('')) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showSuccess(successMessage);
      })
      .catch(() => {
        showError(t(''));
      });
  };

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n');
    copyTextToClipboard(codesText, t(''));
  };

  // 
  const BackupCodesDisplay = ({ codes, title, onCopy }) => {
    return (
      <Card className='!rounded-xl' style={{ width: '100%' }}>
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Text strong className='text-slate-700 dark:text-slate-200'>
              {title}
            </Text>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
            {codes.map((code, index) => (
              <div key={index} className='rounded-lg p-3'>
                <div className='flex items-center justify-between'>
                  <Text
                    code
                    className='text-sm font-mono text-slate-700 dark:text-slate-200'
                  >
                    {code}
                  </Text>
                  <Text type='quaternary' className='text-xs'>
                    #{(index + 1).toString().padStart(2, '0')}
                  </Text>
                </div>
              </div>
            ))}
          </div>

          <Divider margin={12} />
          <Button
            type='primary'
            theme='solid'
            icon={<IconCopy />}
            onClick={onCopy}
            className='!rounded-lg !bg-slate-600 hover:!bg-slate-700 w-full'
          >
            {t('')}
          </Button>
        </div>
      </Card>
    );
  };

  // footer
  const renderSetupModalFooter = () => {
    return (
      <>
        {currentStep > 0 && (
          <Button
            onClick={() => setCurrentStep(currentStep - 1)}
            className='!rounded-lg'
          >
            {t('')}
          </Button>
        )}
        {currentStep < 2 ? (
          <Button
            type='primary'
            theme='solid'
            onClick={() => setCurrentStep(currentStep + 1)}
            className='!rounded-lg !bg-slate-600 hover:!bg-slate-700'
          >
            {t('')}
          </Button>
        ) : (
          <Button
            type='primary'
            theme='solid'
            loading={loading}
            onClick={() => {
              if (!verificationCode) {
                showWarning(t(''));
                return;
              }
              handleEnable2FA();
            }}
            className='!rounded-lg !bg-slate-600 hover:!bg-slate-700'
          >
            {t('')}
          </Button>
        )}
      </>
    );
  };

  // footer
  const renderDisableModalFooter = () => {
    return (
      <>
        <Button
          onClick={() => {
            setDisableModalVisible(false);
            setVerificationCode('');
            setConfirmDisable(false);
          }}
          className='!rounded-lg'
        >
          {t('')}
        </Button>
        <Button
          type='danger'
          theme='solid'
          loading={loading}
          disabled={!confirmDisable || !verificationCode}
          onClick={handleDisable2FA}
          className='!rounded-lg !bg-slate-500 hover:!bg-slate-600'
        >
          {t('')}
        </Button>
      </>
    );
  };

  // footer
  const renderRegenerateModalFooter = () => {
    if (backupCodes.length > 0) {
      return (
        <Button
          type='primary'
          theme='solid'
          onClick={() => {
            setBackupModalVisible(false);
            setVerificationCode('');
            setBackupCodes([]);
          }}
          className='!rounded-lg !bg-slate-600 hover:!bg-slate-700'
        >
          {t('')}
        </Button>
      );
    }

    return (
      <>
        <Button
          onClick={() => {
            setBackupModalVisible(false);
            setVerificationCode('');
            setBackupCodes([]);
          }}
          className='!rounded-lg'
        >
          {t('')}
        </Button>
        <Button
          type='primary'
          theme='solid'
          loading={loading}
          disabled={!verificationCode}
          onClick={handleRegenerateBackupCodes}
          className='!rounded-lg !bg-slate-600 hover:!bg-slate-700'
        >
          {t('')}
        </Button>
      </>
    );
  };

  return (
    <>
      <Card className='!rounded-xl w-full'>
        <div className='flex flex-col sm:flex-row items-start sm:justify-between gap-4'>
          <div className='flex items-start w-full sm:w-auto'>
            <div className='w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mr-4 flex-shrink-0'>
              <IconShield
                size='large'
                className='text-slate-600 dark:text-slate-300'
              />
            </div>
            <div className='flex-1'>
              <div className='flex items-center gap-2 mb-1'>
                <Typography.Title heading={6} className='mb-0'>
                  {t('')}
                </Typography.Title>
                {status.enabled ? (
                  <Tag color='green' shape='circle' size='small'>
                    {t('')}
                  </Tag>
                ) : (
                  <Tag color='red' shape='circle' size='small'>
                    {t('')}
                  </Tag>
                )}
                {status.locked && (
                  <Tag color='orange' shape='circle' size='small'>
                    {t('')}
                  </Tag>
                )}
              </div>
              <Typography.Text type='tertiary' className='text-sm'>
                {t(
                  '2FA',
                )}
              </Typography.Text>
              {status.enabled && (
                <div className='mt-2'>
                  <Text size='small' type='secondary'>
                    {t('')}
                    {status.backup_codes_remaining || 0}
                    {t('')}
                  </Text>
                </div>
              )}
            </div>
          </div>
          <div className='flex flex-col space-y-2 w-full sm:w-auto'>
            {!status.enabled ? (
              <Button
                type='primary'
                theme='solid'
                size='default'
                onClick={handleSetup2FA}
                loading={loading}
                className='!rounded-lg !bg-slate-600 hover:!bg-slate-700'
                icon={<IconShield />}
              >
                {t('')}
              </Button>
            ) : (
              <div className='flex flex-col space-y-2'>
                <Button
                  type='danger'
                  theme='solid'
                  size='default'
                  onClick={() => setDisableModalVisible(true)}
                  className='!rounded-lg !bg-slate-500 hover:!bg-slate-600'
                  icon={<IconAlertTriangle />}
                >
                  {t('')}
                </Button>
                <Button
                  type='primary'
                  theme='solid'
                  size='default'
                  onClick={() => setBackupModalVisible(true)}
                  className='!rounded-lg'
                  icon={<IconRefresh />}
                >
                  {t('')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 2FA */}
      <Modal
        title={
          <div className='flex items-center'>
            <IconShield className='mr-2 text-slate-600' />
            {t('')}
          </div>
        }
        visible={setupModalVisible}
        onCancel={() => {
          setSetupModalVisible(false);
          setSetupData(null);
          setCurrentStep(0);
          setVerificationCode('');
        }}
        footer={renderSetupModalFooter()}
        width={650}
        style={{ maxWidth: '90vw' }}
      >
        {setupData && (
          <div className='space-y-6'>
            {/*  */}
            <Steps type='basic' size='small' current={currentStep}>
              <Steps.Step
                title={t('')}
                description={t('')}
              />
              <Steps.Step
                title={t('')}
                description={t('')}
              />
              <Steps.Step
                title={t('')}
                description={t('')}
              />
            </Steps>

            {/*  */}
            <div className='rounded-xl'>
              {currentStep === 0 && (
                <div>
                  <Paragraph className='text-gray-600 dark:text-gray-300 mb-4'>
                    {t(
                      ' Google AuthenticatorMicrosoft Authenticator',
                    )}
                  </Paragraph>
                  <div className='flex justify-center mb-4'>
                    <div className='bg-white p-4 rounded-lg shadow-sm'>
                      <QRCodeSVG value={setupData.qr_code_data} size={180} />
                    </div>
                  </div>
                  <div className='bg-blue-50 dark:bg-blue-900 rounded-lg p-3'>
                    <Text className='text-blue-800 dark:text-blue-200 text-sm'>
                      {t('')}
                      <Text code copyable className='ml-2'>
                        {setupData.secret}
                      </Text>
                    </Text>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className='space-y-4'>
                  {/*  */}
                  <BackupCodesDisplay
                    codes={setupData.backup_codes}
                    title={t('')}
                    onCopy={() => {
                      const codesText = setupData.backup_codes.join('\n');
                      copyTextToClipboard(codesText, t(''));
                    }}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <Input
                  placeholder={t('6')}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  size='large'
                  maxLength={6}
                  className='!rounded-lg'
                />
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 2FA */}
      <Modal
        title={
          <div className='flex items-center'>
            <IconAlertTriangle className='mr-2 text-red-500' />
            {t('')}
          </div>
        }
        visible={disableModalVisible}
        onCancel={() => {
          setDisableModalVisible(false);
          setVerificationCode('');
          setConfirmDisable(false);
        }}
        footer={renderDisableModalFooter()}
        width={550}
        style={{ maxWidth: '90vw' }}
      >
        <div className='space-y-6'>
          {/*  */}
          <div className='rounded-xl'>
            <Banner
              type='warning'
              description={t(
                '',
              )}
              className='!rounded-lg'
            />
          </div>

          {/*  */}
          <div className='space-y-4'>
            <div>
              <Text
                strong
                className='block mb-2 text-slate-700 dark:text-slate-200'
              >
                {t('')}
              </Text>
              <ul className='space-y-2 text-sm text-slate-600 dark:text-slate-300'>
                <li className='flex items-start gap-2'>
                  <Badge dot type='warning' />
                  {t('')}
                </li>
                <li className='flex items-start gap-2'>
                  <Badge dot type='warning' />
                  {t('')}
                </li>
                <li className='flex items-start gap-2'>
                  <Badge dot type='danger' />
                  {t('')}
                </li>
                <li className='flex items-start gap-2'>
                  <Badge dot type='danger' />
                  {t('')}
                </li>
              </ul>
            </div>

            <Divider margin={16} />

            <div className='space-y-4'>
              <div>
                <Text
                  strong
                  className='block mb-2 text-slate-700 dark:text-slate-200'
                >
                  {t('')}
                </Text>
                <Input
                  placeholder={t('')}
                  value={verificationCode}
                  onChange={setVerificationCode}
                  size='large'
                  className='!rounded-lg'
                />
              </div>

              <div>
                <Checkbox
                  checked={confirmDisable}
                  onChange={(e) => setConfirmDisable(e.target.checked)}
                  className='text-sm'
                >
                  {t(
                    '',
                  )}
                </Checkbox>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/*  */}
      <Modal
        title={
          <div className='flex items-center'>
            <IconRefresh className='mr-2 text-slate-600' />
            {t('')}
          </div>
        }
        visible={backupModalVisible}
        onCancel={() => {
          setBackupModalVisible(false);
          setVerificationCode('');
          setBackupCodes([]);
        }}
        footer={renderRegenerateModalFooter()}
        width={500}
        style={{ maxWidth: '90vw' }}
      >
        <div className='space-y-6'>
          {backupCodes.length === 0 ? (
            <>
              {/*  */}
              <div className='rounded-xl'>
                <Banner
                  type='warning'
                  description={t(
                    '',
                  )}
                  className='!rounded-lg'
                />
              </div>

              {/*  */}
              <div className='space-y-4'>
                <div>
                  <Text
                    strong
                    className='block mb-2 text-slate-700 dark:text-slate-200'
                  >
                    {t('')}
                  </Text>
                  <Input
                    placeholder={t('')}
                    value={verificationCode}
                    onChange={setVerificationCode}
                    size='large'
                    className='!rounded-lg'
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              {/*  */}
              <Space vertical style={{ width: '100%' }}>
                <div className='flex items-center justify-center gap-2'>
                  <Badge dot type='success' />
                  <Text
                    strong
                    className='text-lg text-slate-700 dark:text-slate-200'
                  >
                    {t('')}
                  </Text>
                </div>
                <Text className='text-slate-500 dark:text-slate-400 text-sm'>
                  {t('')}
                </Text>

                {/*  */}
                <BackupCodesDisplay
                  codes={backupCodes}
                  title={t('')}
                  onCopy={copyBackupCodes}
                />
              </Space>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default TwoFASetting;

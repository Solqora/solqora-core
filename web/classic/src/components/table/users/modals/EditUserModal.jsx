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

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
  renderQuota,
  getCurrencyConfig,
} from '../../../../helpers';
import {
  quotaToDisplayAmount,
  displayAmountToQuota,
} from '../../../../helpers/quota';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Button,
  Modal,
  SideSheet,
  Space,
  Spin,
  Typography,
  Card,
  Tag,
  Form,
  Avatar,
  Row,
  Col,
  InputNumber,
  RadioGroup,
  Radio,
} from '@douyinfe/semi-ui';
import {
  IconUser,
  IconSave,
  IconClose,
  IconLink,
  IconUserGroup,
  IconEdit,
} from '@douyinfe/semi-icons';
import UserBindingManagementModal from './UserBindingManagementModal';

const { Text, Title } = Typography;

const EditUserModal = (props) => {
  const { t } = useTranslation();
  const userId = props.editingUser.id;
  const [loading, setLoading] = useState(true);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustQuotaLocal, setAdjustQuotaLocal] = useState('');
  const [adjustAmountLocal, setAdjustAmountLocal] = useState('');
  const [adjustMode, setAdjustMode] = useState('add');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const isMobile = useIsMobile();
  const [groupOptions, setGroupOptions] = useState([]);
  const [bindingModalVisible, setBindingModalVisible] = useState(false);
  const formApiRef = useRef(null);
  const [showAdjustQuotaRaw, setShowAdjustQuotaRaw] = useState(false);
  const [showQuotaInput, setShowQuotaInput] = useState(false);
  const [inputs, setInputs] = useState(null);

  const isEdit = Boolean(userId);

  const getInitValues = () => ({
    username: '',
    display_name: '',
    password: '',
    github_id: '',
    oidc_id: '',
    discord_id: '',
    wechat_id: '',
    telegram_id: '',
    linux_do_id: '',
    email: '',
    quota: 0,
    quota_amount: 0,
    group: 'default',
    remark: '',
  });

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      setGroupOptions(res.data.data.map((g) => ({ label: g, value: g })));
    } catch (e) {
      showError(e.message);
    }
  };

  const handleCancel = () => props.handleClose();

  const loadUser = async () => {
    setLoading(true);
    const url = userId ? `/api/user/${userId}` : `/api/user/self`;
    const res = await API.get(url);
    const { success, message, data } = res.data;
    if (success) {
      data.password = '';
      data.quota_amount = Number(
        quotaToDisplayAmount(data.quota || 0).toFixed(6),
      );
      setInputs({ ...getInitValues(), ...data });
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (inputs && formApiRef.current) {
      formApiRef.current.setValues(inputs);
    }
  }, [inputs]);

  useEffect(() => {
    loadUser();
    if (userId) fetchGroups();
    setBindingModalVisible(false);
  }, [props.editingUser.id]);

  const openBindingModal = () => {
    setBindingModalVisible(true);
  };

  const closeBindingModal = () => {
    setBindingModalVisible(false);
  };

  /* ----------------------- submit ----------------------- */
  const submit = async (values) => {
    setLoading(true);
    let payload = { ...values };
    delete payload.quota;
    delete payload.quota_amount;
    if (userId) {
      payload.id = parseInt(userId);
    }
    const url = userId ? `/api/user/` : `/api/user/self`;
    const res = await API.put(url, payload);
    const { success, message } = res.data;
    if (success) {
      showSuccess(t(''));
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
    setLoading(false);
  };

  /* --------------------- atomic quota adjust -------------------- */
  const adjustQuota = async () => {
    const quotaVal = parseInt(adjustQuotaLocal) || 0;
    if (quotaVal <= 0 && adjustMode !== 'override') return;
    if (adjustMode === 'override' && (adjustQuotaLocal === '' || adjustQuotaLocal == null)) return;
    setAdjustLoading(true);
    try {
      const res = await API.post('/api/user/manage', {
        id: parseInt(userId),
        action: 'add_quota',
        mode: adjustMode,
        value: adjustMode === 'override' ? quotaVal : Math.abs(quotaVal),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t(''));
        setAdjustModalOpen(false);
        setAdjustQuotaLocal('');
        setAdjustAmountLocal('');
        const userRes = await API.get(`/api/user/${userId}`);
        if (userRes.data.success) {
          const data = userRes.data.data;
          data.password = '';
          data.quota_amount = Number(
            quotaToDisplayAmount(data.quota || 0).toFixed(6),
          );
          setInputs({ ...getInitValues(), ...data });
        }
        props.refresh();
      } else {
        showError(message);
      }
    } catch (e) {
      showError(e.message);
    }
    setAdjustLoading(false);
  };

  const getPreviewText = () => {
    const current = formApiRef.current?.getValue('quota') || 0;
    const val = parseInt(adjustQuotaLocal) || 0;
    let result;
    switch (adjustMode) {
      case 'add':
        result = current + Math.abs(val);
        return `${t('')}${renderQuota(current)}+${renderQuota(Math.abs(val))} = ${renderQuota(result)}`;
      case 'subtract':
        result = current - Math.abs(val);
        return `${t('')}${renderQuota(current)}-${renderQuota(Math.abs(val))} = ${renderQuota(result)}`;
      case 'override':
        return `${t('')}${renderQuota(current)} → ${renderQuota(val)}`;
      default:
        return '';
    }
  };

  /* --------------------------- UI --------------------------- */
  return (
    <>
      <SideSheet
        placement='right'
        title={
          <Space>
            <Tag color='blue' shape='circle'>
              {t(isEdit ? '' : '')}
            </Tag>
            <Title heading={4} className='m-0'>
              {isEdit ? t('') : t('')}
            </Title>
          </Space>
        }
        bodyStyle={{ padding: 0 }}
        visible={props.visible}
        width={isMobile ? '100%' : 600}
        footer={
          <div className='flex justify-end bg-white'>
            <Space>
              <Button
                theme='solid'
                onClick={() => formApiRef.current?.submitForm()}
                icon={<IconSave />}
                loading={loading}
              >
                {t('')}
              </Button>
              <Button
                theme='light'
                type='primary'
                onClick={handleCancel}
                icon={<IconClose />}
              >
                {t('')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={handleCancel}
      >
        <Spin spinning={loading}>
          <Form
            initValues={getInitValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
          >
            {({ values }) => (
              <div className='p-2 space-y-3'>
                {/*  */}
                <Card className='!rounded-2xl shadow-sm border-0'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconUser size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Input
                        field='username'
                        label={t('')}
                        placeholder={t('')}
                        rules={[{ required: true, message: t('') }]}
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='password'
                        label={t('')}
                        placeholder={t(' 8 ')}
                        mode='password'
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='display_name'
                        label={t('')}
                        placeholder={t('')}
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='remark'
                        label={t('')}
                        placeholder={t('')}
                        showClear
                      />
                    </Col>
                  </Row>
                </Card>

                {/*  */}
                {userId && (
                  <Card className='!rounded-2xl shadow-sm border-0'>
                    <div className='flex items-center mb-2'>
                      <Avatar
                        size='small'
                        color='green'
                        className='mr-2 shadow-md'
                      >
                        <IconUserGroup size={16} />
                      </Avatar>
                      <div>
                        <Text className='text-lg font-medium'>
                          {t('')}
                        </Text>
                        <div className='text-xs text-gray-600'>
                          {t('')}
                        </div>
                      </div>
                    </div>

                    <Row gutter={12}>
                      <Col span={24}>
                        <Form.Select
                          field='group'
                          label={t('')}
                          placeholder={t('')}
                          optionList={groupOptions}
                          allowAdditions
                          search
                          rules={[{ required: true, message: t('') }]}
                        />
                      </Col>

                      <Col span={10}>
                        <Form.InputNumber
                          field='quota_amount'
                          label={t('')}
                          prefix={getCurrencyConfig().symbol}
                          precision={6}
                          step={0.000001}
                          style={{ width: '100%' }}
                          readonly
                        />
                      </Col>

                      <Col span={14}>
                        <Form.Slot label={t('')}>
                          <Button
                            icon={<IconEdit />}
                            onClick={() => setAdjustModalOpen(true)}
                          >
                            {t('')}
                          </Button>
                        </Form.Slot>
                      </Col>

                      <Col span={24}>
                        <div
                          className='text-xs cursor-pointer'
                          style={{ color: 'var(--semi-color-text-2)' }}
                          onClick={() => setShowQuotaInput((v) => !v)}
                        >
                          {showQuotaInput
                            ? `▾ ${t('')}`
                            : `▸ ${t('')}`}
                        </div>
                        <div style={{ display: showQuotaInput ? 'block' : 'none' }} className='mt-2'>
                          <Form.InputNumber
                            field='quota'
                            label={t('')}
                            placeholder={t('')}
                            style={{ width: '100%' }}
                            readonly
                          />
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/*  */}
                {userId && (
                  <Card className='!rounded-2xl shadow-sm border-0'>
                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex items-center min-w-0'>
                        <Avatar
                          size='small'
                          color='purple'
                          className='mr-2 shadow-md'
                        >
                          <IconLink size={16} />
                        </Avatar>
                        <div className='min-w-0'>
                          <Text className='text-lg font-medium'>
                            {t('')}
                          </Text>
                          <div className='text-xs text-gray-600'>
                            {t('')}
                          </div>
                        </div>
                      </div>
                      <Button
                        type='primary'
                        theme='outline'
                        onClick={openBindingModal}
                      >
                        {t('')}
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </Form>
        </Spin>
      </SideSheet>

      <UserBindingManagementModal
        visible={bindingModalVisible}
        onCancel={closeBindingModal}
        userId={userId}
        isMobile={isMobile}
        formApiRef={formApiRef}
      />

      {/*  */}
      <Modal
        centered
        visible={adjustModalOpen}
        onOk={adjustQuota}
        onCancel={() => {
          setAdjustModalOpen(false);
          setAdjustQuotaLocal('');
          setAdjustAmountLocal('');
          setAdjustMode('add');
        }}
        confirmLoading={adjustLoading}
        closable={null}
        title={
          <div className='flex items-center'>
            <IconEdit className='mr-2' />
            {t('')}
          </div>
        }
      >
        <div className='mb-4'>
          <Text type='secondary' className='block mb-2'>
            {getPreviewText()}
          </Text>
        </div>
        <div className='mb-3'>
          <div className='mb-1'>
            <Text size='small'>{t('')}</Text>
          </div>
          <RadioGroup
            type='button'
            value={adjustMode}
            onChange={(e) => {
              setAdjustMode(e.target.value);
              setAdjustQuotaLocal('');
              setAdjustAmountLocal('');
            }}
            style={{ width: '100%' }}
          >
            <Radio value='add'>{t('')}</Radio>
            <Radio value='subtract'>{t('')}</Radio>
            <Radio value='override'>{t('')}</Radio>
          </RadioGroup>
        </div>
        <div className='mb-3'>
          <div className='mb-1'>
            <Text size='small'>{t('')}</Text>
          </div>
          <InputNumber
            prefix={getCurrencyConfig().symbol}
            placeholder={t('')}
            value={adjustAmountLocal}
            precision={6}
            min={adjustMode === 'override' ? undefined : 0}
            step={0.000001}
            onChange={(val) => {
              const amount = val === '' || val == null ? '' : val;
              setAdjustAmountLocal(amount);
              setAdjustQuotaLocal(
                amount === ''
                  ? ''
                  : adjustMode === 'override'
                    ? displayAmountToQuota(amount)
                    : displayAmountToQuota(Math.abs(amount)),
              );
            }}
            style={{ width: '100%' }}
            showClear
          />
        </div>
        <div
          className='text-xs cursor-pointer mt-2'
          style={{ color: 'var(--semi-color-text-2)' }}
          onClick={() => setShowAdjustQuotaRaw((v) => !v)}
        >
          {showAdjustQuotaRaw
            ? `▾ ${t('')}`
            : `▸ ${t('')}`}
        </div>
        <div style={{ display: showAdjustQuotaRaw ? 'block' : 'none' }} className='mt-2'>
          <div className='mb-1'>
            <Text size='small'>{t('')}</Text>
          </div>
          <InputNumber
            placeholder={t('')}
            value={adjustQuotaLocal}
            min={adjustMode === 'override' ? undefined : 0}
            onChange={(val) => {
              const quota = val === '' || val == null ? '' : val;
              setAdjustQuotaLocal(quota);
              setAdjustAmountLocal(
                quota === ''
                  ? ''
                  : adjustMode === 'override'
                    ? Number(quotaToDisplayAmount(quota).toFixed(6))
                    : Number(quotaToDisplayAmount(Math.abs(quota)).toFixed(6)),
              );
            }}
            style={{ width: '100%' }}
            showClear
            step={500000}
          />
        </div>
      </Modal>
    </>
  );
};

export default EditUserModal;

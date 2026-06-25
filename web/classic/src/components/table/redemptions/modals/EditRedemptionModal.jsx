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
  downloadTextAsFile,
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
} from '@douyinfe/semi-ui';
import {
  IconCreditCard,
  IconSave,
  IconClose,
  IconGift,
} from '@douyinfe/semi-icons';

const { Text, Title } = Typography;

const EditRedemptionModal = (props) => {
  const { t } = useTranslation();
  const isEdit = props.editingRedemption.id !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const [showQuotaInput, setShowQuotaInput] = useState(false);

  const getInitValues = () => ({
    name: '',
    quota: 100000,
    amount: Number(quotaToDisplayAmount(100000).toFixed(6)),
    count: 1,
    expired_time: null,
  });

  const handleCancel = () => {
    props.handleClose();
  };

  const loadRedemption = async () => {
    setLoading(true);
    let res = await API.get(`/api/redemption/${props.editingRedemption.id}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.expired_time === 0) {
        data.expired_time = null;
      } else {
        data.expired_time = new Date(data.expired_time * 1000);
      }
      data.amount = Number(quotaToDisplayAmount(data.quota || 0).toFixed(6));
      formApiRef.current?.setValues({ ...getInitValues(), ...data });
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formApiRef.current) {
      if (isEdit) {
        loadRedemption();
      } else {
        formApiRef.current.setValues(getInitValues());
      }
    }
  }, [props.editingRedemption.id]);

  const submit = async (values) => {
    let name = values.name;
    if (!isEdit && (!name || name === '')) {
      name = renderQuota(values.quota);
    }
    setLoading(true);
    let localInputs = { ...values };
    localInputs.count = parseInt(localInputs.count) || 0;
    localInputs.quota = displayAmountToQuota(localInputs.amount);
    if (localInputs.quota <= 0) {
      showError(t(''));
      setLoading(false);
      return;
    }
    localInputs.name = name;
    if (!localInputs.expired_time) {
      localInputs.expired_time = 0;
    } else {
      localInputs.expired_time = Math.floor(
        localInputs.expired_time.getTime() / 1000,
      );
    }
    let res;
    if (isEdit) {
      res = await API.put(`/api/redemption/`, {
        ...localInputs,
        id: parseInt(props.editingRedemption.id),
      });
    } else {
      res = await API.post(`/api/redemption/`, {
        ...localInputs,
      });
    }
    const { success, message, data } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t(''));
        props.refresh();
        props.handleClose();
      } else {
        showSuccess(t(''));
        props.refresh();
        formApiRef.current?.setValues(getInitValues());
        props.handleClose();
      }
    } else {
      showError(message);
    }
    if (!isEdit && data) {
      let text = '';
      for (let i = 0; i < data.length; i++) {
        text += data[i] + '\n';
      }
      Modal.confirm({
        title: t(''),
        content: (
          <div>
            <p>{t('')}</p>
            <p>{t('')}</p>
          </div>
        ),
        onOk: () => {
          downloadTextAsFile(text, `${localInputs.name}.txt`);
        },
      });
    }
    setLoading(false);
  };

  return (
    <>
      <SideSheet
        placement={isEdit ? 'right' : 'left'}
        title={
          <Space>
            {isEdit ? (
              <Tag color='blue' shape='circle'>
                {t('')}
              </Tag>
            ) : (
              <Tag color='green' shape='circle'>
                {t('')}
              </Tag>
            )}
            <Title heading={4} className='m-0'>
              {isEdit ? t('') : t('')}
            </Title>
          </Space>
        }
        bodyStyle={{ padding: '0' }}
        visible={props.visiable}
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
        onCancel={() => handleCancel()}
      >
        <Spin spinning={loading}>
          <Form
            initValues={getInitValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
          >
            {({ values }) => (
              <div className='p-2'>
                <Card className='!rounded-2xl shadow-sm border-0 mb-6'>
                  {/* Header: Basic Info */}
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconGift size={16} />
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
                        field='name'
                        label={t('')}
                        placeholder={t('')}
                        style={{ width: '100%' }}
                        rules={
                          !isEdit
                            ? []
                            : [{ required: true, message: t('') }]
                        }
                        showClear
                      />
                    </Col>
                    <Col span={24}>
                      <Form.DatePicker
                        field='expired_time'
                        label={t('')}
                        type='dateTime'
                        placeholder={t('')}
                        style={{ width: '100%' }}
                        showClear
                      />
                    </Col>
                  </Row>
                </Card>

                <Card className='!rounded-2xl shadow-sm border-0'>
                  {/* Header: Quota Settings */}
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='green'
                      className='mr-2 shadow-md'
                    >
                      <IconCreditCard size={16} />
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
                      <Form.InputNumber
                        field='amount'
                        label={t('')}
                        prefix={getCurrencyConfig().symbol}
                        placeholder={t('')}
                        precision={6}
                        min={0}
                        step={0.000001}
                        style={{ width: '100%' }}
                        onChange={(val) => {
                          const amount = val === '' || val == null ? 0 : val;
                          formApiRef.current?.setValue('amount', amount);
                          formApiRef.current?.setValue(
                            'quota',
                            displayAmountToQuota(amount),
                          );
                        }}
                        showClear
                      />
                      <div
                        className='text-xs cursor-pointer mt-1'
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
                          rules={[
                            { required: true, message: t('') },
                            {
                              validator: (rule, v) => {
                                const num = parseInt(v, 10);
                                return num > 0
                                  ? Promise.resolve()
                                  : Promise.reject(t('0'));
                              },
                            },
                          ]}
                          onChange={(val) => {
                            const quota = val === '' || val == null ? 0 : val;
                            formApiRef.current?.setValue('quota', quota);
                            formApiRef.current?.setValue(
                              'amount',
                              Number(quotaToDisplayAmount(quota).toFixed(6)),
                            );
                          }}
                          style={{ width: '100%' }}
                          showClear
                        />
                      </div>
                    </Col>
                    {!isEdit && (
                      <Col span={12}>
                        <Form.InputNumber
                          field='count'
                          label={t('')}
                          min={1}
                          rules={[
                            { required: true, message: t('') },
                            {
                              validator: (rule, v) => {
                                const num = parseInt(v, 10);
                                return num > 0
                                  ? Promise.resolve()
                                  : Promise.reject(t('0'));
                              },
                            },
                          ]}
                          style={{ width: '100%' }}
                          showClear
                        />
                      </Col>
                    )}
                  </Row>
                </Card>
              </div>
            )}
          </Form>
        </Spin>
      </SideSheet>
    </>
  );
};

export default EditRedemptionModal;

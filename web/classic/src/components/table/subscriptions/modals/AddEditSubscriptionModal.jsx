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
import {
  Avatar,
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  SideSheet,
  Space,
  Spin,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconCalendarClock,
  IconClose,
  IconCreditCard,
  IconSave,
} from '@douyinfe/semi-icons';
import { Clock, RefreshCw } from 'lucide-react';
import { API, showError, showSuccess } from '../../../../helpers';
import {
  quotaToDisplayAmount,
  displayAmountToQuota,
} from '../../../../helpers/quota';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';

const { Text, Title } = Typography;

const durationUnitOptions = [
  { value: 'year', label: '' },
  { value: 'month', label: '' },
  { value: 'day', label: '' },
  { value: 'hour', label: '' },
  { value: 'custom', label: '()' },
];

const resetPeriodOptions = [
  { value: 'never', label: '' },
  { value: 'daily', label: '' },
  { value: 'weekly', label: '' },
  { value: 'monthly', label: '' },
  { value: 'custom', label: '()' },
];

const AddEditSubscriptionModal = ({
  visible,
  handleClose,
  editingPlan,
  placement = 'left',
  refresh,
  t,
}) => {
  const [loading, setLoading] = useState(false);
  const [groupOptions, setGroupOptions] = useState([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const isEdit = editingPlan?.plan?.id !== undefined;
  const formKey = isEdit ? `edit-${editingPlan?.plan?.id}` : 'create';

  const getInitValues = () => ({
    title: '',
    subtitle: '',
    price_amount: 0,
    currency: 'USD',
    duration_unit: 'month',
    duration_value: 1,
    custom_seconds: 0,
    quota_reset_period: 'never',
    quota_reset_custom_seconds: 0,
    enabled: true,
    sort_order: 0,
    max_purchase_per_user: 0,
    total_amount: 0,
    upgrade_group: '',
    stripe_price_id: '',
    creem_product_id: '',
  });

  const buildFormValues = () => {
    const base = getInitValues();
    if (editingPlan?.plan?.id === undefined) return base;
    const p = editingPlan.plan || {};
    return {
      ...base,
      title: p.title || '',
      subtitle: p.subtitle || '',
      price_amount: Number(p.price_amount || 0),
      currency: 'USD',
      duration_unit: p.duration_unit || 'month',
      duration_value: Number(p.duration_value || 1),
      custom_seconds: Number(p.custom_seconds || 0),
      quota_reset_period: p.quota_reset_period || 'never',
      quota_reset_custom_seconds: Number(p.quota_reset_custom_seconds || 0),
      enabled: p.enabled !== false,
      sort_order: Number(p.sort_order || 0),
      max_purchase_per_user: Number(p.max_purchase_per_user || 0),
      total_amount: Number(
        quotaToDisplayAmount(p.total_amount || 0).toFixed(2),
      ),
      upgrade_group: p.upgrade_group || '',
      stripe_price_id: p.stripe_price_id || '',
      creem_product_id: p.creem_product_id || '',
    };
  };

  useEffect(() => {
    if (!visible) return;
    setGroupLoading(true);
    API.get('/api/group')
      .then((res) => {
        if (res.data?.success) {
          setGroupOptions(res.data?.data || []);
        } else {
          setGroupOptions([]);
        }
      })
      .catch(() => setGroupOptions([]))
      .finally(() => setGroupLoading(false));
  }, [visible]);

  const submit = async (values) => {
    if (!values.title || values.title.trim() === '') {
      showError(t(''));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        plan: {
          ...values,
          price_amount: Number(values.price_amount || 0),
          currency: 'USD',
          duration_value: Number(values.duration_value || 0),
          custom_seconds: Number(values.custom_seconds || 0),
          quota_reset_period: values.quota_reset_period || 'never',
          quota_reset_custom_seconds:
            values.quota_reset_period === 'custom'
              ? Number(values.quota_reset_custom_seconds || 0)
              : 0,
          sort_order: Number(values.sort_order || 0),
          max_purchase_per_user: Number(values.max_purchase_per_user || 0),
          total_amount: displayAmountToQuota(values.total_amount),
          upgrade_group: values.upgrade_group || '',
        },
      };
      if (editingPlan?.plan?.id) {
        const res = await API.put(
          `/api/subscription/admin/plans/${editingPlan.plan.id}`,
          payload,
        );
        if (res.data?.success) {
          showSuccess(t(''));
          handleClose();
          refresh?.();
        } else {
          showError(res.data?.message || t(''));
        }
      } else {
        const res = await API.post('/api/subscription/admin/plans', payload);
        if (res.data?.success) {
          showSuccess(t(''));
          handleClose();
          refresh?.();
        } else {
          showError(res.data?.message || t(''));
        }
      }
    } catch (e) {
      showError(t(''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SideSheet
        placement={placement}
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
        visible={visible}
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
                onClick={handleClose}
                icon={<IconClose />}
              >
                {t('')}
              </Button>
            </Space>
          </div>
        }
        closeIcon={null}
        onCancel={handleClose}
      >
        <Spin spinning={loading}>
          <Form
            key={formKey}
            initValues={buildFormValues()}
            getFormApi={(api) => (formApiRef.current = api)}
            onSubmit={submit}
          >
            {({ values }) => (
              <div className='p-2'>
                {/*  */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconCalendarClock size={16} />
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
                        field='title'
                        label={t('')}
                        placeholder={t('')}
                        required
                        rules={[
                          { required: true, message: t('') },
                        ]}
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='subtitle'
                        label={t('')}
                        placeholder={t('')}
                        showClear
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='price_amount'
                        label={t('')}
                        required
                        min={0}
                        precision={2}
                        rules={[{ required: true, message: t('') }]}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='total_amount'
                        label={t('')}
                        required
                        min={0}
                        precision={2}
                        rules={[{ required: true, message: t('') }]}
                        extraText={`${t('0 ')} · ${t('')}${displayAmountToQuota(
                          values.total_amount,
                        )}`}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.Select
                        field='upgrade_group'
                        label={t('')}
                        showClear
                        loading={groupLoading}
                        placeholder={t('')}
                        extraText={t(
                          '//',
                        )}
                      >
                        <Select.Option value=''>{t('')}</Select.Option>
                        {(groupOptions || []).map((g) => (
                          <Select.Option key={g} value={g}>
                            {g}
                          </Select.Option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col span={12}>
                      <Form.Input
                        field='currency'
                        label={t('')}
                        disabled
                        extraText={t('')}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='sort_order'
                        label={t('')}
                        precision={0}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.InputNumber
                        field='max_purchase_per_user'
                        label={t('')}
                        min={0}
                        precision={0}
                        extraText={t('0 ')}
                        style={{ width: '100%' }}
                      />
                    </Col>

                    <Col span={12}>
                      <Form.Switch
                        field='enabled'
                        label={t('')}
                        size='large'
                      />
                    </Col>
                  </Row>
                </Card>

                {/*  */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='green'
                      className='mr-2 shadow-md'
                    >
                      <Clock size={16} />
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
                    <Col span={12}>
                      <Form.Select
                        field='duration_unit'
                        label={t('')}
                        required
                        rules={[{ required: true }]}
                      >
                        {durationUnitOptions.map((o) => (
                          <Select.Option key={o.value} value={o.value}>
                            {o.label}
                          </Select.Option>
                        ))}
                      </Form.Select>
                    </Col>

                    <Col span={12}>
                      {values.duration_unit === 'custom' ? (
                        <Form.InputNumber
                          field='custom_seconds'
                          label={t('')}
                          required
                          min={1}
                          precision={0}
                          rules={[{ required: true, message: t('') }]}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <Form.InputNumber
                          field='duration_value'
                          label={t('')}
                          required
                          min={1}
                          precision={0}
                          rules={[{ required: true, message: t('') }]}
                          style={{ width: '100%' }}
                        />
                      )}
                    </Col>
                  </Row>
                </Card>

                {/*  */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='orange'
                      className='mr-2 shadow-md'
                    >
                      <RefreshCw size={16} />
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
                    <Col span={12}>
                      <Form.Select
                        field='quota_reset_period'
                        label={t('')}
                      >
                        {resetPeriodOptions.map((o) => (
                          <Select.Option key={o.value} value={o.value}>
                            {o.label}
                          </Select.Option>
                        ))}
                      </Form.Select>
                    </Col>
                    <Col span={12}>
                      {values.quota_reset_period === 'custom' ? (
                        <Form.InputNumber
                          field='quota_reset_custom_seconds'
                          label={t('')}
                          required
                          min={60}
                          precision={0}
                          rules={[{ required: true, message: t('') }]}
                          style={{ width: '100%' }}
                        />
                      ) : (
                        <Form.InputNumber
                          field='quota_reset_custom_seconds'
                          label={t('')}
                          min={0}
                          precision={0}
                          style={{ width: '100%' }}
                          disabled
                        />
                      )}
                    </Col>
                  </Row>
                </Card>

                {/*  */}
                <Card className='!rounded-2xl shadow-sm border-0 mb-4'>
                  <div className='flex items-center mb-2'>
                    <Avatar
                      size='small'
                      color='purple'
                      className='mr-2 shadow-md'
                    >
                      <IconCreditCard size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('Stripe/Creem ID')}
                      </div>
                    </div>
                  </div>

                  <Row gutter={12}>
                    <Col span={24}>
                      <Form.Input
                        field='stripe_price_id'
                        label='Stripe PriceId'
                        placeholder='price_...'
                        showClear
                      />
                    </Col>

                    <Col span={24}>
                      <Form.Input
                        field='creem_product_id'
                        label='Creem ProductId'
                        placeholder='prod_...'
                        showClear
                      />
                    </Col>
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

export default AddEditSubscriptionModal;

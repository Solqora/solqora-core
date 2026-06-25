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
  Banner,
  Button,
  Form,
  Row,
  Col,
  Typography,
  Spin,
  Table,
  Modal,
  Input,
  Space,
} from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen, TriangleAlert } from 'lucide-react';

const { Text } = Typography;
const toBoolean = (value) => value === true || value === 'true';

export default function SettingsPaymentGatewayWaffo(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('Waffo ');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    WaffoEnabled: false,
    WaffoApiKey: '',
    WaffoPrivateKey: '',
    WaffoPublicCert: '',
    WaffoSandboxPublicCert: '',
    WaffoSandboxApiKey: '',
    WaffoSandboxPrivateKey: '',
    WaffoSandbox: false,
    WaffoMerchantId: '',
    WaffoCurrency: 'USD',
    WaffoUnitPrice: 1.0,
    WaffoMinTopUp: 1,
    WaffoNotifyUrl: '',
    WaffoReturnUrl: '',
  });
  const formApiRef = useRef(null);
  const iconFileInputRef = useRef(null);

  const handleIconFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const MAX_ICON_SIZE = 100 * 1024; // 100 KB
    if (file.size > MAX_ICON_SIZE) {
      showError(t(' 100KB'));
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPayMethodForm((prev) => ({ ...prev, icon: event.target.result }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 
  const [waffoPayMethods, setWaffoPayMethods] = useState([]);
  // 
  const [payMethodModalVisible, setPayMethodModalVisible] = useState(false);
  // -1 
  const [editingPayMethodIndex, setEditingPayMethodIndex] = useState(-1);
  // 
  const [payMethodForm, setPayMethodForm] = useState({
    name: '',
    icon: '',
    payMethodType: '',
    payMethodName: '',
  });

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        WaffoEnabled: toBoolean(props.options.WaffoEnabled),
        WaffoApiKey: props.options.WaffoApiKey || '',
        WaffoPrivateKey: props.options.WaffoPrivateKey || '',
        WaffoPublicCert: props.options.WaffoPublicCert || '',
        WaffoSandboxPublicCert: props.options.WaffoSandboxPublicCert || '',
        WaffoSandboxApiKey: props.options.WaffoSandboxApiKey || '',
        WaffoSandboxPrivateKey: props.options.WaffoSandboxPrivateKey || '',
        WaffoSandbox: toBoolean(props.options.WaffoSandbox),
        WaffoMerchantId: props.options.WaffoMerchantId || '',
        WaffoCurrency: props.options.WaffoCurrency || 'USD',
        WaffoUnitPrice: parseFloat(props.options.WaffoUnitPrice) || 1.0,
        WaffoMinTopUp: parseInt(props.options.WaffoMinTopUp) || 1,
        WaffoNotifyUrl: props.options.WaffoNotifyUrl || '',
        WaffoReturnUrl: props.options.WaffoReturnUrl || '',
      };
      setInputs(currentInputs);
      formApiRef.current.setValues(currentInputs);

      // 
      try {
        const rawPayMethods = props.options.WaffoPayMethods;
        if (rawPayMethods) {
          const parsed = JSON.parse(rawPayMethods);
          if (Array.isArray(parsed)) {
            setWaffoPayMethods(parsed);
          }
        }
      } catch {
        setWaffoPayMethods([]);
      }
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitWaffoSetting = async () => {
    setLoading(true);
    try {
      const options = [];

      options.push({
        key: 'WaffoEnabled',
        value: inputs.WaffoEnabled ? 'true' : 'false',
      });

      if (inputs.WaffoApiKey && inputs.WaffoApiKey !== '') {
        options.push({ key: 'WaffoApiKey', value: inputs.WaffoApiKey });
      }

      if (inputs.WaffoPrivateKey && inputs.WaffoPrivateKey !== '') {
        options.push({ key: 'WaffoPrivateKey', value: inputs.WaffoPrivateKey });
      }

      options.push({
        key: 'WaffoPublicCert',
        value: inputs.WaffoPublicCert || '',
      });
      options.push({
        key: 'WaffoSandboxPublicCert',
        value: inputs.WaffoSandboxPublicCert || '',
      });

      if (inputs.WaffoSandboxApiKey && inputs.WaffoSandboxApiKey !== '') {
        options.push({
          key: 'WaffoSandboxApiKey',
          value: inputs.WaffoSandboxApiKey,
        });
      }

      if (
        inputs.WaffoSandboxPrivateKey &&
        inputs.WaffoSandboxPrivateKey !== ''
      ) {
        options.push({
          key: 'WaffoSandboxPrivateKey',
          value: inputs.WaffoSandboxPrivateKey,
        });
      }

      options.push({
        key: 'WaffoSandbox',
        value: inputs.WaffoSandbox ? 'true' : 'false',
      });

      options.push({
        key: 'WaffoMerchantId',
        value: inputs.WaffoMerchantId || '',
      });
      options.push({ key: 'WaffoCurrency', value: inputs.WaffoCurrency || '' });

      options.push({
        key: 'WaffoUnitPrice',
        value: String(inputs.WaffoUnitPrice || 1.0),
      });

      options.push({
        key: 'WaffoMinTopUp',
        value: String(inputs.WaffoMinTopUp || 1),
      });

      options.push({
        key: 'WaffoNotifyUrl',
        value: inputs.WaffoNotifyUrl || '',
      });
      options.push({
        key: 'WaffoReturnUrl',
        value: inputs.WaffoReturnUrl || '',
      });

      // 
      options.push({
        key: 'WaffoPayMethods',
        value: JSON.stringify(waffoPayMethods),
      });

      // 
      const requestQueue = options.map((opt) =>
        API.put('/api/option/', {
          key: opt.key,
          value: opt.value,
        }),
      );

      const results = await Promise.all(requestQueue);

      // 
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => {
          showError(res.data.message);
        });
      } else {
        showSuccess(t(''));
        props.refresh?.();
      }
    } catch (error) {
      showError(t(''));
    }
    setLoading(false);
  };

  // 
  const openAddPayMethodModal = () => {
    setEditingPayMethodIndex(-1);
    setPayMethodForm({
      name: '',
      icon: '',
      payMethodType: '',
      payMethodName: '',
    });
    setPayMethodModalVisible(true);
  };

  // 
  const openEditPayMethodModal = (record, index) => {
    setEditingPayMethodIndex(index);
    setPayMethodForm({
      name: record.name || '',
      icon: record.icon || '',
      payMethodType: record.payMethodType || '',
      payMethodName: record.payMethodName || '',
    });
    setPayMethodModalVisible(true);
  };

  // 
  const handlePayMethodModalOk = () => {
    if (!payMethodForm.name || payMethodForm.name.trim() === '') {
      showError(t(''));
      return;
    }
    const newMethod = {
      name: payMethodForm.name.trim(),
      icon: payMethodForm.icon.trim(),
      payMethodType: payMethodForm.payMethodType.trim(),
      payMethodName: payMethodForm.payMethodName.trim(),
    };
    if (editingPayMethodIndex === -1) {
      // 
      setWaffoPayMethods([...waffoPayMethods, newMethod]);
    } else {
      // 
      const updated = [...waffoPayMethods];
      updated[editingPayMethodIndex] = newMethod;
      setWaffoPayMethods(updated);
    }
    setPayMethodModalVisible(false);
  };

  // 
  const handleDeletePayMethod = (index) => {
    const updated = waffoPayMethods.filter((_, i) => i !== index);
    setWaffoPayMethods(updated);
  };

  // 
  const payMethodColumns = [
    {
      title: t(''),
      dataIndex: 'name',
    },
    {
      title: t(''),
      dataIndex: 'icon',
      render: (text) =>
        text ? (
          <img
            src={text}
            alt='icon'
            style={{ width: 24, height: 24, objectFit: 'contain' }}
          />
        ) : (
          <Text type='tertiary'>—</Text>
        ),
    },
    {
      title: t(''),
      dataIndex: 'payMethodType',
      render: (text) => text || <Text type='tertiary'>—</Text>,
    },
    {
      title: t(''),
      dataIndex: 'payMethodName',
      render: (text) => text || <Text type='tertiary'>—</Text>,
    },
    {
      title: t(''),
      key: 'action',
      render: (_, record, index) => (
        <Space>
          <Button
            size='small'
            onClick={() => openEditPayMethodModal(record, index)}
          >
            {t('')}
          </Button>
          <Button
            size='small'
            type='danger'
            onClick={() => handleDeletePayMethod(index)}
          >
            {t('')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={
              <>
                Waffo 
                <a href='https://waffo.com' target='_blank' rel='noreferrer'>
                  
                </a>
                
                <br />
                {t('')}
                {props.options.ServerAddress
                  ? removeTrailingSlash(props.options.ServerAddress)
                  : t('')}
                /api/waffo/webhook
              </>
            }
            style={{ marginBottom: 12 }}
          />
          <Banner
            type='warning'
            icon={<TriangleAlert size={16} />}
            description={t('')}
            style={{ marginBottom: 16 }}
          />

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='WaffoEnabled'
                label={t(' Waffo')}
                size='default'
                checkedText=''
                uncheckedText=''
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='WaffoSandbox'
                label={t('')}
                size='default'
                checkedText=''
                uncheckedText=''
                extraText={t('')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WaffoMerchantId'
                label={t(' ID')}
                placeholder={t('MER_xxx')}
                extraText={t(' ID')}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WaffoApiKey'
                label={t('API ')}
                placeholder={t(
                  ' API ',
                )}
                extraText={t(' API ')}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.TextArea
                field='WaffoPrivateKey'
                label={t('API ')}
                placeholder={t(
                  '',
                )}
                extraText={t(' API ')}
                type='password'
                autosize={{ minRows: 3, maxRows: 6 }}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.TextArea
                field='WaffoPublicCert'
                label={t('Waffo ')}
                placeholder={t(
                  ' Waffo Base64  PEM ',
                )}
                extraText={t(' Waffo ')}
                type='password'
                autosize={{ minRows: 3, maxRows: 6 }}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WaffoSandboxApiKey'
                label={t('API ')}
                placeholder={t(
                  ' API ',
                )}
                extraText={t(' API ')}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.TextArea
                field='WaffoSandboxPrivateKey'
                label={t('API ')}
                placeholder={t(
                  '',
                )}
                extraText={t(' API ')}
                type='password'
                autosize={{ minRows: 3, maxRows: 6 }}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.TextArea
                field='WaffoSandboxPublicCert'
                label={t('Waffo ')}
                placeholder={t(
                  ' Waffo Base64  PEM ',
                )}
                extraText={t(' Waffo ')}
                type='password'
                autosize={{ minRows: 3, maxRows: 6 }}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='WaffoCurrency'
                label={t('')}
                placeholder='USD'
                extraText={t('Waffo  USD ')}
                disabled
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='WaffoUnitPrice'
                precision={2}
                label={t('x/')}
                placeholder={t('77/')}
                extraText={t(' 1 ')}
                min={0}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='WaffoMinTopUp'
                label={t('')}
                placeholder={t('22$')}
                extraText={t('')}
                min={1}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoNotifyUrl'
                label={t('')}
                placeholder={t('https://example.com/api/waffo/webhook')}
                extraText={t('')}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoReturnUrl'
                label={t('')}
                placeholder={t('https://example.com/console/topup')}
                extraText={t('')}
              />
            </Col>
          </Row>
        </Form.Section>

        <Form.Section text={t('')}>
          <Text type='secondary'>
            {t(
              ' Waffo  CardApple PayGoogle Pay ',
            )}
          </Text>
          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <Button onClick={openAddPayMethodModal}>{t('')}</Button>
          </div>
          <Table
            columns={payMethodColumns}
            dataSource={waffoPayMethods}
            rowKey={(record, index) => index}
            pagination={false}
            size='small'
            empty={
              <Text type='tertiary'>{t('')}</Text>
            }
          />
          <Button onClick={submitWaffoSetting} style={{ marginTop: 16 }}>
            {t(' Waffo ')}
          </Button>
        </Form.Section>
      </Form>

      {/* / */}
      <Modal
        title={
          editingPayMethodIndex === -1 ? t('') : t('')
        }
        visible={payMethodModalVisible}
        onOk={handlePayMethodModalOk}
        onCancel={() => setPayMethodModalVisible(false)}
        okText={t('')}
        cancelText={t('')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('')}</Text>
              <span
                style={{ color: 'var(--semi-color-danger)', marginLeft: 4 }}
              >
                *
              </span>
            </div>
            <Input
              value={payMethodForm.name}
              onChange={(val) =>
                setPayMethodForm({ ...payMethodForm, name: val })
              }
              placeholder={t('Credit Card')}
            />
            <Text type='tertiary' size='small'>
              {t('Credit Card')}
            </Text>
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('')}</Text>
            </div>
            <Space align='center'>
              {payMethodForm.icon && (
                <img
                  src={payMethodForm.icon}
                  alt='preview'
                  style={{
                    width: 32,
                    height: 32,
                    objectFit: 'contain',
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: 4,
                  }}
                />
              )}
              <input
                type='file'
                accept='image/*'
                ref={iconFileInputRef}
                style={{ display: 'none' }}
                onChange={handleIconFileChange}
              />
              <Button
                size='small'
                onClick={() => iconFileInputRef.current?.click()}
              >
                {payMethodForm.icon ? t('') : t('')}
              </Button>
              {payMethodForm.icon && (
                <Button
                  size='small'
                  type='danger'
                  onClick={() =>
                    setPayMethodForm((prev) => ({ ...prev, icon: '' }))
                  }
                >
                  {t('')}
                </Button>
              )}
            </Space>
            <div>
              <Text type='tertiary' size='small'>
                {t(' PNG/JPG/SVG  ≤ 128×128px')}
              </Text>
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('')}</Text>
            </div>
            <Input
              value={payMethodForm.payMethodType}
              onChange={(val) =>
                setPayMethodForm({ ...payMethodForm, payMethodType: val })
              }
              placeholder='CREDITCARD,DEBITCARD'
              maxLength={64}
            />
            <Text type='tertiary' size='small'>
              {t(
                'Waffo API CREDITCARD,DEBITCARD64',
              )}
            </Text>
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>
              <Text strong>{t('')}</Text>
            </div>
            <Input
              value={payMethodForm.payMethodName}
              onChange={(val) =>
                setPayMethodForm({ ...payMethodForm, payMethodName: val })
              }
              placeholder={t('')}
              maxLength={64}
            />
            <Text type='tertiary' size='small'>
              {t('Waffo API 64')}
            </Text>
          </div>
        </div>
      </Modal>
    </Spin>
  );
}

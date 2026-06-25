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

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Banner,
  Button,
  Col,
  Form,
  Row,
  Spin,
  Modal,
  Input,
  Typography,
} from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export default function GeneralSettings(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);
  const [inputs, setInputs] = useState({
    TopUpLink: '',
    'general_setting.docs_link': '',
    'general_setting.quota_display_type': 'USD',
    'general_setting.custom_currency_symbol': '¤',
    'general_setting.custom_currency_exchange_rate': '',
    QuotaPerUnit: '',
    RetryTimes: '',
    USDExchangeRate: '',
    DisplayTokenStatEnabled: false,
    DefaultCollapseSidebar: false,
    DemoSiteEnabled: false,
    SelfUseModeEnabled: false,
    'token_setting.max_user_tokens': 1000,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  function handleFieldChange(fieldName) {
    return (value) => {
      setInputs((inputs) => ({ ...inputs, [fieldName]: value }));
    };
  }

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t(''));
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = inputs[item.key];
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t(''));
        }
        showSuccess(t(''));
        props.refresh();
      })
      .catch(() => {
        showError(t(''));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  // “1 USD = X <currency>” X
  const combinedRate = useMemo(() => {
    const type = inputs['general_setting.quota_display_type'];
    if (type === 'USD') return '1';
    if (type === 'CNY') return String(inputs['USDExchangeRate'] || '');
    if (type === 'TOKENS') return String(inputs['QuotaPerUnit'] || '');
    if (type === 'CUSTOM')
      return String(
        inputs['general_setting.custom_currency_exchange_rate'] || '',
      );
    return '';
  }, [inputs]);

  const onCombinedRateChange = (val) => {
    const type = inputs['general_setting.quota_display_type'];
    if (type === 'CNY') {
      handleFieldChange('USDExchangeRate')(val);
    } else if (type === 'TOKENS') {
      handleFieldChange('QuotaPerUnit')(val);
    } else if (type === 'CUSTOM') {
      handleFieldChange('general_setting.custom_currency_exchange_rate')(val);
    }
  };

  const showTokensOption = useMemo(() => {
    const initialType = props.options?.['general_setting.quota_display_type'];
    const initialQuotaPerUnit = parseFloat(props.options?.QuotaPerUnit);
    const legacyTokensMode =
      initialType === undefined &&
      props.options?.DisplayInCurrencyEnabled !== undefined &&
      !props.options.DisplayInCurrencyEnabled;
    return (
      initialType === 'TOKENS' ||
      legacyTokensMode ||
      (!isNaN(initialQuotaPerUnit) && initialQuotaPerUnit !== 500000)
    );
  }, [props.options]);

  const quotaDisplayType = inputs['general_setting.quota_display_type'];

  const quotaDisplayTypeDesc = useMemo(() => {
    const descMap = {
      USD: t(' ($) '),
      CNY: t(' (¥) '),
      TOKENS: t(' Token '),
      CUSTOM: t(''),
    };
    return descMap[quotaDisplayType] || '';
  }, [quotaDisplayType, t]);

  const rateLabel = useMemo(() => {
    if (quotaDisplayType === 'CNY') return t('');
    if (quotaDisplayType === 'TOKENS') return t(' Token ');
    if (quotaDisplayType === 'CUSTOM') return t('');
    return '';
  }, [quotaDisplayType, t]);

  const rateSuffix = useMemo(() => {
    if (quotaDisplayType === 'CNY') return 'CNY (¥)';
    if (quotaDisplayType === 'TOKENS') return 'Tokens';
    if (quotaDisplayType === 'CUSTOM')
      return inputs['general_setting.custom_currency_symbol'] || '¤';
    return '';
  }, [quotaDisplayType, inputs]);

  const rateExtraText = useMemo(() => {
    if (quotaDisplayType === 'CNY')
      return t(
        ' (USD) ',
      );
    if (quotaDisplayType === 'TOKENS')
      return t(
        ' 500000',
      );
    if (quotaDisplayType === 'CUSTOM')
      return t(
        ' (USD) ',
      );
    return '';
  }, [quotaDisplayType, t]);

  const previewText = useMemo(() => {
    if (quotaDisplayType === 'USD') return '$1.00';
    const rate = parseFloat(combinedRate);
    if (!rate || isNaN(rate)) return t('');
    if (quotaDisplayType === 'CNY') return `$1.00 → ¥${rate.toFixed(2)}`;
    if (quotaDisplayType === 'TOKENS')
      return `$1.00 → ${Number(rate).toLocaleString()} Tokens`;
    if (quotaDisplayType === 'CUSTOM') {
      const symbol = inputs['general_setting.custom_currency_symbol'] || '¤';
      return `$1.00 → ${symbol}${rate.toFixed(2)}`;
    }
    return '';
  }, [quotaDisplayType, combinedRate, inputs, t]);

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    // 
    if (
      currentInputs['general_setting.quota_display_type'] === undefined &&
      props.options?.DisplayInCurrencyEnabled !== undefined
    ) {
      currentInputs['general_setting.quota_display_type'] = props.options
        .DisplayInCurrencyEnabled
        ? 'USD'
        : 'TOKENS';
    }
    // 
    if (props.options['general_setting.custom_currency_symbol'] !== undefined) {
      currentInputs['general_setting.custom_currency_symbol'] =
        props.options['general_setting.custom_currency_symbol'];
    }
    if (
      props.options['general_setting.custom_currency_exchange_rate'] !==
      undefined
    ) {
      currentInputs['general_setting.custom_currency_exchange_rate'] =
        props.options['general_setting.custom_currency_exchange_rate'];
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('')}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Input
                  field={'TopUpLink'}
                  label={t('')}
                  initValue={''}
                  placeholder={t('')}
                  onChange={handleFieldChange('TopUpLink')}
                  showClear
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Input
                  field={'general_setting.docs_link'}
                  label={t('')}
                  initValue={''}
                  placeholder={t(' https://docs.solqora.pro')}
                  onChange={handleFieldChange('general_setting.docs_link')}
                  showClear
                />
              </Col>
              {/* TOKENS  */}
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Input
                  field={'RetryTimes'}
                  label={t('')}
                  initValue={''}
                  placeholder={t('')}
                  onChange={handleFieldChange('RetryTimes')}
                  showClear
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Select
                  field='general_setting.quota_display_type'
                  label={t('')}
                  extraText={quotaDisplayTypeDesc}
                  onChange={handleFieldChange(
                    'general_setting.quota_display_type',
                  )}
                >
                  <Form.Select.Option value='USD'>
                    USD ($)
                  </Form.Select.Option>
                  <Form.Select.Option value='CNY'>
                    CNY (¥)
                  </Form.Select.Option>
                  {showTokensOption && (
                    <Form.Select.Option value='TOKENS'>
                      Tokens
                    </Form.Select.Option>
                  )}
                  <Form.Select.Option value='CUSTOM'>
                    {t('')}
                  </Form.Select.Option>
                </Form.Select>
              </Col>
              {quotaDisplayType !== 'USD' && (
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.Slot label={rateLabel}>
                    <Input
                      prefix='1 USD = '
                      suffix={rateSuffix}
                      value={combinedRate}
                      onChange={onCombinedRateChange}
                    />
                    <Text
                      type='tertiary'
                      size='small'
                      style={{ marginTop: 4, display: 'block' }}
                    >
                      {rateExtraText}
                    </Text>
                  </Form.Slot>
                </Col>
              )}
              <Col
                xs={24}
                sm={12}
                md={8}
                lg={8}
                xl={8}
                style={
                  quotaDisplayType !== 'CUSTOM'
                    ? { display: 'none' }
                    : undefined
                }
              >
                <Form.Input
                  field='general_setting.custom_currency_symbol'
                  label={t('')}
                  extraText={t(
                    ' €1.50',
                  )}
                  placeholder={t(' €, £, Rp, ₩, ₹...')}
                  onChange={handleFieldChange(
                    'general_setting.custom_currency_symbol',
                  )}
                  showClear
                />
              </Col>
              <Col span={24}>
                <Text type='tertiary' size='small'>
                  {t('')}{previewText}
                </Text>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'DisplayTokenStatEnabled'}
                  label={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={handleFieldChange('DisplayTokenStatEnabled')}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'DefaultCollapseSidebar'}
                  label={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={handleFieldChange('DefaultCollapseSidebar')}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'DemoSiteEnabled'}
                  label={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={handleFieldChange('DemoSiteEnabled')}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'SelfUseModeEnabled'}
                  label={t('')}
                  extraText={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={handleFieldChange('SelfUseModeEnabled')}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('')}
                  field={'token_setting.max_user_tokens'}
                  step={1}
                  min={1}
                  extraText={t(' 1000')}
                  placeholder={'1000'}
                  onChange={handleFieldChange('token_setting.max_user_tokens')}
                />
              </Col>
            </Row>
            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>

      <Modal
        title={t('')}
        visible={showQuotaWarning}
        onOk={() => setShowQuotaWarning(false)}
        onCancel={() => setShowQuotaWarning(false)}
        closeOnEsc={true}
        width={500}
      >
        <Banner
          type='warning'
          description={t(
            '5000006',
          )}
          bordered
          fullMode={false}
          closeIcon={null}
        />
      </Modal>
    </>
  );
}

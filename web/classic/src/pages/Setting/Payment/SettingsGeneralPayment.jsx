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
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsGeneralPayment(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    ServerAddress: '',
    CustomCallbackAddress: '',
    TopupGroupRatio: '',
    PayMethods: '',
    AmountOptions: '',
    AmountDiscount: '',
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        ServerAddress: props.options.ServerAddress || '',
        CustomCallbackAddress: props.options.CustomCallbackAddress || '',
        TopupGroupRatio: props.options.TopupGroupRatio || '',
        PayMethods: props.options.PayMethods || '',
        AmountOptions: props.options.AmountOptions || '',
        AmountDiscount: props.options.AmountDiscount || '',
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitGeneralSettings = async () => {
    if (
      originInputs.TopupGroupRatio !== inputs.TopupGroupRatio &&
      !verifyJSON(inputs.TopupGroupRatio)
    ) {
      showError(t(' JSON '));
      return;
    }

    if (
      originInputs.PayMethods !== inputs.PayMethods &&
      !verifyJSON(inputs.PayMethods)
    ) {
      showError(t(' JSON '));
      return;
    }

    if (
      originInputs.AmountOptions !== inputs.AmountOptions &&
      inputs.AmountOptions.trim() !== '' &&
      !verifyJSON(inputs.AmountOptions)
    ) {
      showError(t(' JSON '));
      return;
    }

    if (
      originInputs.AmountDiscount !== inputs.AmountDiscount &&
      inputs.AmountDiscount.trim() !== '' &&
      !verifyJSON(inputs.AmountDiscount)
    ) {
      showError(t(' JSON '));
      return;
    }

    setLoading(true);
    try {
      const options = [
        {
          key: 'ServerAddress',
          value: removeTrailingSlash(inputs.ServerAddress),
        },
      ];

      if (inputs.CustomCallbackAddress !== '') {
        options.push({
          key: 'CustomCallbackAddress',
          value: removeTrailingSlash(inputs.CustomCallbackAddress),
        });
      }
      if (originInputs.TopupGroupRatio !== inputs.TopupGroupRatio) {
        options.push({ key: 'TopupGroupRatio', value: inputs.TopupGroupRatio });
      }
      if (originInputs.PayMethods !== inputs.PayMethods) {
        options.push({ key: 'PayMethods', value: inputs.PayMethods });
      }
      if (originInputs.AmountOptions !== inputs.AmountOptions) {
        options.push({
          key: 'payment_setting.amount_options',
          value: inputs.AmountOptions,
        });
      }
      if (originInputs.AmountDiscount !== inputs.AmountDiscount) {
        options.push({
          key: 'payment_setting.amount_discount',
          value: inputs.AmountDiscount,
        });
      }

      const results = await Promise.all(
        options.map((option) =>
          API.put('/api/option/', {
            key: option.key,
            value: option.value,
          }),
        ),
      );

      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length === 0) {
        showSuccess(t(''));
        setOriginInputs({ ...inputs });
        props.refresh && props.refresh();
      } else {
        errorResults.forEach((res) => {
          showError(res.data.message);
        });
      }
    } catch (error) {
      showError(t(''));
    }
    setLoading(false);
  };

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Form.Input
            field='ServerAddress'
            label={t('')}
            placeholder={'https://yourdomain.com'}
            style={{ width: '100%' }}
            extraText={t(
              '',
            )}
          />
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='CustomCallbackAddress'
                label={t('')}
                placeholder={t('https://yourdomain.com')}
                extraText={t(
                  '',
                )}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='TopupGroupRatio'
                label={t('')}
                placeholder={t(' JSON ')}
                autosize
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='PayMethods'
                label={t('')}
                placeholder={t(' JSON ')}
                autosize
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.TextArea
                field='AmountOptions'
                label={t('')}
                placeholder={t(
                  ' JSON [10, 20, 50, 100, 200, 500]',
                )}
                autosize
                extraText={t(
                  '[10, 20, 50, 100, 200, 500]',
                )}
              />
            </Col>
          </Row>
          <Row style={{ marginTop: 16 }}>
            <Col span={24}>
              <Form.TextArea
                field='AmountDiscount'
                label={t('')}
                placeholder={t(
                  ' JSON {"100": 0.95, "200": 0.9, "500": 0.85}',
                )}
                autosize
                extraText={t(
                  '{"100": 0.95, "200": 0.9, "500": 0.85}',
                )}
              />
            </Col>
          </Row>
          <Button onClick={submitGeneralSettings} style={{ marginTop: 16 }}>
            {t('')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}

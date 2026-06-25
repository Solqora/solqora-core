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
import { Banner, Button, Form, Row, Col, Spin } from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen, TriangleAlert } from 'lucide-react';

export default function SettingsPaymentGateway(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('Stripe ');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    StripeApiSecret: '',
    StripeWebhookSecret: '',
    StripePriceId: '',
    StripeUnitPrice: 8.0,
    StripeMinTopUp: 1,
    StripePromotionCodesEnabled: false,
  });
  const [originInputs, setOriginInputs] = useState({});
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        StripeApiSecret: props.options.StripeApiSecret || '',
        StripeWebhookSecret: props.options.StripeWebhookSecret || '',
        StripePriceId: props.options.StripePriceId || '',
        StripeUnitPrice:
          props.options.StripeUnitPrice !== undefined
            ? parseFloat(props.options.StripeUnitPrice)
            : 8.0,
        StripeMinTopUp:
          props.options.StripeMinTopUp !== undefined
            ? parseFloat(props.options.StripeMinTopUp)
            : 1,
        StripePromotionCodesEnabled:
          props.options.StripePromotionCodesEnabled !== undefined
            ? props.options.StripePromotionCodesEnabled
            : false,
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitStripeSetting = async () => {
    if (props.options.ServerAddress === '') {
      showError(t(''));
      return;
    }

    setLoading(true);
    try {
      const options = [];

      if (inputs.StripeApiSecret && inputs.StripeApiSecret !== '') {
        options.push({ key: 'StripeApiSecret', value: inputs.StripeApiSecret });
      }
      if (inputs.StripeWebhookSecret && inputs.StripeWebhookSecret !== '') {
        options.push({
          key: 'StripeWebhookSecret',
          value: inputs.StripeWebhookSecret,
        });
      }
      if (inputs.StripePriceId !== '') {
        options.push({ key: 'StripePriceId', value: inputs.StripePriceId });
      }
      if (
        inputs.StripeUnitPrice !== undefined &&
        inputs.StripeUnitPrice !== null
      ) {
        options.push({
          key: 'StripeUnitPrice',
          value: inputs.StripeUnitPrice.toString(),
        });
      }
      if (
        inputs.StripeMinTopUp !== undefined &&
        inputs.StripeMinTopUp !== null
      ) {
        options.push({
          key: 'StripeMinTopUp',
          value: inputs.StripeMinTopUp.toString(),
        });
      }
      if (
        originInputs['StripePromotionCodesEnabled'] !==
          inputs.StripePromotionCodesEnabled &&
        inputs.StripePromotionCodesEnabled !== undefined
      ) {
        options.push({
          key: 'StripePromotionCodesEnabled',
          value: inputs.StripePromotionCodesEnabled ? 'true' : 'false',
        });
      }

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
        // 
        setOriginInputs({ ...inputs });
        props.refresh?.();
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
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={
              <>
                Stripe Webhook 
                <a
                  href='https://dashboard.stripe.com/developers'
                  target='_blank'
                  rel='noreferrer'
                >
                  
                </a>
                
                <a
                  href='https://dashboard.stripe.com/test/developers'
                  target='_blank'
                  rel='noreferrer'
                >
                  
                </a>
                
                <br />
                {t('')}
                {props.options.ServerAddress
                  ? removeTrailingSlash(props.options.ServerAddress)
                  : t('')}
                /api/stripe/webhook
              </>
            }
            style={{ marginBottom: 12 }}
          />
          <Banner
            type='warning'
            icon={<TriangleAlert size={16} />}
            description='checkout.session.completed  checkout.session.expired'
            style={{ marginBottom: 16 }}
          />
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='StripeApiSecret'
                label={t('API ')}
                placeholder={t('sk_xxx  rk_xxx')}
                extraText={t(
                  ' Stripe API ',
                )}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='StripeWebhookSecret'
                label={t('Webhook ')}
                placeholder={t('whsec_xxx')}
                extraText={t(' Stripe Webhook ')}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='StripePriceId'
                label={t(' ID')}
                placeholder={t('price_xxx')}
                extraText={t(' Stripe ')}
              />
            </Col>
          </Row>
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='StripeUnitPrice'
                precision={2}
                label={t('x/')}
                placeholder={t('77/')}
                extraText={t(' 1 ')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.InputNumber
                field='StripeMinTopUp'
                label={t('')}
                placeholder={t('22$')}
                extraText={t('')}
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='StripePromotionCodesEnabled'
                size='default'
                checkedText=''
                uncheckedText=''
                label={t(' Stripe ')}
              />
            </Col>
          </Row>
          <Button onClick={submitStripeSetting}>{t(' Stripe ')}</Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}

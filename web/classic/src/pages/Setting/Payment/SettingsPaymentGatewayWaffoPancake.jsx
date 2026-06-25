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

import React, { useEffect, useRef, useState } from 'react';
import { Banner, Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen } from 'lucide-react';

const defaultInputs = {
  WaffoPancakeMerchantID: '',
  WaffoPancakePrivateKey: '',
  WaffoPancakeReturnURL: '',
};

export default function SettingsPaymentGatewayWaffoPancake(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle
    ? undefined
    : t('Waffo Pancake ');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(defaultInputs);
  const formApiRef = useRef(null);

  useEffect(() => {
    if (!props.options || !formApiRef.current) return;

    const currentInputs = {
      WaffoPancakeMerchantID: props.options.WaffoPancakeMerchantID || '',
      WaffoPancakePrivateKey: props.options.WaffoPancakePrivateKey || '',
      WaffoPancakeReturnURL: props.options.WaffoPancakeReturnURL || '',
    };

    setInputs(currentInputs);
    formApiRef.current.setValues(currentInputs);
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitWaffoPancakeSetting = async () => {
    const values = {
      ...inputs,
      ...(formApiRef.current?.getValues?.() || {}),
    };

    setLoading(true);
    try {
      // Classic admin only persists the three operator-typed fields.
      // Store/Product binding is handled exclusively by the default
      // frontend's catalog flow (see waffo-pancake-settings-section.tsx)
      // because picking entities from a live catalog needs the Select +
      // dependent-dropdown UX that the classic Semi-UI page doesn't have.
      const options = [
        {
          key: 'WaffoPancakeMerchantID',
          value: values.WaffoPancakeMerchantID || '',
        },
        {
          key: 'WaffoPancakeReturnURL',
          value: removeTrailingSlash(values.WaffoPancakeReturnURL || ''),
        },
      ];

      if ((values.WaffoPancakePrivateKey || '').trim()) {
        options.push({
          key: 'WaffoPancakePrivateKey',
          value: values.WaffoPancakePrivateKey,
        });
      }

      const results = await Promise.all(
        options.map((opt) =>
          API.put('/api/option/', {
            key: opt.key,
            value: opt.value,
          }),
        ),
      );

      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => showError(res.data.message));
        return;
      }

      showSuccess(t(''));
      props.refresh?.();
    } catch (error) {
      showError(t(''));
    } finally {
      setLoading(false);
    }
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
                Waffo Pancake  ID 
                <a
                  href='https://pancake.waffo.ai/merchant/dashboard'
                  target='_blank'
                  rel='noreferrer'
                >
                  Waffo Pancake 
                </a>
                 Store + Product
                test /  API 
                 Pancake  Test Mode  Production Mode
                 webhook 
                <br />
                {t('Test ')}
                {props.options.ServerAddress
                  ? removeTrailingSlash(props.options.ServerAddress)
                  : t('')}
                /api/waffo-pancake/webhook/test
                <br />
                {t('Production ')}
                {props.options.ServerAddress
                  ? removeTrailingSlash(props.options.ServerAddress)
                  : t('')}
                /api/waffo-pancake/webhook/prod
              </>
            }
            style={{ marginBottom: 12 }}
          />
          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoPancakeMerchantID'
                label={t(' ID')}
                placeholder={t('MER_xxx')}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={12} xl={12}>
              <Form.Input
                field='WaffoPancakeReturnURL'
                label={t('')}
                placeholder={t('https://example.com/console/topup')}
              />
            </Col>
          </Row>

          <Row
            gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
            style={{ marginTop: 16 }}
          >
            <Col xs={24}>
              <Form.TextArea
                field='WaffoPancakePrivateKey'
                label={t('API ')}
                placeholder={t('')}
                extraText={t('⚠  /  API —— Test Key Production Key')}
                type='password'
                autosize={{ minRows: 4, maxRows: 8 }}
              />
            </Col>
          </Row>

          <Button onClick={submitWaffoPancakeSetting}>
            {t(' Waffo Pancake ')}
          </Button>
        </Form.Section>
      </Form>
    </Spin>
  );
}

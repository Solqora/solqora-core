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
  Button,
  Col,
  Form,
  Row,
  Spin,
  Card,
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
import { Server, Cloud, Zap, ArrowUpRight } from 'lucide-react';

const { Text } = Typography;

export default function SettingModelDeployment(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    'model_deployment.ionet.api_key': '',
    'model_deployment.ionet.enabled': false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState({
    'model_deployment.ionet.api_key': '',
    'model_deployment.ionet.enabled': false,
  });
  const [testing, setTesting] = useState(false);

  const testApiKey = async () => {
    const apiKey = inputs['model_deployment.ionet.api_key'];

    const getLocalizedMessage = (message) => {
      switch (message) {
        case 'invalid request payload':
          return t('');
        case 'api_key is required':
          return t(' API Key');
        case 'failed to validate api key':
          return t('API Key ');
        default:
          return message;
      }
    };

    setTesting(true);
    try {
      const response = await API.post(
        '/api/deployments/settings/test-connection',
        apiKey && apiKey.trim() !== '' ? { api_key: apiKey.trim() } : {},
        {
          skipErrorHandler: true,
        },
      );

      if (response?.data?.success) {
        showSuccess(t('API Key  io.net '));
      } else {
        const rawMessage = response?.data?.message;
        const localizedMessage = rawMessage
          ? getLocalizedMessage(rawMessage)
          : t('API Key ');
        showError(localizedMessage);
      }
    } catch (error) {
      console.error('io.net API test error:', error);

      if (error?.code === 'ERR_NETWORK') {
        showError(t(''));
      } else {
        const rawMessage =
          error?.response?.data?.message || error?.message || '';
        const localizedMessage = rawMessage
          ? getLocalizedMessage(rawMessage)
          : t('');
        showError(t('') + localizedMessage);
      }
    } finally {
      setTesting(false);
    }
  };

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t(''));

    const requestQueue = updateArray.map((item) => {
      let value = String(inputs[item.key]);
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
        //  inputsRow 
        setInputsRow(structuredClone(inputs));
        props.refresh();
      })
      .catch(() => {
        showError(t(''));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    if (props.options) {
      const defaultInputs = {
        'model_deployment.ionet.api_key': '',
        'model_deployment.ionet.enabled': false,
      };

      const currentInputs = {};
      for (let key in defaultInputs) {
        if (props.options.hasOwnProperty(key)) {
          currentInputs[key] = props.options[key];
        } else {
          currentInputs[key] = defaultInputs[key];
        }
      }

      setInputs(currentInputs);
      setInputsRow(structuredClone(currentInputs));
      refForm.current?.setValues(currentInputs);
    }
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section
            text={
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span>{t('')}</span>
              </div>
            }
          >
            {/*<Text */}
            {/*  type="secondary" */}
            {/*  size="small"*/}
            {/*  style={{ */}
            {/*    display: 'block', */}
            {/*    marginBottom: '20px',*/}
            {/*    color: 'var(--semi-color-text-2)'*/}
            {/*  }}*/}
            {/*>*/}
            {/*  {t('API')}*/}
            {/*</Text>*/}

            <Card
              title={
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Cloud size={18} />
                  <span>io.net</span>
                </div>
              }
              bodyStyle={{ padding: '20px' }}
              style={{ marginBottom: '16px' }}
            >
              <Row gutter={24}>
                <Col xs={24} lg={14}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                    }}
                  >
                    <Form.Switch
                      label={t(' io.net ')}
                      field={'model_deployment.ionet.enabled'}
                      onChange={(value) =>
                        setInputs({
                          ...inputs,
                          'model_deployment.ionet.enabled': value,
                        })
                      }
                      extraText={t(' io.net GPU ')}
                    />
                    <Form.Input
                      label={t('API Key')}
                      field={'model_deployment.ionet.api_key'}
                      placeholder={t(' io.net API Key')}
                      onChange={(value) =>
                        setInputs({
                          ...inputs,
                          'model_deployment.ionet.api_key': value,
                        })
                      }
                      disabled={!inputs['model_deployment.ionet.enabled']}
                      extraText={t(' Project  io.cloud ')}
                      mode='password'
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <Button
                        type='outline'
                        size='small'
                        icon={<Zap size={16} />}
                        onClick={testApiKey}
                        loading={testing}
                        disabled={!inputs['model_deployment.ionet.enabled']}
                        style={{
                          height: '32px',
                          fontSize: '13px',
                          borderRadius: '6px',
                          fontWeight: '500',
                          borderColor: testing
                            ? 'var(--semi-color-primary)'
                            : 'var(--semi-color-border)',
                          color: testing
                            ? 'var(--semi-color-primary)'
                            : 'var(--semi-color-text-0)',
                        }}
                      >
                        {testing ? t('...') : t('')}
                      </Button>
                    </div>
                  </div>
                </Col>
                <Col xs={24} lg={10}>
                  <div
                    style={{
                      background: 'var(--semi-color-fill-0)',
                      padding: '16px',
                      borderRadius: '8px',
                      border: '1px solid var(--semi-color-border)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <Text
                        strong
                        style={{ display: 'block', marginBottom: '8px' }}
                      >
                        {t(' io.net API Key')}
                      </Text>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          color: 'var(--semi-color-text-2)',
                          fontSize: '13px',
                          lineHeight: 1.6,
                        }}
                      >
                        <li>{t(' io.net  API Keys ')}</li>
                        <li>
                          {t(' Project  io.cloud')}
                        </li>
                        <li>{t('')}</li>
                      </ul>
                    </div>
                    <Button
                      icon={<ArrowUpRight size={16} />}
                      type='primary'
                      theme='solid'
                      style={{ width: '100%' }}
                      onClick={() =>
                        window.open('https://ai.io.net/ai/api-keys', '_blank')
                      }
                    >
                      {t(' io.net API Keys')}
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>

            <Row>
              <Button size='default' type='primary' onClick={onSubmit}>
                {t('')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>
    </>
  );
}

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
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';

const GEMINI_SETTING_EXAMPLE = {
  default: 'OFF'
};

const GEMINI_VERSION_EXAMPLE = {
  default: 'v1beta',
};

const DEFAULT_GEMINI_INPUTS = {
  'gemini.safety_settings': '',
  'gemini.version_settings': '',
  'gemini.supported_imagine_models': '',
  'gemini.thinking_adapter_enabled': false,
  'gemini.thinking_adapter_budget_tokens_percentage': 0.6,
  'gemini.function_call_thought_signature_enabled': true,
  'gemini.remove_function_response_id_enabled': true,
};

export default function SettingGeminiModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState(DEFAULT_GEMINI_INPUTS);
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(DEFAULT_GEMINI_INPUTS);

  async function onSubmit() {
    await refForm.current
      .validate()
      .then(() => {
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
            props.refresh();
          })
          .catch(() => {
            showError(t(''));
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error('Validation failed:', error);
        showError(t(''));
      });
  }

  useEffect(() => {
    const currentInputs = { ...DEFAULT_GEMINI_INPUTS };
    for (let key in props.options) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_GEMINI_INPUTS, key)) {
        currentInputs[key] = props.options[key];
      }
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
          <Form.Section text={t('Gemini')}>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Gemini')}
                  placeholder={
                    t(' JSON ') +
                    '\n' +
                    JSON.stringify(GEMINI_SETTING_EXAMPLE, null, 2)
                  }
                  field={'gemini.safety_settings'}
                  extraText={t(
                    'default',
                  )}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(' JSON '),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'gemini.safety_settings': value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Gemini')}
                  placeholder={
                    t(' JSON ') +
                    '\n' +
                    JSON.stringify(GEMINI_VERSION_EXAMPLE, null, 2)
                  }
                  field={'gemini.version_settings'}
                  extraText={t('default')}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(' JSON '),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'gemini.version_settings': value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.Switch
                  label={t('FunctionCall')}
                  field={'gemini.function_call_thought_signature_enabled'}
                  extraText={t(
                    'OpenAIGemini/VertexthoughtSignature',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.function_call_thought_signature_enabled': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.Switch
                  label={t(' functionResponse.id ')}
                  field={'gemini.remove_function_response_id_enabled'}
                  extraText={t(
                    'Vertex AI  functionResponse.id ',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.remove_function_response_id_enabled': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  field={'gemini.supported_imagine_models'}
                  label={t('')}
                  placeholder={
                    t('') +
                    '\n' +
                    JSON.stringify(
                      ['gemini-2.0-flash-exp-image-generation'],
                      null,
                      2,
                    )
                  }
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.supported_imagine_models': value,
                    })
                  }
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t(' JSON '),
                    },
                  ]}
                />
              </Col>
            </Row>
          </Form.Section>

          <Form.Section text={t('Gemini')}>
            <Row>
              <Col span={16}>
                <Text>
                  {t(
                    'ClaudeGemini' +
                      '' +
                      ' gemini-2.5-pro-preview-06-05-thinking-128 ',
                  )}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.Switch
                  label={t('Gemini')}
                  field={'gemini.thinking_adapter_enabled'}
                  extraText={t(
                    ' -thinking-thinking-  -nothinking ',
                  )}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.thinking_adapter_enabled': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Text>
                  {t(
                    'Gemini BudgetTokens = MaxTokens * BudgetTokens ',
                  )}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('')}
                  field={'gemini.thinking_adapter_budget_tokens_percentage'}
                  initValue={''}
                  extraText={t('0.002-1')}
                  min={0.002}
                  max={1}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.thinking_adapter_budget_tokens_percentage': value,
                    })
                  }
                />
              </Col>
            </Row>
          </Form.Section>

          <Row>
            <Button size='default' onClick={onSubmit}>
              {t('')}
            </Button>
          </Row>
        </Form>
      </Spin>
    </>
  );
}

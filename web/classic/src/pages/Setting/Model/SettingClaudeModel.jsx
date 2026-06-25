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

const CLAUDE_HEADER = {
  'claude-3-7-sonnet-20250219-thinking': {
    'anthropic-beta': [
      'output-128k-2025-02-19',
      'token-efficient-tools-2025-02-19',
    ],
  },
};

const CLAUDE_HEADER_APPEND_CONFIG = {
  'claude-3-7-sonnet-20250219-thinking': {
    'anthropic-beta': ['token-efficient-tools-2025-02-19'],
  },
};

const CLAUDE_HEADER_APPEND_BEFORE = `anthropic-beta: output-128k-2025-02-19`;

const CLAUDE_HEADER_APPEND_AFTER = `anthropic-beta: output-128k-2025-02-19,token-efficient-tools-2025-02-19`;

const CLAUDE_DEFAULT_MAX_TOKENS = {
  default: 8192,
  'claude-3-haiku-20240307': 4096,
  'claude-3-opus-20240229': 4096,
  'claude-3-7-sonnet-20250219-thinking': 8192,
};

export default function SettingClaudeModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    'claude.model_headers_settings': '',
    'claude.thinking_adapter_enabled': true,
    'claude.default_max_tokens': '',
    'claude.thinking_adapter_budget_tokens_percentage': 0.8,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

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
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
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
          <Form.Section text={t('Claude')}>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Claude')}
                  field={'claude.model_headers_settings'}
                  placeholder={
                    t(' JSON ') +
                    '\n' +
                    JSON.stringify(CLAUDE_HEADER, null, 2)
                  }
                  extraText={
                    <div>
                      <div>
                        {t(
                          'Claude',
                        )}
                      </div>
                      <div className='mt-2 whitespace-pre-wrap font-mono text-xs'>
                        {`${t('')}\n${CLAUDE_HEADER_APPEND_BEFORE}\n\n${t('')}\n${JSON.stringify(
                          CLAUDE_HEADER_APPEND_CONFIG,
                          null,
                          2,
                        )}\n\n${t('')}\n${CLAUDE_HEADER_APPEND_AFTER}`}
                      </div>
                    </div>
                  }
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
                    setInputs({
                      ...inputs,
                      'claude.model_headers_settings': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t(' MaxTokens')}
                  field={'claude.default_max_tokens'}
                  placeholder={
                    t(' JSON ') +
                    '\n' +
                    JSON.stringify(CLAUDE_DEFAULT_MAX_TOKENS, null, 2)
                  }
                  extraText={
                    t('') +
                    '\n' +
                    JSON.stringify(CLAUDE_DEFAULT_MAX_TOKENS, null, 2)
                  }
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
                    setInputs({ ...inputs, 'claude.default_max_tokens': value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.Switch
                  label={t('Claude-thinking')}
                  field={'claude.thinking_adapter_enabled'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'claude.thinking_adapter_enabled': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                {/*//MaxTokensBudgetTokens, */}
                <Text>
                  {t(
                    'Claude BudgetTokens = MaxTokens * BudgetTokens ',
                  )}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t(' BudgetTokens ')}
                  field={'claude.thinking_adapter_budget_tokens_percentage'}
                  initValue={''}
                  extraText={t('0.1')}
                  min={0.1}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'claude.thinking_adapter_budget_tokens_percentage': value,
                    })
                  }
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
    </>
  );
}

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
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function DataDashboard(props) {
  const { t } = useTranslation();

  const optionsDataExportDefaultTime = [
    { key: 'hour', label: t(''), value: 'hour' },
    { key: 'day', label: t(''), value: 'day' },
    { key: 'week', label: t(''), value: 'week' },
  ];
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    DataExportEnabled: false,
    DataExportInterval: '',
    DataExportDefaultTime: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

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
    localStorage.setItem(
      'data_export_default_time',
      String(inputs.DataExportDefaultTime),
    );
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
                <Form.Switch
                  field={'DataExportEnabled'}
                  label={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={(value) => {
                    setInputs({
                      ...inputs,
                      DataExportEnabled: value,
                    });
                  }}
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('')}
                  step={1}
                  min={1}
                  suffix={t('')}
                  extraText={t('')}
                  placeholder={t('')}
                  field={'DataExportInterval'}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DataExportInterval: String(value),
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Select
                  label={t('')}
                  optionList={optionsDataExportDefaultTime}
                  field={'DataExportDefaultTime'}
                  extraText={t('')}
                  placeholder={t('')}
                  style={{ width: 180 }}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      DataExportDefaultTime: String(value),
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

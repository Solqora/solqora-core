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

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Button,
  Col,
  Collapsible,
  Form,
  Radio,
  RadioGroup,
  Row,
  SideSheet,
  Spin,
  Switch,
  Tabs,
  Typography,
} from '@douyinfe/semi-ui';
import { IconChevronDown, IconChevronUp } from '@douyinfe/semi-icons';
import { IconHelpCircle } from '@douyinfe/semi-icons';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import GroupTable from './components/GroupTable';
import AutoGroupList from './components/AutoGroupList';
import GroupGroupRatioRules from './components/GroupGroupRatioRules';
import GroupSpecialUsableRules from './components/GroupSpecialUsableRules';

const { Text, Title, Paragraph } = Typography;

const OPTION_KEYS = [
  'GroupRatio',
  'UserUsableGroups',
  'GroupGroupRatio',
  'group_ratio_setting.group_special_usable_group',
  'AutoGroups',
  'DefaultUseAutoGroup',
];

function parseJSONSafe(str, fallback) {
  if (!str || !str.trim()) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export default function GroupRatioSettings(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState('visual');
  const [showGuide, setShowGuide] = useState(false);

  const [inputs, setInputs] = useState({
    GroupRatio: '',
    UserUsableGroups: '',
    GroupGroupRatio: '',
    'group_ratio_setting.group_special_usable_group': '',
    AutoGroups: '',
    DefaultUseAutoGroup: false,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  const dataVersionRef = useRef(0);

  const groupNames = useMemo(() => {
    const ratioMap = parseJSONSafe(inputs.GroupRatio, {});
    return Object.keys(ratioMap);
  }, [inputs.GroupRatio]);

  async function onSubmit() {
    if (editMode === 'manual') {
      try {
        await refForm.current.validate();
      } catch {
        showError(t(''));
        return;
      }
    }

    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) {
      return showWarning(t(''));
    }

    const requestQueue = updateArray.map((item) => {
      const value =
        typeof inputs[item.key] === 'boolean'
          ? String(inputs[item.key])
          : inputs[item.key];
      return API.put('/api/option/', { key: item.key, value });
    });

    setLoading(true);
    try {
      const res = await Promise.all(requestQueue);
      if (res.includes(undefined)) {
        return showError(
          requestQueue.length > 1
            ? t('')
            : t(''),
        );
      }
      for (let i = 0; i < res.length; i++) {
        if (!res[i].data.success) {
          return showError(res[i].data.message);
        }
      }
      showSuccess(t(''));
      props.refresh();
    } catch (error) {
      console.error('Unexpected error:', error);
      showError(t(''));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (OPTION_KEYS.includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    dataVersionRef.current += 1;
    if (refForm.current) {
      refForm.current.setValues(currentInputs);
    }
  }, [props.options]);

  const handleGroupTableChange = useCallback(
    ({ GroupRatio, UserUsableGroups }) => {
      setInputs((prev) => ({ ...prev, GroupRatio, UserUsableGroups }));
    },
    [],
  );

  const handleAutoGroupsChange = useCallback((value) => {
    setInputs((prev) => ({ ...prev, AutoGroups: value }));
  }, []);

  const handleGroupGroupRatioChange = useCallback((value) => {
    setInputs((prev) => ({ ...prev, GroupGroupRatio: value }));
  }, []);

  const handleSpecialUsableChange = useCallback((value) => {
    setInputs((prev) => ({
      ...prev,
      'group_ratio_setting.group_special_usable_group': value,
    }));
  }, []);

  const dv = dataVersionRef.current;

  const renderVisualMode = () => (
    <Form key='form-visual' values={inputs} style={{ marginBottom: 15 }}>
      <Form.Section text={t('')}>
        <Text type='tertiary' size='small' style={{ display: 'block', marginBottom: 12 }}>
          {t('')}
        </Text>
        <GroupTable
          key={`gt_${dv}`}
          groupRatio={inputs.GroupRatio}
          userUsableGroups={inputs.UserUsableGroups}
          onChange={handleGroupTableChange}
        />
      </Form.Section>

      <Form.Section text={t('')}>
        <Text type='tertiary' size='small' style={{ display: 'block', marginBottom: 12 }}>
          {t(' auto ')}
        </Text>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8} lg={8} xl={8}>
            <Form.Slot label={t('auto')}>
              <div className='flex items-center gap-2'>
                <Switch
                  checked={!!inputs.DefaultUseAutoGroup}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={(value) =>
                    setInputs((prev) => ({
                      ...prev,
                      DefaultUseAutoGroup: value,
                    }))
                  }
                />
              </div>
              <Text type='tertiary' size='small' style={{ marginTop: 4 }}>
                {t('autoauto')}
              </Text>
            </Form.Slot>
          </Col>
        </Row>
        <AutoGroupList
          key={`ag_${dv}`}
          value={inputs.AutoGroups}
          groupNames={groupNames}
          onChange={handleAutoGroupsChange}
        />
      </Form.Section>

      <Form.Section text={t('')}>
        <Text type='tertiary' size='small' style={{ display: 'block', marginBottom: 12 }}>
          {t('vip  default  0.5')}
        </Text>
        <GroupGroupRatioRules
          key={`ggr_${dv}`}
          value={inputs.GroupGroupRatio}
          groupNames={groupNames}
          onChange={handleGroupGroupRatioChange}
        />
      </Form.Section>

      <Form.Section text={t('')}>
        <Text type='tertiary' size='small' style={{ display: 'block', marginBottom: 12 }}>
          {t('')}
        </Text>
        <GroupSpecialUsableRules
          key={`gsu_${dv}`}
          value={inputs['group_ratio_setting.group_special_usable_group']}
          groupNames={groupNames}
          onChange={handleSpecialUsableChange}
        />
      </Form.Section>
    </Form>
  );

  useEffect(() => {
    if (editMode === 'manual' && refForm.current) {
      refForm.current.setValues(inputs);
    }
  }, [editMode]);

  const renderManualMode = () => (
    <Form
      key='form-manual'
      initValues={inputs}
      getFormApi={(formAPI) => (refForm.current = formAPI)}
      style={{ marginBottom: 15 }}
    >
      <Form.Section text={t('JSON')}>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('')}
              placeholder={t(' JSON ')}
              extraText={t(
                ' JSON {"vip": 0.5, "test": 1} vip  0.5test  1',
              )}
              field={'GroupRatio'}
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
                setInputs((prev) => ({ ...prev, GroupRatio: value }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('')}
              placeholder={t(
                ' JSON ',
              )}
              extraText={t(
                ' JSON {"vip": "VIP ", "test": ""} vip  test ',
              )}
              field={'UserUsableGroups'}
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
                setInputs((prev) => ({ ...prev, UserUsableGroups: value }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('')}
              placeholder={t(' JSON ')}
              extraText={t(
                ' JSON {"vip": {"default": 0.5, "test": 1}} vip default0.5test1',
              )}
              field={'GroupGroupRatio'}
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
                setInputs((prev) => ({ ...prev, GroupGroupRatio: value }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('')}
              placeholder={t(' JSON ')}
              extraText={t(
                '"+:""-:"{"vip": {"+:premium": "", "special": "", "-:default": ""}} vip  premium  special  default ',
              )}
              field={'group_ratio_setting.group_special_usable_group'}
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
                setInputs((prev) => ({
                  ...prev,
                  'group_ratio_setting.group_special_usable_group': value,
                }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('auto')}
              placeholder={t(' JSON ')}
              field={'AutoGroups'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger='blur'
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => {
                    if (!value || value.trim() === '') return true;
                    try {
                      const parsed = JSON.parse(value);
                      if (!Array.isArray(parsed)) return false;
                      return parsed.every((item) => typeof item === 'string');
                    } catch {
                      return false;
                    }
                  },
                  message: t(
                    ' JSON ["g1","g2"]',
                  ),
                },
              ]}
              onChange={(value) =>
                setInputs((prev) => ({ ...prev, AutoGroups: value }))
              }
            />
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Switch
              label={t(
                'autoauto',
              )}
              field={'DefaultUseAutoGroup'}
              onChange={(value) =>
                setInputs((prev) => ({
                  ...prev,
                  DefaultUseAutoGroup: value,
                }))
              }
            />
          </Col>
        </Row>
      </Form.Section>
    </Form>
  );

  const GuideSection = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    return (
      <div style={{ marginTop: 16 }}>
        <Button
          theme='borderless'
          size='small'
          icon={open ? <IconChevronUp /> : <IconChevronDown />}
          onClick={() => setOpen(!open)}
          style={{ padding: '4px 0', color: 'var(--semi-color-primary)' }}
        >
          {title}
        </Button>
        <Collapsible isOpen={open} keepDOM>
          <div
            style={{
              background: 'var(--semi-color-fill-0)',
              padding: '12px 16px',
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            {children}
          </div>
        </Collapsible>
      </div>
    );
  };

  const CodeBlock = ({ children }) => (
    <pre
      style={{
        background: 'var(--semi-color-bg-2)',
        border: '1px solid var(--semi-color-border)',
        padding: '10px 14px',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 13,
        margin: '8px 0',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.6,
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  );

  const renderGuide = () => (
    <SideSheet
      title={t('')}
      visible={showGuide}
      onCancel={() => setShowGuide(false)}
      width={560}
      bodyStyle={{ overflow: 'auto', padding: '0 24px 24px' }}
    >
      <Tabs type='line' size='small'>
        <Tabs.TabPane tab={t('')} itemKey='overview'>
          <div style={{ paddingTop: 20 }}>
            <Title heading={5}>{t('')}</Title>
            <Paragraph style={{ marginTop: 12, lineHeight: 1.8 }}>
              {t(
                '',
              )}
            </Paragraph>
            <Paragraph style={{ marginTop: 8, lineHeight: 1.8 }}>
              {t(
                ' VIP  API ',
              )}
            </Paragraph>

            <GuideSection title={t('')}>
              <Paragraph style={{ lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>{' — '}
                {t(' defaultvip')}
              </Paragraph>
              <Paragraph style={{ lineHeight: 1.8, marginTop: 4 }}>
                <Text strong>{t('')}</Text>{' — '}
                {t('')}
              </Paragraph>
              <Paragraph style={{ lineHeight: 1.8, marginTop: 4 }}>
                <Text strong>{t('')}</Text>{' — '}
                {t(' 0.5 ')}
              </Paragraph>
              <Paragraph style={{ lineHeight: 1.8, marginTop: 4 }}>
                <Text strong>{t('')}</Text>{' — '}
                {t('')}
              </Paragraph>
              <Paragraph style={{ lineHeight: 1.8, marginTop: 4 }}>
                <Text strong>{t('')}</Text>{' — '}
                {t(' auto ')}
              </Paragraph>
            </GuideSection>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab={t('')} itemKey='groups'>
          <div style={{ paddingTop: 20 }}>
            <Title heading={5}>{t('')}</Title>
            <Paragraph style={{ marginTop: 12, lineHeight: 1.8 }}>
              {t('')}
            </Paragraph>

            <GuideSection title={t('')}>
              <Paragraph size='small' type='tertiary' style={{ marginBottom: 8 }}>
                {t('')}
              </Paragraph>
              <CodeBlock>
                {`${t('')}      ${t('')}    ${t('')}    ${t('')}\n──────────────────────────────────────\nstandard  1.0     ${t('')}        ${t('')}\npremium   0.5     ${t('')}        ${t('')}`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 10, lineHeight: 1.8 }}>
                {t('')}
              </Paragraph>
              <CodeBlock>
                {t(' → ')}{'\n'}
                {`  ├─ standard (${t('')})`}{'\n'}
                {`  └─ premium  (${t('')})`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 10, lineHeight: 1.8 }}>
                {t(' premium  API  standard  50%')}
              </Paragraph>
              <Paragraph size='small' style={{ marginTop: 16, lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>
              </Paragraph>
              <Paragraph size='small' style={{ marginTop: 4, lineHeight: 1.8 }}>
                {t(' default  vip')}
              </Paragraph>
              <CodeBlock>
                {`${t('')}      ${t('')}    ${t('')}    ${t('')}\n──────────────────────────────────────\ndefault   1.0     ${t('')}        ${t('')}\nvip       0.5     ${t('')}        ${t('')}\nstandard  1.0     ${t('')}        ${t('')}\npremium   0.5     ${t('')}        ${t('')}`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 8, lineHeight: 1.8 }}>
                {t(' standard  premium')}
              </Paragraph>
              <CodeBlock>
                {t(' → ')}{'\n'}
                {`  ├─ standard (${t('')})`}{'\n'}
                {`  └─ premium  (${t('')})`}{'\n\n'}
                {`  ${t('')} default ${t('')} vip`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 8, lineHeight: 1.8 }}>
                {t('default  vip ')}
              </Paragraph>
              <Paragraph size='small' style={{ marginTop: 12, lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>
              </Paragraph>
              <Paragraph size='small' style={{ lineHeight: 1.8 }}>
                {t(' vip')}
              </Paragraph>
              <Paragraph size='small' style={{ lineHeight: 1.8, marginTop: 4 }}>
                {'1. '}<Text strong>{t('')}</Text>{' — '}
                {t(' vip  standard  1.0  0.8')}
              </Paragraph>
              <Paragraph size='small' style={{ lineHeight: 1.8, marginTop: 2 }}>
                {'2. '}<Text strong>{t('')}</Text>{' — '}
                {t(' vip  premium ')}
              </Paragraph>
              <Paragraph size='small' type='tertiary' style={{ lineHeight: 1.8, marginTop: 6 }}>
                {t('')}
              </Paragraph>
            </GuideSection>

            <GuideSection title={t('JSON ')}>
              <Paragraph size='small' style={{ marginBottom: 4 }}>
                <Text strong code>GroupRatio</Text>{' — '}{t('')}
              </Paragraph>
              <CodeBlock>{`{"default": 1, "vip": 0.5, "standard": 1, "premium": 0.5}`}</CodeBlock>
              <Paragraph size='small' style={{ marginBottom: 4, marginTop: 8 }}>
                <Text strong code>UserUsableGroups</Text>{' — '}{t('')}
              </Paragraph>
              <CodeBlock>{`{"standard": "${t('')}", "premium": "${t('')}"}`}</CodeBlock>
            </GuideSection>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab={t('')} itemKey='auto'>
          <div style={{ paddingTop: 20 }}>
            <Title heading={5}>{t('')}</Title>
            <Paragraph style={{ marginTop: 12, lineHeight: 1.8 }}>
              {t(' auto ')}
            </Paragraph>

            <GuideSection title={t('')}>
              <Paragraph size='small' type='tertiary' style={{ marginBottom: 6 }}>
                {t('')}
              </Paragraph>
              <CodeBlock>
                {`1. default    ${t('')}\n2. vip`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 6, lineHeight: 1.6 }}>
                {t(' auto  auto')}
              </Paragraph>
            </GuideSection>

            <GuideSection title={t('JSON ')}>
              <Paragraph size='small' style={{ marginBottom: 4 }}>
                <Text strong code>AutoGroups</Text>{' — '}{t('')}
              </Paragraph>
              <CodeBlock>{`["default", "vip"]`}</CodeBlock>
            </GuideSection>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab={t('')} itemKey='ratios'>
          <div style={{ paddingTop: 20 }}>
            <Title heading={5}>{t('')}</Title>
            <Paragraph style={{ marginTop: 12, lineHeight: 1.8 }}>
              {t('')}
            </Paragraph>
            <Paragraph style={{ marginTop: 8, lineHeight: 1.8 }}>
              {t('')}
            </Paragraph>

            <GuideSection title={t('')}>
              <Paragraph size='small' type='tertiary' style={{ marginBottom: 8 }}>
                {t(' standard 1.0 premium 0.5 vip  standard ')}
              </Paragraph>
              <Paragraph size='small' style={{ marginBottom: 8, lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>
              </Paragraph>
              <CodeBlock>
                {`${t('')} + standard ${t('')} → ${t('')} 1.0  (${t('')})\nvip ${t('')}  + standard ${t('')} → ${t('')} 1.0  (${t('')})`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 10, marginBottom: 8, lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>
              </Paragraph>
              <CodeBlock>
                {`${t('')}    ${t('')}    ${t('')}\n────────────────────────────\nvip       standard   0.8\nvip       premium    0.3`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 10, lineHeight: 1.8 }}>
                {t('')}
              </Paragraph>
              <CodeBlock>
                {`${t('')} + standard ${t('')} → ${t('')} 1.0  (${t('')})\nvip ${t('')}  + standard ${t('')} → ${t('')} 0.8  (${t(' 8 ')})\nvip ${t('')}  + premium  ${t('')} → ${t('')} 0.3  (${t(' 0.5  0.3')})`}
              </CodeBlock>
              <Paragraph size='small' type='tertiary' style={{ marginTop: 10, lineHeight: 1.8 }}>
                {t('')}
              </Paragraph>
            </GuideSection>

            <GuideSection title={t('JSON ')}>
              <Paragraph size='small' style={{ marginBottom: 4 }}>
                <Text strong code>GroupGroupRatio</Text>{' — '}{t(' →  → ')}
              </Paragraph>
              <CodeBlock>{`{\n  "vip": {\n    "standard": 0.8,\n    "premium": 0.3\n  }\n}`}</CodeBlock>
            </GuideSection>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane tab={t('')} itemKey='usable'>
          <div style={{ paddingTop: 20 }}>
            <Title heading={5}>{t('')}</Title>
            <Paragraph style={{ marginTop: 12, lineHeight: 1.8 }}>
              {t('')}
            </Paragraph>
            <Paragraph style={{ marginTop: 8, lineHeight: 1.8 }}>
              {t('')}
            </Paragraph>

            <GuideSection title={t('')}>
              <Paragraph size='small' type='tertiary' style={{ marginBottom: 8 }}>
                {t(' standard  premium  vip  exclusive  standard ')}
              </Paragraph>
              <Paragraph size='small' style={{ marginBottom: 8, lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>
              </Paragraph>
              <CodeBlock>
                {`${t('')} → ${t('')}:\n  ├─ standard\n  └─ premium`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 10, marginBottom: 8, lineHeight: 1.8 }}>
                <Text strong>{t(' vip ')}</Text>
              </Paragraph>
              <CodeBlock>
                {`${t('')}    ${t('')}        ${t('')}    ${t('')}\n──────────────────────────────────────────\nvip       ${t('')} (+:)   exclusive   ${t('')}\nvip       ${t('')} (-:)   standard    -`}
              </CodeBlock>
              <Paragraph size='small' style={{ marginTop: 10, lineHeight: 1.8 }}>
                {t('')}
              </Paragraph>
              <CodeBlock>
                {`${t('')} → ${t('')}:\n  ├─ standard\n  └─ premium\n\nvip ${t('')} → ${t('')}:\n  ├─ premium     (${t('')})\n  └─ exclusive   (${t('')})\n\n  ${t('standard vip ')}`}
              </CodeBlock>

              <Paragraph size='small' style={{ marginTop: 14, lineHeight: 1.8 }}>
                <Text strong>{t('')}</Text>
              </Paragraph>
              <CodeBlock>
                {`${t('')} (+:)  → ${t('')}\n${t('')} (-:)  → ${t('')}\n${t('')}       → ${t('')}`}
              </CodeBlock>
            </GuideSection>

            <GuideSection title={t('JSON ')}>
              <Paragraph size='small' style={{ marginBottom: 4 }}>
                <Text strong code>group_special_usable_group</Text>
              </Paragraph>
              <CodeBlock>{`{\n  "vip": {\n    "+:exclusive": "${t('')}",\n    "-:standard": "remove"\n  }\n}`}</CodeBlock>
              <Paragraph size='small' type='tertiary' style={{ marginTop: 6, lineHeight: 1.6 }}>
                {t(' +: -:  "remove"')}
              </Paragraph>
            </GuideSection>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </SideSheet>
  );

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 15 }}>
        <div className='flex items-center gap-3' style={{ marginTop: 12, marginBottom: 16 }}>
          <RadioGroup
            type='button'
            size='small'
            value={editMode}
            onChange={(e) => setEditMode(e.target.value)}
          >
            <Radio value='visual'>{t('')}</Radio>
            <Radio value='manual'>{t('')}</Radio>
          </RadioGroup>
          <Button
            icon={<IconHelpCircle />}
            theme='borderless'
            type='tertiary'
            size='small'
            onClick={() => setShowGuide(true)}
          >
            {t('')}
          </Button>
        </div>
        {editMode === 'visual' ? renderVisualMode() : renderManualMode()}
      </div>
      <Button size='default' onClick={onSubmit}>
        {t('')}
      </Button>
      {renderGuide()}
    </Spin>
  );
}

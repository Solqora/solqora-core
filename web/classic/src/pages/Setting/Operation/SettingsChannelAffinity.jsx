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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banner,
  Button,
  Col,
  Collapse,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconClose,
  IconCode,
  IconDelete,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
} from '@douyinfe/semi-icons';
import {
  API,
  compareObjects,
  showError,
  showSuccess,
  showWarning,
  toBoolean,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import {
  CHANNEL_AFFINITY_RULE_TEMPLATES,
  cloneChannelAffinityTemplate,
} from '../../../constants/channel-affinity-template.constants';
import ParamOverrideEditorModal from '../../../components/table/channels/modals/ParamOverrideEditorModal';

const KEY_ENABLED = 'channel_affinity_setting.enabled';
const KEY_SWITCH_ON_SUCCESS = 'channel_affinity_setting.switch_on_success';
const KEY_KEEP_ON_CHANNEL_DISABLED =
  'channel_affinity_setting.keep_on_channel_disabled';
const KEY_MAX_ENTRIES = 'channel_affinity_setting.max_entries';
const KEY_DEFAULT_TTL = 'channel_affinity_setting.default_ttl_seconds';
const KEY_RULES = 'channel_affinity_setting.rules';

const KEY_SOURCE_TYPES = [
  { label: 'context_int', value: 'context_int' },
  { label: 'context_string', value: 'context_string' },
  { label: 'request_header', value: 'request_header' },
  { label: 'gjson', value: 'gjson' },
];

const CONTEXT_KEY_PRESETS = [
  { key: 'id', label: 'id ID' },
  { key: 'token_id', label: 'token_id' },
  { key: 'token_key', label: 'token_key' },
  { key: 'token_group', label: 'token_group' },
  { key: 'group', label: 'groupusing_group' },
  { key: 'username', label: 'username' },
  { key: 'user_group', label: 'user_group' },
  { key: 'user_email', label: 'user_email' },
  { key: 'specific_channel_id', label: 'specific_channel_id' },
];

const RULES_JSON_PLACEHOLDER = `[
  {
    "name": "prefer-by-conversation-id",
    "model_regex": ["^gpt-.*$"],
    "path_regex": ["/v1/chat/completions"],
    "user_agent_include": ["curl", "PostmanRuntime"],
    "key_sources": [
      { "type": "gjson", "path": "metadata.conversation_id" },
      { "type": "context_string", "key": "conversation_id" }
    ],
    "value_regex": "^[-0-9A-Za-z._:]{1,128}$",
    "ttl_seconds": 600,
    "param_override_template": {
      "operations": [
        { "path": "temperature", "mode": "set", "value": 0.2 }
      ]
    },
    "skip_retry_on_failure": false,
    "include_using_group": true,
    "include_model_name": false,
    "include_rule_name": true
  }
]`;

const normalizeStringList = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
};

const stringifyPretty = (v) => JSON.stringify(v, null, 2);
const stringifyCompact = (v) => JSON.stringify(v);

const parseRulesJson = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map((rule, index) => ({
      id: index,
      ...(rule || {}),
    }));
  } catch (e) {
    return [];
  }
};

const rulesToJson = (rules) => {
  const payload = (rules || []).map((r) => {
    const { id, ...rest } = r || {};
    return rest;
  });
  return stringifyPretty(payload);
};

const normalizeKeySource = (src) => {
  const type = (src?.type || '').trim();
  const key = (src?.key || '').trim();
  const path = (src?.path || '').trim();

  if (type === 'gjson') {
    return { type, key: '', path };
  }

  return { type, key, path: '' };
};

const makeUniqueName = (existingNames, baseName) => {
  const base = (baseName || '').trim() || 'rule';
  if (!existingNames.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const n = `${base}-${i}`;
    if (!existingNames.has(n)) return n;
  }
  return `${base}-${Date.now()}`;
};

const tryParseRulesJsonArray = (jsonString) => {
  const raw = jsonString || '[]';
  if (!verifyJSON(raw)) return { ok: false, message: 'Rules JSON is invalid' };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed))
      return { ok: false, message: 'Rules JSON must be an array' };
    return { ok: true, value: parsed };
  } catch (e) {
    return { ok: false, message: 'Rules JSON is invalid' };
  }
};

const parseOptionalObjectJson = (jsonString, label) => {
  const raw = (jsonString || '').trim();
  if (!raw) return { ok: true, value: null };
  if (!verifyJSON(raw)) {
    return { ok: false, message: `${label} JSON ` };
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, message: `${label}  JSON ` };
    }
    return { ok: true, value: parsed };
  } catch (error) {
    return { ok: false, message: `${label} JSON ` };
  }
};

const buildChannelAffinityRulePayload = ({
  values,
  isEdit,
  editingRuleId,
  rulesLength,
  modelRegex,
  pathRegex,
  keySources,
  userAgentInclude,
  paramOverrideTemplate,
}) => ({
  id: isEdit ? editingRuleId : rulesLength,
  name: (values?.name || '').trim(),
  model_regex: modelRegex,
  path_regex: pathRegex,
  key_sources: keySources,
  value_regex: (values?.value_regex || '').trim(),
  ttl_seconds: Number(values?.ttl_seconds || 0),
  include_using_group: !!values?.include_using_group,
  include_model_name: !!values?.include_model_name,
  include_rule_name: !!values?.include_rule_name,
  skip_retry_on_failure: !!values?.skip_retry_on_failure,
  ...(userAgentInclude.length > 0
    ? { user_agent_include: userAgentInclude }
    : {}),
  ...(paramOverrideTemplate
    ? { param_override_template: paramOverrideTemplate }
    : {}),
});

export default function SettingsChannelAffinity(props) {
  const { t } = useTranslation();
  const { Text } = Typography;
  const [loading, setLoading] = useState(false);

  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    enabled: false,
    total: 0,
    unknown: 0,
    by_rule_name: {},
    cache_capacity: 0,
    cache_algo: '',
  });

  const [inputs, setInputs] = useState({
    [KEY_ENABLED]: false,
    [KEY_SWITCH_ON_SUCCESS]: true,
    [KEY_KEEP_ON_CHANNEL_DISABLED]: false,
    [KEY_MAX_ENTRIES]: 100000,
    [KEY_DEFAULT_TTL]: 3600,
    [KEY_RULES]: '[]',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  const [editMode, setEditMode] = useState('visual');
  const prevEditModeRef = useRef(editMode);

  const [rules, setRules] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const modalFormRef = useRef();
  const [modalInitValues, setModalInitValues] = useState(null);
  const [modalFormKey, setModalFormKey] = useState(0);
  const [modalAdvancedActiveKey, setModalAdvancedActiveKey] = useState([]);
  const [paramTemplateDraft, setParamTemplateDraft] = useState('');
  const [paramTemplateEditorVisible, setParamTemplateEditorVisible] =
    useState(false);

  const effectiveDefaultTTLSeconds =
    Number(inputs?.[KEY_DEFAULT_TTL] || 0) > 0
      ? Number(inputs?.[KEY_DEFAULT_TTL] || 0)
      : 3600;

  const buildModalFormValues = (rule) => {
    const r = rule || {};
    return {
      name: r.name || '',
      model_regex_text: (r.model_regex || []).join('\n'),
      path_regex_text: (r.path_regex || []).join('\n'),
      user_agent_include_text: (r.user_agent_include || []).join('\n'),
      value_regex: r.value_regex || '',
      ttl_seconds: Number(r.ttl_seconds || 0),
      skip_retry_on_failure: !!r.skip_retry_on_failure,
      include_using_group: r.include_using_group ?? true,
      include_model_name: !!r.include_model_name,
      include_rule_name: r.include_rule_name ?? true,
      param_override_template_json: r.param_override_template
        ? stringifyPretty(r.param_override_template)
        : '',
    };
  };

  const paramTemplatePreviewMeta = useMemo(() => {
    const raw = (paramTemplateDraft || '').trim();
    if (!raw) {
      return {
        tagLabel: t(''),
        tagColor: 'grey',
        preview: t(''),
      };
    }
    if (!verifyJSON(raw)) {
      return {
        tagLabel: t('JSON '),
        tagColor: 'red',
        preview: raw,
      };
    }
    try {
      return {
        tagLabel: t(''),
        tagColor: 'orange',
        preview: JSON.stringify(JSON.parse(raw), null, 2),
      };
    } catch (error) {
      return {
        tagLabel: t('JSON '),
        tagColor: 'red',
        preview: raw,
      };
    }
  }, [paramTemplateDraft, t]);

  const updateParamTemplateDraft = (value) => {
    const next = typeof value === 'string' ? value : '';
    setParamTemplateDraft(next);
    if (modalFormRef.current) {
      modalFormRef.current.setValue('param_override_template_json', next);
    }
  };

  const formatParamTemplateDraft = () => {
    const raw = (paramTemplateDraft || '').trim();
    if (!raw) return;
    if (!verifyJSON(raw)) {
      showError(t(' JSON '));
      return;
    }
    try {
      updateParamTemplateDraft(JSON.stringify(JSON.parse(raw), null, 2));
    } catch (error) {
      showError(t(' JSON '));
    }
  };

  const openParamTemplatePreview = (rule) => {
    const raw = rule?.param_override_template;
    if (!raw || typeof raw !== 'object') {
      showWarning(t(''));
      return;
    }
    Modal.info({
      title: t(''),
      content: (
        <div style={{ marginTop: 6, paddingBottom: 10 }}>
          <pre
            style={{
              margin: 0,
              maxHeight: 420,
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.6,
              padding: 10,
              borderRadius: 8,
              background: 'var(--semi-color-fill-0)',
              border: '1px solid var(--semi-color-border)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {stringifyPretty(raw)}
          </pre>
        </div>
      ),
      footer: null,
      width: 760,
    });
  };

  const refreshCacheStats = async () => {
    try {
      setCacheLoading(true);
      const res = await API.get('/api/option/channel_affinity_cache', {
        disableDuplicate: true,
      });
      const { success, message, data } = res.data;
      if (!success) return showError(t(message));
      setCacheStats(data || {});
    } catch (e) {
      showError(t(''));
    } finally {
      setCacheLoading(false);
    }
  };

  const confirmClearAllCache = () => {
    Modal.confirm({
      title: t(''),
      content: (
        <div style={{ lineHeight: '1.6' }}>
          <Text>{t('')}</Text>
        </div>
      ),
      onOk: async () => {
        const res = await API.delete('/api/option/channel_affinity_cache', {
          params: { all: true },
        });
        const { success, message } = res.data;
        if (!success) {
          showError(t(message));
          return;
        }
        showSuccess(t(''));
        await refreshCacheStats();
      },
    });
  };

  const confirmClearRuleCache = (rule) => {
    const name = (rule?.name || '').trim();
    if (!name) return;
    if (!rule?.include_rule_name) {
      showWarning(
        t('“”'),
      );
      return;
    }
    Modal.confirm({
      title: t(''),
      content: (
        <div style={{ lineHeight: '1.6' }}>
          <Text>{t('')}</Text> <Text strong>{name}</Text>
        </div>
      ),
      onOk: async () => {
        const res = await API.delete('/api/option/channel_affinity_cache', {
          params: { rule_name: name },
        });
        const { success, message } = res.data;
        if (!success) {
          showError(t(message));
          return;
        }
        showSuccess(t(''));
        await refreshCacheStats();
      },
    });
  };

  const setRulesJsonToForm = (jsonString) => {
    if (!refForm.current) return;
    // Use setValue instead of setValues. Semi Form's setValues assigns undefined
    // to every registered field not included in the payload, which can wipe other inputs.
    refForm.current.setValue(KEY_RULES, jsonString || '[]');
  };

  const switchToJsonMode = () => {
    // Ensure a stable source of truth when entering JSON mode.
    // Semi Form may ignore setValues() for an unmounted field, so we seed state first.
    const jsonString = rulesToJson(rules);
    setInputs((prev) => ({ ...(prev || {}), [KEY_RULES]: jsonString }));
    setEditMode('json');
  };

  const switchToVisualMode = () => {
    const validation = tryParseRulesJsonArray(inputs[KEY_RULES] || '[]');
    if (!validation.ok) {
      showError(t(validation.message));
      return;
    }
    setEditMode('visual');
  };

  const updateRulesState = (nextRules) => {
    setRules(nextRules);
    const jsonString = rulesToJson(nextRules);
    setInputs((prev) => ({ ...prev, [KEY_RULES]: jsonString }));
    if (refForm.current && editMode === 'json') {
      refForm.current.setValue(KEY_RULES, jsonString);
    }
  };

  const appendCodexAndClaudeCodeTemplates = () => {
    const doAppend = () => {
      const existingNames = new Set(
        (rules || [])
          .map((r) => (r?.name || '').trim())
          .filter((x) => x.length > 0),
      );

      const templates = [
        CHANNEL_AFFINITY_RULE_TEMPLATES.codexCli,
        CHANNEL_AFFINITY_RULE_TEMPLATES.claudeCli,
      ].map((tpl) => {
        const baseTemplate = cloneChannelAffinityTemplate(tpl);
        const name = makeUniqueName(existingNames, tpl.name);
        existingNames.add(name);
        return { ...baseTemplate, name };
      });

      const next = [...(rules || []), ...templates].map((r, idx) => ({
        ...(r || {}),
        id: idx,
      }));
      updateRulesState(next);
      showSuccess(t(''));
    };

    if ((rules || []).length === 0) {
      doAppend();
      return;
    }

    Modal.confirm({
      title: t(' Codex CLI / Claude CLI '),
      content: (
        <div style={{ lineHeight: '1.6' }}>
          <Text type='tertiary'>{t(' 2 ')}</Text>
        </div>
      ),
      onOk: doAppend,
    });
  };

  const ruleColumns = [
    {
      title: t(''),
      dataIndex: 'name',
      render: (text) => <Text>{text || '-'}</Text>,
    },
    {
      title: t(''),
      dataIndex: 'model_regex',
      render: (list) =>
        (list || []).length > 0
          ? (list || []).slice(0, 3).map((v, idx) => (
              <Tag key={`${v}-${idx}`} style={{ marginRight: 4 }}>
                {v}
              </Tag>
            ))
          : '-',
    },
    {
      title: t(''),
      dataIndex: 'path_regex',
      render: (list) =>
        (list || []).length > 0
          ? (list || []).slice(0, 2).map((v, idx) => (
              <Tag key={`${v}-${idx}`} style={{ marginRight: 4 }}>
                {v}
              </Tag>
            ))
          : '-',
    },
    {
      title: t('Key '),
      dataIndex: 'key_sources',
      render: (list) => {
        const xs = list || [];
        if (xs.length === 0) return '-';
        return xs.slice(0, 3).map((src, idx) => {
          const s = normalizeKeySource(src);
          const detail = s.type === 'gjson' ? s.path : s.key;
          return (
            <Tag key={`${s.type}-${idx}`} style={{ marginRight: 4 }}>
              {s.type}:{detail}
            </Tag>
          );
        });
      },
    },
    {
      title: t('TTL'),
      dataIndex: 'ttl_seconds',
      render: (v) => <Text>{Number(v || 0) || '-'}</Text>,
    },
    {
      title: t(''),
      dataIndex: 'skip_retry_on_failure',
      render: (value) => (
        <Tag color={value ? 'orange' : 'green'} style={{ marginRight: 4 }}>
          {value ? t('') : t('')}
        </Tag>
      ),
    },
    {
      title: t(''),
      render: (_, record) => {
        if (!record?.param_override_template) {
          return <Text type='tertiary'>-</Text>;
        }
        return (
          <Button
            size='small'
            icon={<IconSearch />}
            type='tertiary'
            onClick={() => openParamTemplatePreview(record)}
          >
            {t('')}
          </Button>
        );
      },
    },
    {
      title: t(''),
      render: (_, record) => {
        const name = (record?.name || '').trim();
        if (!name || !record?.include_rule_name) {
          return <Text type='tertiary'>N/A</Text>;
        }
        const n = Number(cacheStats?.by_rule_name?.[name] || 0);
        return <Text>{n}</Text>;
      },
    },
    {
      title: t(''),
      render: (_, record) => {
        const tags = [];
        if (record?.include_using_group) tags.push(t(''));
        if (record?.include_model_name) tags.push(t(''));
        if (record?.include_rule_name) tags.push(t(''));
        if (tags.length === 0) return '-';
        return tags.map((x) => (
          <Tag key={x} style={{ marginRight: 4 }}>
            {x}
          </Tag>
        ));
      },
    },
    {
      title: t(''),
      render: (_, record) => (
        <Space>
          <Button
            icon={<IconClose />}
            theme='borderless'
            type='warning'
            disabled={!record?.include_rule_name}
            title={t('')}
            aria-label={t('')}
            onClick={() => confirmClearRuleCache(record)}
          />
          <Button
            icon={<IconEdit />}
            theme='borderless'
            title={t('')}
            aria-label={t('')}
            onClick={() => handleEditRule(record)}
          />
          <Button
            icon={<IconDelete />}
            theme='borderless'
            type='danger'
            title={t('')}
            aria-label={t('')}
            onClick={() => handleDeleteRule(record.id)}
          />
        </Space>
      ),
    },
  ];

  const validateKeySources = (keySources) => {
    const xs = (keySources || []).map(normalizeKeySource).filter((x) => x.type);
    if (xs.length === 0) return { ok: false, message: 'Key ' };
    for (const x of xs) {
      if (
        x.type === 'context_int' ||
        x.type === 'context_string' ||
        x.type === 'request_header'
      ) {
        if (!x.key) return { ok: false, message: 'Key ' };
      } else if (x.type === 'gjson') {
        if (!x.path) return { ok: false, message: 'Path ' };
      } else {
        return { ok: false, message: 'Key ' };
      }
    }
    return { ok: true, value: xs };
  };

  const openAddModal = () => {
    const nextRule = {
      name: '',
      model_regex: [],
      path_regex: [],
      user_agent_include: [],
      key_sources: [{ type: 'gjson', path: '' }],
      value_regex: '',
      ttl_seconds: 0,
      skip_retry_on_failure: false,
      include_using_group: true,
      include_model_name: false,
      include_rule_name: true,
    };
    setEditingRule(nextRule);
    setIsEdit(false);
    modalFormRef.current = null;
    const initValues = buildModalFormValues(nextRule);
    setModalInitValues(initValues);
    setParamTemplateDraft(initValues.param_override_template_json || '');
    setParamTemplateEditorVisible(false);
    setModalAdvancedActiveKey([]);
    setModalFormKey((k) => k + 1);
    setModalVisible(true);
  };

  const handleEditRule = (rule) => {
    const r = rule || {};
    const nextRule = {
      ...r,
      user_agent_include: Array.isArray(r.user_agent_include)
        ? r.user_agent_include
        : [],
      key_sources: (r.key_sources || []).map(normalizeKeySource),
    };
    setEditingRule(nextRule);
    setIsEdit(true);
    modalFormRef.current = null;
    const initValues = buildModalFormValues(nextRule);
    setModalInitValues(initValues);
    setParamTemplateDraft(initValues.param_override_template_json || '');
    setParamTemplateEditorVisible(false);
    setModalAdvancedActiveKey([]);
    setModalFormKey((k) => k + 1);
    setModalVisible(true);
  };

  const handleDeleteRule = (id) => {
    const next = (rules || []).filter((r) => r.id !== id);
    updateRulesState(next.map((r, idx) => ({ ...r, id: idx })));
    showSuccess(t(''));
  };

  const handleModalSave = async () => {
    try {
      const values = await modalFormRef.current.validate();
      const modelRegex = normalizeStringList(values.model_regex_text);
      if (modelRegex.length === 0) return showError(t(''));

      const keySourcesValidation = validateKeySources(editingRule?.key_sources);
      if (!keySourcesValidation.ok)
        return showError(t(keySourcesValidation.message));

      const userAgentInclude = normalizeStringList(
        values.user_agent_include_text,
      );
      const paramTemplateValidation = parseOptionalObjectJson(
        paramTemplateDraft,
        '',
      );
      if (!paramTemplateValidation.ok) {
        return showError(t(paramTemplateValidation.message));
      }

      const rulePayload = buildChannelAffinityRulePayload({
        values,
        isEdit,
        editingRuleId: editingRule?.id,
        rulesLength: rules.length,
        modelRegex,
        pathRegex: normalizeStringList(values.path_regex_text),
        keySources: keySourcesValidation.value,
        userAgentInclude,
        paramOverrideTemplate: paramTemplateValidation.value,
      });

      if (!rulePayload.name) return showError(t(''));

      const next = [...(rules || [])];
      if (isEdit) {
        let idx = next.findIndex((r) => r.id === editingRule?.id);
        if (idx < 0 && editingRule?.name) {
          idx = next.findIndex(
            (r) => (r?.name || '').trim() === (editingRule?.name || '').trim(),
          );
        }
        if (idx < 0) return showError(t(''));
        next[idx] = rulePayload;
      } else {
        next.push(rulePayload);
      }
      updateRulesState(next.map((r, idx) => ({ ...r, id: idx })));
      setModalVisible(false);
      setEditingRule(null);
      setModalInitValues(null);
      setParamTemplateDraft('');
      setParamTemplateEditorVisible(false);
      showSuccess(t(''));
    } catch (e) {
      showError(t(''));
    }
  };

  const updateKeySource = (index, patch) => {
    const next = [...(editingRule?.key_sources || [])];
    next[index] = normalizeKeySource({
      ...(next[index] || {}),
      ...(patch || {}),
    });
    setEditingRule((prev) => ({ ...(prev || {}), key_sources: next }));
  };

  const addKeySource = () => {
    const next = [...(editingRule?.key_sources || [])];
    next.push({ type: 'gjson', path: '' });
    setEditingRule((prev) => ({ ...(prev || {}), key_sources: next }));
  };

  const removeKeySource = (index) => {
    const next = [...(editingRule?.key_sources || [])].filter(
      (_, i) => i !== index,
    );
    setEditingRule((prev) => ({ ...(prev || {}), key_sources: next }));
  };

  async function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t(''));

    if (!verifyJSON(inputs[KEY_RULES] || '[]'))
      return showError(t(' JSON '));
    let compactRules;
    try {
      compactRules = stringifyCompact(JSON.parse(inputs[KEY_RULES] || '[]'));
    } catch (e) {
      return showError(t(' JSON '));
    }

    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (item.key === KEY_RULES) {
        value = compactRules;
      } else if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = String(inputs[item.key] ?? '');
      }
      return API.put('/api/option/', { key: item.key, value });
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
      .catch(() => showError(t('')))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const currentInputs = { ...inputs };
    for (let key in props.options) {
      if (
        ![
          KEY_ENABLED,
          KEY_SWITCH_ON_SUCCESS,
          KEY_KEEP_ON_CHANNEL_DISABLED,
          KEY_MAX_ENTRIES,
          KEY_DEFAULT_TTL,
          KEY_RULES,
        ].includes(key)
      )
        continue;
      if (key === KEY_ENABLED)
        currentInputs[key] = toBoolean(props.options[key]);
      else if (key === KEY_SWITCH_ON_SUCCESS)
        currentInputs[key] = toBoolean(props.options[key]);
      else if (key === KEY_KEEP_ON_CHANNEL_DISABLED)
        currentInputs[key] = toBoolean(props.options[key]);
      else if (key === KEY_MAX_ENTRIES)
        currentInputs[key] = Number(props.options[key] || 0) || 0;
      else if (key === KEY_DEFAULT_TTL)
        currentInputs[key] = Number(props.options[key] || 0) || 0;
      else if (key === KEY_RULES) {
        try {
          const obj = JSON.parse(props.options[key] || '[]');
          currentInputs[key] = stringifyPretty(obj);
        } catch (e) {
          currentInputs[key] = props.options[key] || '[]';
        }
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    if (refForm.current) refForm.current.setValues(currentInputs);
    setRules(parseRulesJson(currentInputs[KEY_RULES]));
    refreshCacheStats();
  }, [props.options]);

  useEffect(() => {
    const prevEditMode = prevEditModeRef.current;
    prevEditModeRef.current = editMode;

    // On switching from visual -> json, ensure the JSON editor is seeded.
    // Semi Form may ignore setValues() for an unmounted field.
    if (prevEditMode === editMode) return;
    if (editMode !== 'json') return;
    if (!refForm.current) return;
    refForm.current.setValue(KEY_RULES, inputs[KEY_RULES] || '[]');
  }, [editMode, inputs]);

  useEffect(() => {
    if (editMode === 'visual') {
      setRules(parseRulesJson(inputs[KEY_RULES]));
    }
  }, [inputs[KEY_RULES], editMode]);

  const banner = (
    <Banner
      fullMode={false}
      type='info'
      description={t(
        ' JSON Body  Key',
      )}
    />
  );

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('')}>
            {banner}
            <Divider style={{ marginTop: 12, marginBottom: 12 }} />
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={KEY_ENABLED}
                  label={t('')}
                  checkedText='|'
                  uncheckedText='O'
                  onChange={(value) =>
                    setInputs({ ...inputs, [KEY_ENABLED]: value })
                  }
                />
                <Text type='tertiary' size='small'>
                  {t('')}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  field={KEY_MAX_ENTRIES}
                  label={t('')}
                  min={0}
                  placeholder=' 100000…'
                  extraText={
                    <Text type='tertiary' size='small'>
                      {t(
                        '0 100000',
                      )}
                    </Text>
                  }
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      [KEY_MAX_ENTRIES]: Number(value || 0),
                    })
                  }
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  field={KEY_DEFAULT_TTL}
                  label={t(' TTL')}
                  min={0}
                  placeholder=' 3600…'
                  extraText={
                    <Text type='tertiary' size='small'>
                      {t(
                        ' ttl_seconds  0 0  TTL3600 ',
                      )}
                    </Text>
                  }
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      [KEY_DEFAULT_TTL]: Number(value || 0),
                    })
                  }
                />
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 12 }}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={KEY_SWITCH_ON_SUCCESS}
                  label={t('')}
                  checkedText='|'
                  uncheckedText='O'
                  onChange={(value) =>
                    setInputs({ ...inputs, [KEY_SWITCH_ON_SUCCESS]: value })
                  }
                />
                <Text type='tertiary' size='small'>
                  {t(
                    '',
                  )}
                </Text>
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={KEY_KEEP_ON_CHANNEL_DISABLED}
                  label={t('')}
                  checkedText='|'
                  uncheckedText='O'
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      [KEY_KEEP_ON_CHANNEL_DISABLED]: value,
                    })
                  }
                />
                <Text type='tertiary' size='small'>
                  {t(
                    '/',
                  )}
                </Text>
              </Col>
            </Row>

            <Divider style={{ marginTop: 12, marginBottom: 12 }} />

            <Space style={{ marginBottom: 10 }}>
              <Button
                type={editMode === 'visual' ? 'primary' : 'tertiary'}
                onClick={switchToVisualMode}
              >
                {t('')}
              </Button>
              <Button
                type={editMode === 'json' ? 'primary' : 'tertiary'}
                onClick={switchToJsonMode}
              >
                {t('JSON ')}
              </Button>
              <Button onClick={appendCodexAndClaudeCodeTemplates}>
                {t(' Codex CLI / Claude CLI ')}
              </Button>
              <Button icon={<IconPlus />} onClick={openAddModal}>
                {t('')}
              </Button>
              <Button theme='solid' onClick={onSubmit}>
                {t('')}
              </Button>
              <Button
                icon={<IconRefresh />}
                loading={cacheLoading}
                onClick={refreshCacheStats}
              >
                {t('')}
              </Button>
              <Button type='danger' onClick={confirmClearAllCache}>
                {t('')}
              </Button>
            </Space>

            {editMode === 'visual' ? (
              <Table
                columns={ruleColumns}
                dataSource={rules}
                rowKey='id'
                pagination={false}
                size='small'
              />
            ) : (
              <Form.TextArea
                field={KEY_RULES}
                label={t(' JSON')}
                extraText={t(
                  ' JSON  JSON ',
                )}
                placeholder={RULES_JSON_PLACEHOLDER}
                style={{ width: '100%' }}
                autosize={{ minRows: 10, maxRows: 28 }}
                rules={[
                  {
                    validator: (rule, value) => verifyJSON(value || '[]'),
                  },
                ]}
                onChange={(value) =>
                  setInputs({ ...inputs, [KEY_RULES]: value })
                }
              />
            )}
          </Form.Section>
        </Form>
      </Spin>

      <Modal
        title={isEdit ? t('') : t('')}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRule(null);
          setModalInitValues(null);
          setModalAdvancedActiveKey([]);
          setParamTemplateDraft('');
          setParamTemplateEditorVisible(false);
        }}
        onOk={handleModalSave}
        okText={t('')}
        cancelText={t('')}
        width={720}
      >
        <Form
          key={`channel-affinity-rule-form-${modalFormKey}`}
          initValues={modalInitValues || {}}
          getFormApi={(formAPI) => {
            modalFormRef.current = formAPI;
          }}
        >
          <Form.Input
            field='name'
            label={t('')}
            extraText={t('')}
            placeholder=' prefer-by-conversation-id…'
            rules={[{ required: true }]}
            onChange={(value) =>
              setEditingRule((prev) => ({ ...(prev || {}), name: value }))
            }
          />

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.TextArea
                field='model_regex_text'
                label={t('')}
                extraText={t(
                  ' model ',
                )}
                placeholder={'^gpt-4o.*$\n^claude-3.*$…'}
                autosize={{ minRows: 4, maxRows: 10 }}
                rules={[{ required: true }]}
              />
            </Col>
            <Col xs={24} sm={12}>
              <Form.TextArea
                field='path_regex_text'
                label={t('')}
                extraText={t(
                  '',
                )}
                placeholder={'/v1/chat/completions\n/v1/responses…'}
                autosize={{ minRows: 4, maxRows: 10 }}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col xs={24} sm={12}>
              <Form.Switch
                field='skip_retry_on_failure'
                label={t('')}
              />
              <Text type='tertiary' size='small'>
                {t('')}
              </Text>
            </Col>
          </Row>

          <Collapse
            keepDOM
            activeKey={modalAdvancedActiveKey}
            onChange={(activeKey) => {
              const keys = Array.isArray(activeKey) ? activeKey : [activeKey];
              setModalAdvancedActiveKey(keys.filter(Boolean));
            }}
          >
            <Collapse.Panel header={t('')} itemKey='advanced'>
              <Row gutter={16}>
                <Col xs={24}>
                  <Form.TextArea
                    field='user_agent_include_text'
                    label={t('User-Agent include')}
                    extraText={
                      <Text type='tertiary' size='small'>
                        {t(
                          ' User-Agent',
                        )}
                        <br />
                        {t(
                          'solqora  User-Agent ',
                        )}
                        <br />
                        {t(
                          '/ User-Agent',
                        )}
                      </Text>
                    }
                    placeholder={'curl\nPostmanRuntime\nMyApp/…'}
                    autosize={{ minRows: 3, maxRows: 8 }}
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Input
                    field='value_regex'
                    label={t('Value ')}
                    placeholder='^[-0-9A-Za-z._:]{1,128}$'
                    extraText={t(
                      ' Key ',
                    )}
                  />
                </Col>
                <Col xs={24} sm={12}>
                  <Form.InputNumber
                    field='ttl_seconds'
                    label={t('TTL0 ')}
                    placeholder=' 600…'
                    min={0}
                    extraText={
                      <Text type='tertiary' size='small'>
                        {t('0  TTL')}
                        {effectiveDefaultTTLSeconds}
                        {t(' ')}
                      </Text>
                    }
                  />
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24}>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>{t('')}</Text>
                  </div>
                  <Text type='tertiary' size='small'>
                    {t(
                      '',
                    )}
                  </Text>
                  <div
                    style={{
                      marginTop: 8,
                      borderRadius: 10,
                      padding: 10,
                      background: 'var(--semi-color-fill-0)',
                      border: '1px solid var(--semi-color-border)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Tag color={paramTemplatePreviewMeta.tagColor}>
                        {paramTemplatePreviewMeta.tagLabel}
                      </Tag>
                      <Space>
                        <Button
                          size='small'
                          type='primary'
                          icon={<IconCode />}
                          onClick={() => setParamTemplateEditorVisible(true)}
                        >
                          {t('')}
                        </Button>
                        <Button size='small' onClick={formatParamTemplateDraft}>
                          {t('')}
                        </Button>
                        <Button
                          size='small'
                          type='tertiary'
                          onClick={() => updateParamTemplateDraft('')}
                        >
                          {t('')}
                        </Button>
                      </Space>
                    </div>
                    <pre
                      style={{
                        margin: 0,
                        maxHeight: 220,
                        overflow: 'auto',
                        fontSize: 12,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
                      {paramTemplatePreviewMeta.preview}
                    </pre>
                  </div>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Switch
                    field='include_using_group'
                    label={t('')}
                  />
                  <Text type='tertiary' size='small'>
                    {t(
                      'using_group  cache key',
                    )}
                  </Text>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Switch
                    field='include_model_name'
                    label={t('')}
                  />
                  <Text type='tertiary' size='small'>
                    {t(' cache key')}
                  </Text>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Switch
                    field='include_rule_name'
                    label={t('')}
                  />
                  <Text type='tertiary' size='small'>
                    {t(' cache key')}
                  </Text>
                </Col>
              </Row>
            </Collapse.Panel>
          </Collapse>

          <Divider style={{ marginTop: 12, marginBottom: 12 }} />
          <Space style={{ marginBottom: 10 }}>
            <Text>{t('Key ')}</Text>
            <Button icon={<IconPlus />} onClick={addKeySource}>
              {t(' Key ')}
            </Button>
          </Space>
          <Text type='tertiary' size='small'>
            {t(
              'context_int/context_string request_header gjson  JSON body  gjson path ',
            )}
          </Text>
          <div style={{ marginTop: 8, marginBottom: 8 }}>
            <Text type='tertiary' size='small'>
              {t(' Key context_*')}
            </Text>
            <div style={{ marginTop: 6 }}>
              {(CONTEXT_KEY_PRESETS || []).map((x) => (
                <Tag key={x.key} style={{ marginRight: 6, marginBottom: 6 }}>
                  {x.label}
                </Tag>
              ))}
            </div>
          </div>

          <Table
            columns={[
              {
                title: t(''),
                render: (_, __, idx) => (
                  <Select
                    style={{ width: 160 }}
                    optionList={KEY_SOURCE_TYPES}
                    value={(
                      editingRule?.key_sources?.[idx]?.type || 'gjson'
                    ).trim()}
                    aria-label={t('Key ')}
                    onChange={(value) => updateKeySource(idx, { type: value })}
                  />
                ),
              },
              {
                title: t('Key  Path'),
                render: (_, __, idx) => {
                  const src = normalizeKeySource(
                    editingRule?.key_sources?.[idx],
                  );
                  const isGjson = src.type === 'gjson';
                  return (
                    <Input
                      placeholder={
                        isGjson ? 'metadata.conversation_id' : 'X-Affinity-Key'
                      }
                      aria-label={t('Key  Path')}
                      value={isGjson ? src.path : src.key}
                      onChange={(value) =>
                        updateKeySource(
                          idx,
                          isGjson ? { path: value } : { key: value },
                        )
                      }
                    />
                  );
                },
              },
              {
                title: t(''),
                width: 90,
                render: (_, __, idx) => (
                  <Button
                    icon={<IconDelete />}
                    theme='borderless'
                    type='danger'
                    title={t(' Key ')}
                    aria-label={t(' Key ')}
                    onClick={() => removeKeySource(idx)}
                  />
                ),
              },
            ]}
            dataSource={(editingRule?.key_sources || []).map((x, idx) => ({
              id: idx,
              ...x,
            }))}
            rowKey='id'
            pagination={false}
            size='small'
          />
        </Form>
      </Modal>

      <ParamOverrideEditorModal
        visible={paramTemplateEditorVisible}
        value={paramTemplateDraft || ''}
        onSave={(nextValue) => {
          updateParamTemplateDraft(nextValue || '');
          setParamTemplateEditorVisible(false);
        }}
        onCancel={() => setParamTemplateEditorVisible(false)}
      />
    </>
  );
}

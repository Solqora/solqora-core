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
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  verifyJSON,
} from '../../../../helpers';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import { CHANNEL_OPTIONS, MODEL_FETCHABLE_CHANNEL_TYPES } from '../../../../constants';
import {
  SideSheet,
  Space,
  Spin,
  Button,
  Typography,
  Checkbox,
  Banner,
  Modal,
  ImagePreview,
  Card,
  Tag,
  Avatar,
  Form,
  Row,
  Col,
  Highlight,
  Input,
  Tooltip,
  Collapse,
  Dropdown,
} from '@douyinfe/semi-ui';
import {
  getChannelModels,
  copy,
  getChannelIcon,
  getModelCategories,
  selectFilter,
} from '../../../../helpers';
import ModelSelectModal from './ModelSelectModal';
import SingleModelSelectModal from './SingleModelSelectModal';
import OllamaModelModal from './OllamaModelModal';
import ParamOverrideEditorModal from './ParamOverrideEditorModal';
import JSONEditor from '../../../common/ui/JSONEditor';
import SecureVerificationModal from '../../../common/modals/SecureVerificationModal';
import StatusCodeRiskGuardModal from './StatusCodeRiskGuardModal';
import ChannelKeyDisplay from '../../../common/ui/ChannelKeyDisplay';
import { useSecureVerification } from '../../../../hooks/common/useSecureVerification';
import { parseChannelConnectionString } from '../../../../helpers/token';
import { createApiCalls } from '../../../../services/secureVerification';
import {
  collectInvalidStatusCodeEntries,
  collectNewDisallowedStatusCodeRedirects,
} from './statusCodeRiskGuard';
import {
  IconSave,
  IconClose,
  IconServer,
  IconSetting,
  IconCode,
  IconCopy,
  IconGlobe,
  IconBolt,
  IconSearch,
  IconChevronDown,
} from '@douyinfe/semi-icons';

const { Text, Title } = Typography;

const MODEL_MAPPING_EXAMPLE = {
  'gpt-3.5-turbo': 'gpt-3.5-turbo-0125',
};

const STATUS_CODE_MAPPING_EXAMPLE = {
  400: '500',
};

const REGION_EXAMPLE = {
  default: 'global',
  'gemini-1.5-pro-002': 'europe-west2',
  'gemini-1.5-flash-002': 'europe-west2',
  'claude-3-5-sonnet-20240620': 'europe-west1',
};
const UPSTREAM_DETECTED_MODEL_PREVIEW_LIMIT = 8;
const ADVANCED_SETTINGS_EXPANDED_KEY = 'channel-advanced-settings-expanded';

const PARAM_OVERRIDE_LEGACY_TEMPLATE = {
  temperature: 0,
};

const PARAM_OVERRIDE_OPERATIONS_TEMPLATE = {
  operations: [
    {
      path: 'temperature',
      mode: 'set',
      value: 0.7,
      conditions: [
        {
          path: 'model',
          mode: 'prefix',
          value: 'openai/',
        },
      ],
      logic: 'AND',
    },
  ],
};

const DEPRECATED_DOUBAO_CODING_PLAN_BASE_URL = 'doubao-coding-plan';

// 
const MODEL_FETCHABLE_TYPES = new Set([
  1, 4, 14, 34, 17, 26, 27, 24, 47, 25, 20, 23, 31, 40, 42, 48, 43,
]);

function type2secretPrompt(type) {
  // inputs.type === 15 ? 'APIKey|SecretKey' : (inputs.type === 18 ? 'APPID|APISecret|APIKey' : '')
  switch (type) {
    case 15:
      return 'APIKey|SecretKey';
    case 18:
      return 'APPID|APISecret|APIKey';
    case 22:
      return 'APIKey-AppIdfastgpt-0sp2gtvfdgyi4k30jwlgwf1i-64f335d84283f05518e9e041';
    case 23:
      return 'AppId|SecretId|SecretKey';
    case 33:
      return 'Ak|Sk|Region';
    case 45:
      return ', AppId|AccessToken';
    case 50:
      return ': AccessKey|SecretKey, SolqoraApiKey';
    case 51:
      return ': AccessKey|SecretAccessKey';
    case 57:
      return ' JSON  OAuth  access_token  account_id';
    default:
      return '';
  }
}

const EditChannelModal = (props) => {
  const { t } = useTranslation();
  const channelId = props.editingChannel.id;
  const isEdit = channelId !== undefined;
  const [loading, setLoading] = useState(isEdit);
  const isMobile = useIsMobile();
  const handleCancel = () => {
    props.handleClose();
  };
  const originInputs = {
    name: '',
    type: 1,
    key: '',
    openai_organization: '',
    max_input_tokens: 0,
    base_url: '',
    other: '',
    model_mapping: '',
    param_override: '',
    status_code_mapping: '',
    models: [],
    auto_ban: 1,
    test_model: '',
    groups: ['default'],
    priority: 0,
    weight: 0,
    tag: '',
    multi_key_mode: 'random',
    // 
    force_format: false,
    thinking_to_content: false,
    proxy: '',
    pass_through_body_enabled: false,
    system_prompt: '',
    system_prompt_override: false,
    settings: '',
    //  Vertex:  settings.vertex_key_type
    vertex_key_type: 'json',
    //  AWS:  settings.aws_key_type  settings.aws_region
    aws_key_type: 'ak_sk',
    // 
    is_enterprise_account: false,
    // 
    allow_service_tier: false,
    disable_store: false, // false = 
    allow_safety_identifier: false,
    allow_include_obfuscation: false,
    allow_inference_geo: false,
    allow_speed: false,
    claude_beta_query: false,
    upstream_model_update_check_enabled: false,
    upstream_model_update_auto_sync_enabled: false,
    upstream_model_update_last_check_time: 0,
    upstream_model_update_last_detected_models: [],
    upstream_model_update_ignored_models: '',
  };
  const [batch, setBatch] = useState(false);
  const [multiToSingle, setMultiToSingle] = useState(false);
  const [multiKeyMode, setMultiKeyMode] = useState('random');
  const [autoBan, setAutoBan] = useState(true);
  const [inputs, setInputs] = useState(originInputs);
  const [originModelOptions, setOriginModelOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [basicModels, setBasicModels] = useState([]);
  const [fullModels, setFullModels] = useState([]);
  const [modelGroups, setModelGroups] = useState([]);
  const [customModel, setCustomModel] = useState('');
  const [modelSearchValue, setModelSearchValue] = useState('');
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [fetchedModels, setFetchedModels] = useState([]);
  const [modelMappingValueModalVisible, setModelMappingValueModalVisible] =
    useState(false);
  const [modelMappingValueModalModels, setModelMappingValueModalModels] =
    useState([]);
  const [modelMappingValueKey, setModelMappingValueKey] = useState('');
  const [modelMappingValueSelected, setModelMappingValueSelected] =
    useState('');
  const [ollamaModalVisible, setOllamaModalVisible] = useState(false);
  const formApiRef = useRef(null);
  const [vertexKeys, setVertexKeys] = useState([]);
  const [vertexFileList, setVertexFileList] = useState([]);
  const vertexErroredNames = useRef(new Set()); // 
  const [isMultiKeyChannel, setIsMultiKeyChannel] = useState(false);
  const [channelSearchValue, setChannelSearchValue] = useState('');
  const [useManualInput, setUseManualInput] = useState(false); // 
  const [keyMode, setKeyMode] = useState('append'); // replace append
  const [isEnterpriseAccount, setIsEnterpriseAccount] = useState(false); // 
  const [doubaoApiEditUnlocked, setDoubaoApiEditUnlocked] = useState(false); //  API 
  const redirectModelList = useMemo(() => {
    const mapping = inputs.model_mapping;
    if (typeof mapping !== 'string') return [];
    const trimmed = mapping.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return [];
      }
      const values = Object.values(parsed)
        .map((value) => (typeof value === 'string' ? value.trim() : undefined))
        .filter((value) => value);
      return Array.from(new Set(values));
    } catch (error) {
      return [];
    }
  }, [inputs.model_mapping]);
  const redirectModelKeyList = useMemo(() => {
    const mapping = inputs.model_mapping;
    if (typeof mapping !== 'string') return [];
    const trimmed = mapping.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return [];
      }
      const keys = Object.keys(parsed)
        .map((key) => key.trim())
        .filter((key) => key);
      return Array.from(new Set(keys));
    } catch (error) {
      return [];
    }
  }, [inputs.model_mapping]);
  const upstreamDetectedModels = useMemo(
    () =>
      Array.from(
        new Set(
          (inputs.upstream_model_update_last_detected_models || [])
            .map((model) => String(model || '').trim())
            .filter(Boolean),
        ),
      ),
    [inputs.upstream_model_update_last_detected_models],
  );
  const upstreamDetectedModelsPreview = useMemo(
    () => upstreamDetectedModels.slice(0, UPSTREAM_DETECTED_MODEL_PREVIEW_LIMIT),
    [upstreamDetectedModels],
  );
  const upstreamDetectedModelsOmittedCount =
    upstreamDetectedModels.length - upstreamDetectedModelsPreview.length;
  const modelSearchMatchedCount = useMemo(() => {
    const keyword = modelSearchValue.trim();
    if (!keyword) {
      return modelOptions.length;
    }
    return modelOptions.reduce(
      (count, option) => count + (selectFilter(keyword, option) ? 1 : 0),
      0,
    );
  }, [modelOptions, modelSearchValue]);
  const modelSearchHintText = useMemo(() => {
    const keyword = modelSearchValue.trim();
    if (!keyword || modelSearchMatchedCount !== 0) {
      return '';
    }
    return t('{{name}}', {
      name: keyword,
    });
  }, [modelSearchMatchedCount, modelSearchValue, t]);
  const paramOverrideMeta = useMemo(() => {
    const raw =
      typeof inputs.param_override === 'string'
        ? inputs.param_override.trim()
        : '';
    if (!raw) {
      return {
        tagLabel: t(''),
        tagColor: 'grey',
        preview: t(
          ' stream ',
        ),
      };
    }
    if (!verifyJSON(raw)) {
      return {
        tagLabel: t('JSON'),
        tagColor: 'red',
        preview: raw,
      };
    }
    try {
      const parsed = JSON.parse(raw);
      const pretty = JSON.stringify(parsed, null, 2);
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        Array.isArray(parsed.operations)
      ) {
        return {
          tagLabel: `${t('')} (${parsed.operations.length})`,
          tagColor: 'cyan',
          preview: pretty,
        };
      }
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          tagLabel: `${t('')} (${Object.keys(parsed).length})`,
          tagColor: 'blue',
          preview: pretty,
        };
      }
      return {
        tagLabel: t(' JSON'),
        tagColor: 'orange',
        preview: pretty,
      };
    } catch (error) {
      return {
        tagLabel: t('JSON'),
        tagColor: 'red',
        preview: raw,
      };
    }
  }, [inputs.param_override, t]);
  const [isIonetChannel, setIsIonetChannel] = useState(false);
  const [ionetMetadata, setIonetMetadata] = useState(null);
  const [codexCredentialRefreshing, setCodexCredentialRefreshing] =
    useState(false);
  const [paramOverrideEditorVisible, setParamOverrideEditorVisible] =
    useState(false);

  // 
  const [keyDisplayState, setKeyDisplayState] = useState({
    showModal: false,
    keyData: '',
  });

  // 2FATwoFactorAuthModal
  const [show2FAVerifyModal, setShow2FAVerifyModal] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');

  useEffect(() => {
    if (!isEdit) {
      setIsIonetChannel(false);
      setIonetMetadata(null);
    }
  }, [isEdit]);

  const handleOpenIonetDeployment = () => {
    if (!ionetMetadata?.deployment_id) {
      return;
    }
    const targetUrl = `/console/deployment?deployment_id=${ionetMetadata.deployment_id}`;
    window.open(targetUrl, '_blank', 'noopener');
  };
  const [verifyLoading, setVerifyLoading] = useState(false);
  const statusCodeRiskConfirmResolverRef = useRef(null);
  const [statusCodeRiskConfirmVisible, setStatusCodeRiskConfirmVisible] =
    useState(false);
  const [statusCodeRiskDetailItems, setStatusCodeRiskDetailItems] = useState(
    [],
  );

  // 
  const [clipboardConfig, setClipboardConfig] = useState(null);

  // 
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const toggleAdvancedSettings = (open) => {
    setAdvancedSettingsOpen(open);
    localStorage.setItem(ADVANCED_SETTINGS_EXPANDED_KEY, String(open));
  };
  const formContainerRef = useRef(null);
  const doubaoApiClickCountRef = useRef(0);
  const initialBaseUrlRef = useRef('');
  const initialModelsRef = useRef([]);
  const initialModelMappingRef = useRef('');
  const initialStatusCodeMappingRef = useRef('');
  const doubaoCodingPlanDeprecationMessage =
    'Doubao Coding Plan Coding  AI Coding  API  AI Coding  Base URL  API Key ';
  const canKeepDeprecatedDoubaoCodingPlan =
    initialBaseUrlRef.current === DEPRECATED_DOUBAO_CODING_PLAN_BASE_URL;
  const doubaoCodingPlanOptionLabel = (
    <Tooltip content={doubaoCodingPlanDeprecationMessage} position='left'>
      <span className='inline-flex items-center gap-2'>
        <span>Doubao Coding Plan</span>
      </span>
    </Tooltip>
  );

  // 2FA
  const updateTwoFAState = (updates) => {
    setTwoFAState((prev) => ({ ...prev, ...updates }));
  };
  //  Hook
  const {
    isModalVisible,
    verificationMethods,
    verificationState,
    withVerification,
    executeVerification,
    cancelVerification,
    setVerificationCode,
    switchVerificationMethod,
  } = useSecureVerification({
    onSuccess: (result) => {
      // 
      console.log('Verification success, result:', result);
      if (result && result.success && result.data?.key) {
        showSuccess(t(''));
        setKeyDisplayState({
          showModal: true,
          keyData: result.data.key,
        });
      } else if (result && result.key) {
        //  key data 
        showSuccess(t(''));
        setKeyDisplayState({
          showModal: true,
          keyData: result.key,
        });
      }
    },
  });

  // 
  const resetKeyDisplayState = () => {
    setKeyDisplayState({
      showModal: false,
      keyData: '',
    });
  };

  // 2FA
  const reset2FAVerifyState = () => {
    setShow2FAVerifyModal(false);
    setVerifyCode('');
    setVerifyLoading(false);
  };

  const handleApiConfigSecretClick = () => {
    if (inputs.type !== 45) return;
    const next = doubaoApiClickCountRef.current + 1;
    doubaoApiClickCountRef.current = next;
    if (next >= 10) {
      setDoubaoApiEditUnlocked((unlocked) => {
        if (!unlocked) {
          showInfo(t(' API '));
        }
        return true;
      });
    }
  };

  // 
  const [channelSettings, setChannelSettings] = useState({
    force_format: false,
    thinking_to_content: false,
    proxy: '',
    pass_through_body_enabled: false,
    system_prompt: '',
  });
  const showApiConfigCard = true; //  API 
  const getInitValues = () => ({ ...originInputs });

  // 
  const handleChannelSettingsChange = (key, value) => {
    // 
    setChannelSettings((prev) => ({ ...prev, [key]: value }));

    // 
    if (formApiRef.current) {
      formApiRef.current.setValue(key, value);
    }

    // inputs
    setInputs((prev) => ({ ...prev, [key]: value }));

    // setting JSON
    const newSettings = { ...channelSettings, [key]: value };
    const settingsJson = JSON.stringify(newSettings);
    handleInputChange('setting', settingsJson);
  };

  const handleChannelOtherSettingsChange = (key, value) => {
    // 
    setChannelSettings((prev) => ({ ...prev, [key]: value }));

    // 
    if (formApiRef.current) {
      formApiRef.current.setValue(key, value);
    }

    // inputs
    setInputs((prev) => ({ ...prev, [key]: value }));

    // settingsjson{"azure_responses_version": "preview"}
    let settings = {};
    if (inputs.settings) {
      try {
        settings = JSON.parse(inputs.settings);
      } catch (error) {
        console.error(':', error);
      }
    }
    settings[key] = value;
    const settingsJson = JSON.stringify(settings);
    handleInputChange('settings', settingsJson);
  };

  const applyClipboardConfig = (config) => {
    if (!config) return;
    setInputs((prev) => ({
      ...prev,
      key: config.key,
      base_url: config.url,
    }));
    if (formApiRef.current) {
      formApiRef.current.setValue('key', config.key);
      formApiRef.current.setValue('base_url', config.url);
    }
    setClipboardConfig(null);
    showSuccess(t(''));
  };

  const pasteFromClipboard = async () => {
    if (!navigator?.clipboard?.readText) {
      showError(t(''));
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseChannelConnectionString(text);
      if (parsed) {
        applyClipboardConfig(parsed);
      } else {
        showInfo(t(''));
      }
    } catch {
      showError(t(''));
    }
  };

  const isIonetLocked = isIonetChannel && isEdit;

  const handleInputChange = (name, value) => {
    if (
      isIonetChannel &&
      isEdit &&
      ['type', 'key', 'base_url'].includes(name)
    ) {
      return;
    }
    if (formApiRef.current) {
      formApiRef.current.setValue(name, value);
    }
    if (name === 'models' && Array.isArray(value)) {
      value = Array.from(new Set(value.map((m) => (m || '').trim())));
    }

    if (name === 'base_url' && value.endsWith('/v1')) {
      Modal.confirm({
        title: '',
        content:
          '/v1Solqora',
        onOk: () => {
          setInputs((inputs) => ({ ...inputs, [name]: value }));
        },
      });
      return;
    }
    setInputs((inputs) => ({ ...inputs, [name]: value }));
    if (name === 'type') {
      let localModels = [];
      switch (value) {
        case 2:
          localModels = [
            'mj_imagine',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_uploads',
          ];
          break;
        case 5:
          localModels = [
            'swap_face',
            'mj_imagine',
            'mj_video',
            'mj_edits',
            'mj_variation',
            'mj_reroll',
            'mj_blend',
            'mj_upscale',
            'mj_describe',
            'mj_zoom',
            'mj_shorten',
            'mj_modal',
            'mj_inpaint',
            'mj_custom_zoom',
            'mj_high_variation',
            'mj_low_variation',
            'mj_pan',
            'mj_uploads',
          ];
          break;
        case 36:
          localModels = ['suno_music', 'suno_lyrics'];
          break;
        case 45:
          localModels = getChannelModels(value);
          setInputs((prevInputs) => ({
            ...prevInputs,
            base_url: 'https://ark.cn-beijing.volces.com',
          }));
          break;
        default:
          localModels = getChannelModels(value);
          break;
      }
      if (inputs.models.length === 0) {
        setInputs((inputs) => ({ ...inputs, models: localModels }));
      }
      setBasicModels(localModels);

      // 
      setUseManualInput(false);

      if (value === 57) {
        setBatch(false);
        setMultiToSingle(false);
        setMultiKeyMode('random');
        setVertexKeys([]);
        setVertexFileList([]);
        if (formApiRef.current) {
          formApiRef.current.setValue('vertex_files', []);
        }
        setInputs((prev) => ({ ...prev, vertex_files: [] }));
      }
    }
    //setAutoBan
  };

  const formatJsonField = (fieldName) => {
    const rawValue = (inputs?.[fieldName] ?? '').trim();
    if (!rawValue) return;

    try {
      const parsed = JSON.parse(rawValue);
      handleInputChange(fieldName, JSON.stringify(parsed, null, 2));
    } catch (error) {
      showError(`${t('JSON')}: ${error.message}`);
    }
  };

  const formatUnixTime = (timestamp) => {
    const value = Number(timestamp || 0);
    if (!value) {
      return t('');
    }
    return new Date(value * 1000).toLocaleString();
  };

  const copyParamOverrideJson = async () => {
    const raw =
      typeof inputs.param_override === 'string'
        ? inputs.param_override.trim()
        : '';
    if (!raw) {
      showInfo(t(' JSON'));
      return;
    }

    let content = raw;
    if (verifyJSON(raw)) {
      try {
        content = JSON.stringify(JSON.parse(raw), null, 2);
      } catch (error) {
        content = raw;
      }
    }

    const ok = await copy(content);
    if (ok) {
      showSuccess(t(' JSON '));
    } else {
      showError(t(''));
    }
  };

  const parseParamOverrideInput = () => {
    const raw =
      typeof inputs.param_override === 'string'
        ? inputs.param_override.trim()
        : '';
    if (!raw) return null;
    if (!verifyJSON(raw)) {
      throw new Error(t(' JSON'));
    }
    return JSON.parse(raw);
  };

  const applyParamOverrideTemplate = (
    templateType = 'operations',
    applyMode = 'fill',
  ) => {
    try {
      const parsedCurrent = parseParamOverrideInput();
      if (templateType === 'legacy') {
        if (applyMode === 'fill') {
          handleInputChange(
            'param_override',
            JSON.stringify(PARAM_OVERRIDE_LEGACY_TEMPLATE, null, 2),
          );
          return;
        }
        const currentLegacy =
          parsedCurrent &&
          typeof parsedCurrent === 'object' &&
          !Array.isArray(parsedCurrent) &&
          !Array.isArray(parsedCurrent.operations)
            ? parsedCurrent
            : {};
        const merged = {
          ...PARAM_OVERRIDE_LEGACY_TEMPLATE,
          ...currentLegacy,
        };
        handleInputChange('param_override', JSON.stringify(merged, null, 2));
        return;
      }

      if (applyMode === 'fill') {
        handleInputChange(
          'param_override',
          JSON.stringify(PARAM_OVERRIDE_OPERATIONS_TEMPLATE, null, 2),
        );
        return;
      }
      const currentOperations =
        parsedCurrent &&
        typeof parsedCurrent === 'object' &&
        !Array.isArray(parsedCurrent) &&
        Array.isArray(parsedCurrent.operations)
          ? parsedCurrent.operations
          : [];
      const merged = {
        operations: [
          ...currentOperations,
          ...PARAM_OVERRIDE_OPERATIONS_TEMPLATE.operations,
        ],
      };
      handleInputChange('param_override', JSON.stringify(merged, null, 2));
    } catch (error) {
      showError(error.message || t(''));
    }
  };

  const clearParamOverride = () => {
    handleInputChange('param_override', '');
  };

  const loadChannel = async () => {
    setLoading(true);
    let res = await API.get(`/api/channel/${channelId}`);
    if (res === undefined) {
      return;
    }
    const { success, message, data } = res.data;
    if (success) {
      if (data.models === '') {
        data.models = [];
      } else {
        data.models = data.models.split(',');
      }
      if (data.group === '') {
        data.groups = [];
      } else {
        data.groups = data.group.split(',');
      }
      if (data.model_mapping !== '') {
        data.model_mapping = JSON.stringify(
          JSON.parse(data.model_mapping),
          null,
          2,
        );
      }
      const chInfo = data.channel_info || {};
      const isMulti = chInfo.is_multi_key === true;
      setIsMultiKeyChannel(isMulti);
      if (isMulti) {
        setBatch(true);
        setMultiToSingle(true);
        const modeVal = chInfo.multi_key_mode || 'random';
        setMultiKeyMode(modeVal);
        data.multi_key_mode = modeVal;
      } else {
        setBatch(false);
        setMultiToSingle(false);
      }
      // data
      if (data.setting) {
        try {
          const parsedSettings = JSON.parse(data.setting);
          data.force_format = parsedSettings.force_format || false;
          data.thinking_to_content =
            parsedSettings.thinking_to_content || false;
          data.proxy = parsedSettings.proxy || '';
          data.pass_through_body_enabled =
            parsedSettings.pass_through_body_enabled || false;
          data.system_prompt = parsedSettings.system_prompt || '';
          data.system_prompt_override =
            parsedSettings.system_prompt_override || false;
        } catch (error) {
          console.error(':', error);
          data.force_format = false;
          data.thinking_to_content = false;
          data.proxy = '';
          data.pass_through_body_enabled = false;
          data.system_prompt = '';
          data.system_prompt_override = false;
        }
      } else {
        data.force_format = false;
        data.thinking_to_content = false;
        data.proxy = '';
        data.pass_through_body_enabled = false;
        data.system_prompt = '';
        data.system_prompt_override = false;
      }

      if (data.settings) {
        try {
          const parsedSettings = JSON.parse(data.settings);
          data.azure_responses_version =
            parsedSettings.azure_responses_version || '';
          //  Vertex 
          data.vertex_key_type = parsedSettings.vertex_key_type || 'json';
          //  AWS 
          data.aws_key_type = parsedSettings.aws_key_type || 'ak_sk';
          // 
          data.is_enterprise_account =
            parsedSettings.openrouter_enterprise === true;
          // 
          data.allow_service_tier = parsedSettings.allow_service_tier || false;
          data.disable_store = parsedSettings.disable_store || false;
          data.allow_safety_identifier =
            parsedSettings.allow_safety_identifier || false;
          data.allow_include_obfuscation =
            parsedSettings.allow_include_obfuscation || false;
          data.allow_inference_geo =
            parsedSettings.allow_inference_geo || false;
          data.allow_speed = parsedSettings.allow_speed || false;
          data.claude_beta_query = parsedSettings.claude_beta_query || false;
          data.upstream_model_update_check_enabled =
            parsedSettings.upstream_model_update_check_enabled === true;
          data.upstream_model_update_auto_sync_enabled =
            parsedSettings.upstream_model_update_auto_sync_enabled === true;
          data.upstream_model_update_last_check_time =
            Number(parsedSettings.upstream_model_update_last_check_time) || 0;
          data.upstream_model_update_last_detected_models = Array.isArray(
            parsedSettings.upstream_model_update_last_detected_models,
          )
            ? parsedSettings.upstream_model_update_last_detected_models
            : [];
          data.upstream_model_update_ignored_models = Array.isArray(
            parsedSettings.upstream_model_update_ignored_models,
          )
            ? parsedSettings.upstream_model_update_ignored_models.join(',')
            : '';
        } catch (error) {
          console.error(':', error);
          data.azure_responses_version = '';
          data.region = '';
          data.vertex_key_type = 'json';
          data.aws_key_type = 'ak_sk';
          data.is_enterprise_account = false;
          data.allow_service_tier = false;
          data.disable_store = false;
          data.allow_safety_identifier = false;
          data.allow_include_obfuscation = false;
          data.allow_inference_geo = false;
          data.allow_speed = false;
          data.claude_beta_query = false;
          data.upstream_model_update_check_enabled = false;
          data.upstream_model_update_auto_sync_enabled = false;
          data.upstream_model_update_last_check_time = 0;
          data.upstream_model_update_last_detected_models = [];
          data.upstream_model_update_ignored_models = '';
        }
      } else {
        //  settings  json 
        data.vertex_key_type = 'json';
        data.aws_key_type = 'ak_sk';
        data.is_enterprise_account = false;
        data.allow_service_tier = false;
        data.disable_store = false;
        data.allow_safety_identifier = false;
        data.allow_include_obfuscation = false;
        data.allow_inference_geo = false;
        data.allow_speed = false;
        data.claude_beta_query = false;
        data.upstream_model_update_check_enabled = false;
        data.upstream_model_update_auto_sync_enabled = false;
        data.upstream_model_update_last_check_time = 0;
        data.upstream_model_update_last_detected_models = [];
        data.upstream_model_update_ignored_models = '';
      }

      if (
        data.type === 45 &&
        (!data.base_url ||
          (typeof data.base_url === 'string' && data.base_url.trim() === ''))
      ) {
        data.base_url = 'https://ark.cn-beijing.volces.com';
      }

      initialBaseUrlRef.current = data.base_url || '';
      setInputs(data);
      if (formApiRef.current) {
        formApiRef.current.setValues(data);
      }
      if (data.auto_ban === 0) {
        setAutoBan(false);
      } else {
        setAutoBan(true);
      }
      // 
      setIsEnterpriseAccount(data.is_enterprise_account || false);
      setBasicModels(getChannelModels(data.type));
      // channelSettings
      setChannelSettings({
        force_format: data.force_format,
        thinking_to_content: data.thinking_to_content,
        proxy: data.proxy,
        pass_through_body_enabled: data.pass_through_body_enabled,
        system_prompt: data.system_prompt,
        system_prompt_override: data.system_prompt_override || false,
      });
      initialModelsRef.current = (data.models || [])
        .map((model) => (model || '').trim())
        .filter(Boolean);
      initialModelMappingRef.current = data.model_mapping || '';
      initialStatusCodeMappingRef.current = data.status_code_mapping || '';

      let parsedIonet = null;
      if (data.other_info) {
        try {
          const maybeMeta = JSON.parse(data.other_info);
          if (
            maybeMeta &&
            typeof maybeMeta === 'object' &&
            maybeMeta.source === 'ionet'
          ) {
            parsedIonet = maybeMeta;
          }
        } catch (error) {
          // ignore parse error
        }
      }
      const managedByIonet = !!parsedIonet;
      setIsIonetChannel(managedByIonet);
      setIonetMetadata(parsedIonet);

      // Smart expand: auto-open advanced settings if any advanced field has a value
      const hasAdvancedValues =
        (data.model_mapping && data.model_mapping.trim()) ||
        (data.param_override && data.param_override.trim()) ||
        (data.status_code_mapping && data.status_code_mapping.trim()) ||
        (data.header_override && data.header_override.trim()) ||
        (data.tag && data.tag.trim()) ||
        (data.remark && data.remark.trim()) ||
        (data.priority && data.priority !== 0) ||
        (data.weight && data.weight !== 0) ||
        (data.proxy && data.proxy.trim()) ||
        (data.system_prompt && data.system_prompt.trim()) ||
        data.thinking_to_content ||
        data.pass_through_body_enabled ||
        data.force_format ||
        data.claude_beta_query ||
        data.system_prompt_override;
      if (hasAdvancedValues) {
        setAdvancedSettingsOpen(true);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const fetchUpstreamModelList = async (name, options = {}) => {
    const silent = !!options.silent;
    // if (inputs['type'] !== 1) {
    //   showError(t(' OpenAI '));
    //   return;
    // }
    setLoading(true);
    const models = [];
    let err = false;

    if (isEdit) {
      //  channelId 
      const res = await API.get('/api/channel/fetch_models/' + channelId, {
        skipErrorHandler: true,
      });
      if (res && res.data && res.data.success) {
        models.push(...res.data.data);
      } else {
        err = true;
      }
    } else {
      // 
      if (!inputs?.['key']) {
        showError(t(''));
        err = true;
      } else {
        try {
          const res = await API.post(
            '/api/channel/fetch_models',
            {
              base_url: inputs['base_url'],
              type: inputs['type'],
              key: inputs['key'],
            },
            { skipErrorHandler: true },
          );

          if (res && res.data && res.data.success) {
            models.push(...res.data.data);
          } else {
            err = true;
          }
        } catch (error) {
          console.error('Error fetching models:', error);
          err = true;
        }
      }
    }

    if (!err) {
      const uniqueModels = Array.from(new Set(models));
      setFetchedModels(uniqueModels);
      if (!silent) {
        setModelModalVisible(true);
      }
      setLoading(false);
      return uniqueModels;
    } else {
      showError(t(''));
    }
    setLoading(false);
    return null;
  };

  const openModelMappingValueModal = async ({ pairKey, value }) => {
    const mappingKey = String(pairKey ?? '').trim();
    if (!mappingKey) return;

    if (!MODEL_FETCHABLE_CHANNEL_TYPES.has(inputs.type)) {
      return;
    }

    let modelsToUse = fetchedModels;
    if (!Array.isArray(modelsToUse) || modelsToUse.length === 0) {
      const fetched = await fetchUpstreamModelList('models', { silent: true });
      if (Array.isArray(fetched)) {
        modelsToUse = fetched;
      }
    }

    if (!Array.isArray(modelsToUse) || modelsToUse.length === 0) {
      showInfo(t(''));
      return;
    }

    const normalizedModelsToUse = Array.from(
      new Set(
        modelsToUse.map((model) => String(model ?? '').trim()).filter(Boolean),
      ),
    );
    const currentValue = String(value ?? '').trim();

    setModelMappingValueModalModels(normalizedModelsToUse);
    setModelMappingValueKey(mappingKey);
    setModelMappingValueSelected(
      normalizedModelsToUse.includes(currentValue) ? currentValue : '',
    );
    setModelMappingValueModalVisible(true);
  };

  const fetchModels = async () => {
    try {
      let res = await API.get(`/api/channel/models`);
      const localModelOptions = res.data.data.map((model) => {
        const id = (model.id || '').trim();
        return {
          key: id,
          label: id,
          value: id,
        };
      });
      setOriginModelOptions(localModelOptions);
      setFullModels(res.data.data.map((model) => model.id));
      setBasicModels(
        res.data.data
          .filter((model) => {
            return model.id.startsWith('gpt-') || model.id.startsWith('text-');
          })
          .map((model) => model.id),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) {
        return;
      }
      setGroupOptions(
        res.data.data.map((group) => ({
          label: group,
          value: group,
        })),
      );
    } catch (error) {
      showError(error.message);
    }
  };

  const fetchModelGroups = async () => {
    try {
      const res = await API.get('/api/prefill_group?type=model');
      if (res?.data?.success) {
        setModelGroups(res.data.data || []);
      }
    } catch (error) {
      // ignore
    }
  };

  // 
  const handleShow2FAModal = async () => {
    try {
      //  withVerification 
      const result = await withVerification(
        createApiCalls.viewChannelKey(channelId),
        {
          title: t(''),
          description: t(''),
          preferredMethod: 'passkey', //  Passkey
        },
      );

      // 
      if (result && result.success && result.data?.key) {
        showSuccess(t(''));
        setKeyDisplayState({
          showModal: true,
          keyData: result.data.key,
        });
      }
    } catch (error) {
      console.error('Failed to view channel key:', error);
      showError(error.message || t(''));
    }
  };

  const handleRefreshCodexCredential = async () => {
    if (!isEdit) return;

    setCodexCredentialRefreshing(true);
    try {
      const res = await API.post(
        `/api/channel/${channelId}/codex/refresh`,
        {},
        { skipErrorHandler: true },
      );
      if (!res?.data?.success) {
        throw new Error(res?.data?.message || 'Failed to refresh credential');
      }
      showSuccess(t(''));
    } catch (error) {
      showError(error.message || t(''));
    } finally {
      setCodexCredentialRefreshing(false);
    }
  };

  useEffect(() => {
    if (inputs.type !== 45) {
      doubaoApiClickCountRef.current = 0;
      setDoubaoApiEditUnlocked(false);
    }
  }, [inputs.type]);

  useEffect(() => {
    const modelMap = new Map();

    originModelOptions.forEach((option) => {
      const v = (option.value || '').trim();
      if (!modelMap.has(v)) {
        modelMap.set(v, option);
      }
    });

    inputs.models.forEach((model) => {
      const v = (model || '').trim();
      if (!modelMap.has(v)) {
        modelMap.set(v, {
          key: v,
          label: v,
          value: v,
        });
      }
    });

    const categories = getModelCategories(t);
    const optionsWithIcon = Array.from(modelMap.values()).map((opt) => {
      const modelName = opt.value;
      let icon = null;
      for (const [key, category] of Object.entries(categories)) {
        if (key !== 'all' && category.filter({ model_name: modelName })) {
          icon = category.icon;
          break;
        }
      }
      return {
        ...opt,
        label: (
          <span className='flex items-center gap-1'>
            {icon}
            {modelName}
          </span>
        ),
      };
    });

    setModelOptions(optionsWithIcon);
  }, [originModelOptions, inputs.models, t]);

  useEffect(() => {
    fetchModels().then();
    fetchGroups().then();
    if (!isEdit) {
      initialBaseUrlRef.current = '';
      setInputs(originInputs);
      if (formApiRef.current) {
        formApiRef.current.setValues(originInputs);
      }
      let localModels = getChannelModels(inputs.type);
      setBasicModels(localModels);
      setInputs((inputs) => ({ ...inputs, models: localModels }));
    }
  }, [props.editingChannel.id]);

  useEffect(() => {
    if (formApiRef.current) {
      formApiRef.current.setValues(inputs);
    }
  }, [inputs]);

  useEffect(() => {
    setModelSearchValue('');
    if (props.visible) {
      if (isEdit) {
        loadChannel();
      } else {
        formApiRef.current?.setValues(getInitValues());
        try {
          navigator?.clipboard?.readText()?.then((text) => {
            const parsed = parseChannelConnectionString(text);
            if (parsed) {
              setClipboardConfig(parsed);
            }
          }).catch(() => {});
        } catch {}
      }
      fetchModelGroups();
      // 
      setUseManualInput(false);
      // 
      setAdvancedSettingsOpen(
        isEdit && localStorage.getItem(ADVANCED_SETTINGS_EXPANDED_KEY) === 'true'
      );
    } else {
      // 
      resetModalState();
    }
  }, [props.visible, channelId]);

  useEffect(() => {
    if (!isEdit) {
      initialModelsRef.current = [];
      initialModelMappingRef.current = '';
      initialStatusCodeMappingRef.current = '';
    }
  }, [isEdit, props.visible]);

  useEffect(() => {
    return () => {
      if (statusCodeRiskConfirmResolverRef.current) {
        statusCodeRiskConfirmResolverRef.current(false);
        statusCodeRiskConfirmResolverRef.current = null;
      }
    };
  }, []);

  // 
  const resetModalState = () => {
    resolveStatusCodeRiskConfirm(false);
    formApiRef.current?.reset();
    // 
    setChannelSettings({
      force_format: false,
      thinking_to_content: false,
      proxy: '',
      pass_through_body_enabled: false,
      system_prompt: '',
      system_prompt_override: false,
    });
    // 
    setKeyMode('append');
    // 
    setIsEnterpriseAccount(false);
    // 
    setDoubaoApiEditUnlocked(false);
    doubaoApiClickCountRef.current = 0;
    setModelSearchValue('');
    // 
    setAdvancedSettingsOpen(false);
    // key_mode
    if (formApiRef.current) {
      formApiRef.current.setValue('key_mode', undefined);
    }
    //  JSON 
    setInputs(getInitValues());
    // 
    resetKeyDisplayState();
    // 
    setClipboardConfig(null);
  };

  const handleVertexUploadChange = ({ fileList }) => {
    vertexErroredNames.current.clear();
    (async () => {
      let validFiles = [];
      let keys = [];
      const errorNames = [];
      for (const item of fileList) {
        const fileObj = item.fileInstance;
        if (!fileObj) continue;
        try {
          const txt = await fileObj.text();
          keys.push(JSON.parse(txt));
          validFiles.push(item);
        } catch (err) {
          if (!vertexErroredNames.current.has(item.name)) {
            errorNames.push(item.name);
            vertexErroredNames.current.add(item.name);
          }
        }
      }

      // 
      if (!batch && validFiles.length > 1) {
        validFiles = [validFiles[validFiles.length - 1]];
        keys = [keys[keys.length - 1]];
      }

      setVertexKeys(keys);
      setVertexFileList(validFiles);
      if (formApiRef.current) {
        formApiRef.current.setValue('vertex_files', validFiles);
      }
      setInputs((prev) => ({ ...prev, vertex_files: validFiles }));

      if (errorNames.length > 0) {
        showError(
          t('{{list}}', {
            list: errorNames.join(', '),
          }),
        );
      }
    })();
  };

  const confirmMissingModelMappings = (missingModels) =>
    new Promise((resolve) => {
      const modal = Modal.confirm({
        title: t(''),
        content: (
          <div className='text-sm leading-6'>
            <div>
              {t(
                '“”',
              )}
            </div>
            <div className='font-mono text-xs break-all text-red-600 mt-1'>
              {missingModels.join(', ')}
            </div>
            <div className='mt-2'>
              {t(
                '“”',
              )}
            </div>
          </div>
        ),
        centered: true,
        footer: (
          <Space align='center' className='w-full justify-end'>
            <Button
              type='tertiary'
              onClick={() => {
                modal.destroy();
                resolve('cancel');
              }}
            >
              {t('')}
            </Button>
            <Button
              type='primary'
              theme='light'
              onClick={() => {
                modal.destroy();
                resolve('submit');
              }}
            >
              {t('')}
            </Button>
            <Button
              type='primary'
              theme='solid'
              onClick={() => {
                modal.destroy();
                resolve('add');
              }}
            >
              {t('')}
            </Button>
          </Space>
        ),
      });
    });

  const resolveStatusCodeRiskConfirm = (confirmed) => {
    setStatusCodeRiskConfirmVisible(false);
    setStatusCodeRiskDetailItems([]);
    if (statusCodeRiskConfirmResolverRef.current) {
      statusCodeRiskConfirmResolverRef.current(confirmed);
      statusCodeRiskConfirmResolverRef.current = null;
    }
  };

  const confirmStatusCodeRisk = (detailItems) =>
    new Promise((resolve) => {
      statusCodeRiskConfirmResolverRef.current = resolve;
      setStatusCodeRiskDetailItems(detailItems);
      setStatusCodeRiskConfirmVisible(true);
    });

  const hasModelConfigChanged = (normalizedModels, modelMappingStr) => {
    if (!isEdit) return true;
    const initialModels = initialModelsRef.current;
    if (normalizedModels.length !== initialModels.length) {
      return true;
    }
    for (let i = 0; i < normalizedModels.length; i++) {
      if (normalizedModels[i] !== initialModels[i]) {
        return true;
      }
    }
    const normalizedMapping = (modelMappingStr || '').trim();
    const initialMapping = (initialModelMappingRef.current || '').trim();
    return normalizedMapping !== initialMapping;
  };

  const submit = async () => {
    const formValues = formApiRef.current ? formApiRef.current.getValues() : {};
    let localInputs = { ...formValues };
    localInputs.param_override = inputs.param_override;

    if (localInputs.type === 57) {
      if (batch) {
        showInfo(t('Codex '));
        return;
      }

      const rawKey = (localInputs.key || '').trim();
      if (!isEdit && rawKey === '') {
        showInfo(t(''));
        return;
      }

      if (rawKey !== '') {
        if (!verifyJSON(rawKey)) {
          showInfo(t(' JSON '));
          return;
        }
        try {
          const parsed = JSON.parse(rawKey);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            showInfo(t(' JSON '));
            return;
          }
          const accessToken = String(parsed.access_token || '').trim();
          const accountId = String(parsed.account_id || '').trim();
          if (!accessToken) {
            showInfo(t(' JSON  access_token'));
            return;
          }
          if (!accountId) {
            showInfo(t(' JSON  account_id'));
            return;
          }
          localInputs.key = JSON.stringify(parsed);
        } catch (error) {
          showInfo(t(' JSON '));
          return;
        }
      }
    }

    if (localInputs.type === 41) {
      const keyType = localInputs.vertex_key_type || 'json';
      if (keyType === 'api_key') {
        // 
        if (!isEdit && (!localInputs.key || localInputs.key.trim() === '')) {
          showInfo(t(''));
          return;
        }
      } else {
        // JSON 
        if (useManualInput) {
          if (localInputs.key && localInputs.key.trim() !== '') {
            try {
              const parsedKey = JSON.parse(localInputs.key);
              localInputs.key = JSON.stringify(parsedKey);
            } catch (err) {
              showError(t(' JSON '));
              return;
            }
          } else if (!isEdit) {
            showInfo(t(''));
            return;
          }
        } else {
          // 
          let keys = vertexKeys;
          if (keys.length === 0 && vertexFileList.length > 0) {
            try {
              const parsed = await Promise.all(
                vertexFileList.map(async (item) => {
                  const fileObj = item.fileInstance;
                  if (!fileObj) return null;
                  const txt = await fileObj.text();
                  return JSON.parse(txt);
                }),
              );
              keys = parsed.filter(Boolean);
            } catch (err) {
              showError(t(': {{msg}}', { msg: err.message }));
              return;
            }
          }
          if (keys.length === 0) {
            if (!isEdit) {
              showInfo(t(''));
              return;
            } else {
              delete localInputs.key;
            }
          } else {
            localInputs.key = batch
              ? JSON.stringify(keys)
              : JSON.stringify(keys[0]);
          }
        }
      }
    }

    //  key 
    if (isEdit && (!localInputs.key || localInputs.key.trim() === '')) {
      delete localInputs.key;
    }
    delete localInputs.vertex_files;

    if (!isEdit && (!localInputs.name || !localInputs.key)) {
      showInfo(t(''));
      return;
    }
    if (!Array.isArray(localInputs.models) || localInputs.models.length === 0) {
      showInfo(t(''));
      return;
    }
    if (
      localInputs.type === 45 &&
      (!localInputs.base_url || localInputs.base_url.trim() === '')
    ) {
      showInfo(t('API'));
      return;
    }
    const hasModelMapping =
      typeof localInputs.model_mapping === 'string' &&
      localInputs.model_mapping.trim() !== '';
    let parsedModelMapping = null;
    if (hasModelMapping) {
      if (!verifyJSON(localInputs.model_mapping)) {
        showInfo(t(' JSON '));
        return;
      }
      try {
        parsedModelMapping = JSON.parse(localInputs.model_mapping);
      } catch (error) {
        showInfo(t(' JSON '));
        return;
      }
    }

    const normalizedModels = (localInputs.models || [])
      .map((model) => (model || '').trim())
      .filter(Boolean);
    localInputs.models = normalizedModels;

    if (
      parsedModelMapping &&
      typeof parsedModelMapping === 'object' &&
      !Array.isArray(parsedModelMapping)
    ) {
      const modelSet = new Set(normalizedModels);
      const missingModels = Object.keys(parsedModelMapping)
        .map((key) => (key || '').trim())
        .filter((key) => key && !modelSet.has(key));
      const shouldPromptMissing =
        missingModels.length > 0 &&
        hasModelConfigChanged(normalizedModels, localInputs.model_mapping);
      if (shouldPromptMissing) {
        const confirmAction = await confirmMissingModelMappings(missingModels);
        if (confirmAction === 'cancel') {
          return;
        }
        if (confirmAction === 'add') {
          const updatedModels = Array.from(
            new Set([...normalizedModels, ...missingModels]),
          );
          localInputs.models = updatedModels;
          handleInputChange('models', updatedModels);
        }
      }
    }

    const invalidStatusCodeEntries = collectInvalidStatusCodeEntries(
      localInputs.status_code_mapping,
    );
    if (invalidStatusCodeEntries.length > 0) {
      showError(
        `${t('')}: ${invalidStatusCodeEntries.join(', ')}`,
      );
      return;
    }

    const riskyStatusCodeRedirects = collectNewDisallowedStatusCodeRedirects(
      initialStatusCodeMappingRef.current,
      localInputs.status_code_mapping,
    );
    if (riskyStatusCodeRedirects.length > 0) {
      const confirmed = await confirmStatusCodeRisk(riskyStatusCodeRedirects);
      if (!confirmed) {
        return;
      }
    }

    if (localInputs.base_url && localInputs.base_url.endsWith('/')) {
      localInputs.base_url = localInputs.base_url.slice(
        0,
        localInputs.base_url.length - 1,
      );
    }
    if (localInputs.type === 18 && localInputs.other === '') {
      localInputs.other = 'v2.1';
    }

    // JSON
    const channelExtraSettings = {
      force_format: localInputs.force_format || false,
      thinking_to_content: localInputs.thinking_to_content || false,
      proxy: localInputs.proxy || '',
      pass_through_body_enabled: localInputs.pass_through_body_enabled || false,
      system_prompt: localInputs.system_prompt || '',
      system_prompt_override: localInputs.system_prompt_override || false,
    };
    localInputs.setting = JSON.stringify(channelExtraSettings);

    //  settings 
    let settings = {};
    if (localInputs.settings) {
      try {
        settings = JSON.parse(localInputs.settings);
      } catch (error) {
        console.error('settings:', error);
      }
    }

    // type === 20: truefalse
    if (localInputs.type === 20) {
      settings.openrouter_enterprise =
        localInputs.is_enterprise_account === true;
    }

    // type === 33 (AWS):  aws_key_type  settings
    if (localInputs.type === 33) {
      settings.aws_key_type = localInputs.aws_key_type || 'ak_sk';
    }

    // type === 41 (Vertex):  vertex_key_type  settings
    if (localInputs.type === 41) {
      settings.vertex_key_type = localInputs.vertex_key_type || 'json';
    } else if ('vertex_key_type' in settings) {
      delete settings.vertex_key_type;
    }

    // type === 1 (OpenAI)  type === 14 (Claude): 
    if (localInputs.type === 1 || localInputs.type === 14) {
      settings.allow_service_tier = localInputs.allow_service_tier === true;
      //  OpenAI  store / safety_identifier / include_obfuscation
      if (localInputs.type === 1) {
        settings.disable_store = localInputs.disable_store === true;
        settings.allow_safety_identifier =
          localInputs.allow_safety_identifier === true;
        settings.allow_include_obfuscation =
          localInputs.allow_include_obfuscation === true;
      }
      if (localInputs.type === 14) {
        settings.allow_inference_geo = localInputs.allow_inference_geo === true;
        settings.allow_speed = localInputs.allow_speed === true;
        settings.claude_beta_query = localInputs.claude_beta_query === true;
      }
    }

    settings.upstream_model_update_check_enabled =
      localInputs.upstream_model_update_check_enabled === true;
    settings.upstream_model_update_auto_sync_enabled =
      settings.upstream_model_update_check_enabled &&
      localInputs.upstream_model_update_auto_sync_enabled === true;
    settings.upstream_model_update_ignored_models = Array.from(
      new Set(
        String(localInputs.upstream_model_update_ignored_models || '')
          .split(',')
          .map((model) => model.trim())
          .filter(Boolean),
      ),
    );
    if (
      !Array.isArray(settings.upstream_model_update_last_detected_models) ||
      !settings.upstream_model_update_check_enabled
    ) {
      settings.upstream_model_update_last_detected_models = [];
    }
    if (typeof settings.upstream_model_update_last_check_time !== 'number') {
      settings.upstream_model_update_last_check_time = 0;
    }

    localInputs.settings = JSON.stringify(settings);

    // 
    delete localInputs.force_format;
    delete localInputs.thinking_to_content;
    delete localInputs.proxy;
    delete localInputs.pass_through_body_enabled;
    delete localInputs.system_prompt;
    delete localInputs.system_prompt_override;
    delete localInputs.is_enterprise_account;
    //  vertex_key_type 
    delete localInputs.vertex_key_type;
    //  aws_key_type 
    delete localInputs.aws_key_type;
    // 
    delete localInputs.allow_service_tier;
    delete localInputs.disable_store;
    delete localInputs.allow_safety_identifier;
    delete localInputs.allow_include_obfuscation;
    delete localInputs.allow_inference_geo;
    delete localInputs.allow_speed;
    delete localInputs.claude_beta_query;
    delete localInputs.upstream_model_update_check_enabled;
    delete localInputs.upstream_model_update_auto_sync_enabled;
    delete localInputs.upstream_model_update_last_check_time;
    delete localInputs.upstream_model_update_last_detected_models;
    delete localInputs.upstream_model_update_ignored_models;

    let res;
    localInputs.auto_ban = localInputs.auto_ban ? 1 : 0;
    localInputs.models = localInputs.models.join(',');
    localInputs.group = (localInputs.groups || []).join(',');

    let mode = 'single';
    if (batch) {
      mode = multiToSingle ? 'multi_to_single' : 'batch';
    }

    if (isEdit) {
      res = await API.put(`/api/channel/`, {
        ...localInputs,
        id: parseInt(channelId),
        key_mode: isMultiKeyChannel ? keyMode : undefined, // key
      });
    } else {
      res = await API.post(`/api/channel/`, {
        mode: mode,
        multi_key_mode: mode === 'multi_to_single' ? multiKeyMode : undefined,
        channel: localInputs,
      });
    }
    const { success, message } = res.data;
    if (success) {
      if (isEdit) {
        showSuccess(t(''));
      } else {
        showSuccess(t(''));
        setInputs(originInputs);
      }
      props.refresh();
      props.handleClose();
    } else {
      showError(message);
    }
  };

  // 
  const deduplicateKeys = () => {
    const currentKey = formApiRef.current?.getValue('key') || inputs.key || '';

    if (!currentKey.trim()) {
      showInfo(t(''));
      return;
    }

    // 
    const keyLines = currentKey.split('\n');
    const beforeCount = keyLines.length;

    // 
    const keySet = new Set();
    const deduplicatedKeys = [];

    keyLines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !keySet.has(trimmedLine)) {
        keySet.add(trimmedLine);
        deduplicatedKeys.push(trimmedLine);
      }
    });

    const afterCount = deduplicatedKeys.length;
    const deduplicatedKeyText = deduplicatedKeys.join('\n');

    // 
    if (formApiRef.current) {
      formApiRef.current.setValue('key', deduplicatedKeyText);
    }
    handleInputChange('key', deduplicatedKeyText);

    // 
    const message = t(
      ' {{before}}  {{after}} ',
      {
        before: beforeCount,
        after: afterCount,
      },
    );

    if (beforeCount === afterCount) {
      showInfo(t(''));
    } else {
      showSuccess(message);
    }
  };

  const addCustomModels = () => {
    if (customModel.trim() === '') return;
    const modelArray = customModel.split(',').map((model) => model.trim());

    let localModels = [...inputs.models];
    let localModelOptions = [...modelOptions];
    const addedModels = [];

    modelArray.forEach((model) => {
      if (model && !localModels.includes(model)) {
        localModels.push(model);
        localModelOptions.push({
          key: model,
          label: model,
          value: model,
        });
        addedModels.push(model);
      }
    });

    setModelOptions(localModelOptions);
    setCustomModel('');
    handleInputChange('models', localModels);

    if (addedModels.length > 0) {
      showSuccess(
        t(' {{count}} {{list}}', {
          count: addedModels.length,
          list: addedModels.join(', '),
        }),
      );
    } else {
      showInfo(t(''));
    }
  };

  const batchAllowed = (!isEdit || isMultiKeyChannel) && inputs.type !== 57;
  const batchExtra = batchAllowed ? (
    <Space>
      {!isEdit && (
        <Checkbox
          disabled={isEdit}
          checked={batch}
          onChange={(e) => {
            const checked = e.target.checked;

            if (!checked && vertexFileList.length > 1) {
              Modal.confirm({
                title: t(''),
                content: t(
                  '',
                ),
                onOk: () => {
                  const firstFile = vertexFileList[0];
                  const firstKey = vertexKeys[0] ? [vertexKeys[0]] : [];

                  setVertexFileList([firstFile]);
                  setVertexKeys(firstKey);

                  formApiRef.current?.setValue('vertex_files', [firstFile]);
                  setInputs((prev) => ({ ...prev, vertex_files: [firstFile] }));

                  setBatch(false);
                  setMultiToSingle(false);
                  setMultiKeyMode('random');
                },
                onCancel: () => {
                  setBatch(true);
                },
                centered: true,
              });
              return;
            }

            setBatch(checked);
            if (!checked) {
              setMultiToSingle(false);
              setMultiKeyMode('random');
            } else {
              // 
              setUseManualInput(false);
              if (inputs.type === 41) {
                // 
                if (formApiRef.current) {
                  formApiRef.current.setValue('key', '');
                }
                handleInputChange('key', '');
              }
            }
          }}
        >
          {t('')}
        </Checkbox>
      )}
      {batch && (
        <>
          <Checkbox
            disabled={isEdit}
            checked={multiToSingle}
            onChange={() => {
              setMultiToSingle((prev) => {
                const nextValue = !prev;
                setInputs((prevInputs) => {
                  const newInputs = { ...prevInputs };
                  if (nextValue) {
                    newInputs.multi_key_mode = multiKeyMode;
                  } else {
                    delete newInputs.multi_key_mode;
                  }
                  return newInputs;
                });
                return nextValue;
              });
            }}
          >
            {t('')}
          </Checkbox>

          {inputs.type !== 41 && (
            <Button
              size='small'
              type='tertiary'
              theme='outline'
              onClick={deduplicateKeys}
              style={{ textDecoration: 'underline' }}
            >
              {t('')}
            </Button>
          )}
        </>
      )}
    </Space>
  ) : null;

  const channelOptionList = useMemo(
    () =>
      CHANNEL_OPTIONS.map((opt) => ({
        ...opt,
        //  label 
        label: opt.label,
      })),
    [],
  );

  const renderChannelOption = (renderProps) => {
    const {
      disabled,
      selected,
      label,
      value,
      focused,
      className,
      style,
      onMouseEnter,
      onClick,
      ...rest
    } = renderProps;

    const searchWords = channelSearchValue ? [channelSearchValue] : [];

    // 
    const optionClassName = [
      'flex items-center gap-3 px-3 py-2 transition-all duration-200 rounded-lg mx-2 my-1',
      focused && 'bg-blue-50 shadow-sm',
      selected &&
        'bg-blue-100 text-blue-700 shadow-lg ring-2 ring-blue-200 ring-opacity-50',
      disabled && 'opacity-50 cursor-not-allowed',
      !disabled && 'hover:bg-gray-50 hover:shadow-md cursor-pointer',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div
        style={style}
        className={optionClassName}
        onClick={() => !disabled && onClick()}
        onMouseEnter={(e) => onMouseEnter()}
      >
        <div className='flex items-center gap-3 w-full'>
          <div className='flex-shrink-0 w-5 h-5 flex items-center justify-center'>
            {getChannelIcon(value)}
          </div>
          <div className='flex-1 min-w-0'>
            <Highlight
              sourceString={label}
              searchWords={searchWords}
              className='text-sm font-medium truncate'
            />
          </div>
          {selected && (
            <div className='flex-shrink-0 text-blue-600'>
              <svg
                width='16'
                height='16'
                viewBox='0 0 16 16'
                fill='currentColor'
              >
                <path d='M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z' />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <SideSheet
        placement={isEdit ? 'right' : 'left'}
        title={
          <div className='flex items-center justify-between w-full'>
            <Space>
              <Tag color='blue' shape='circle'>
                {isEdit ? t('') : t('')}
              </Tag>
              <Title heading={4} className='m-0'>
                {isEdit ? t('') : t('')}
              </Title>
            </Space>
            {!isEdit && (
              <Button
                size='small'
                type='tertiary'
                className='ec-dbcd0a3c01b55203 shrink-0'
                icon={<IconBolt />}
                onClick={pasteFromClipboard}
              >
                {t('')}
              </Button>
            )}
          </div>
        }
        bodyStyle={{ padding: '0' }}
        visible={props.visible}
        width={isMobile ? '100%' : 600}
        footer={
          <div className='flex justify-end items-center gap-2'>
            <Button
              theme='solid'
              onClick={() => formApiRef.current?.submitForm()}
              icon={<IconSave />}
            >
              {t('')}
            </Button>
            <Button
              theme='light'
              type='primary'
              onClick={handleCancel}
              icon={<IconClose />}
            >
              {t('')}
            </Button>
          </div>
        }
        closeIcon={null}
        onCancel={() => handleCancel()}
      >
        <Form
          key={isEdit ? 'edit' : 'new'}
          initValues={originInputs}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
        >
          {() => {
            const advancedSettingsContent = (
              <div className='space-y-4'>
                {/* Upstream Model Management Section */}
                {MODEL_FETCHABLE_CHANNEL_TYPES.has(inputs.type) && (
                <div className='pb-3 border-b border-gray-100'>
                  <Text className='text-sm font-medium text-gray-500 mb-3 block'>
                    {t('')}
                  </Text>

                  <Form.Switch
                    field='upstream_model_update_check_enabled'
                    label={t('')}
                    checkedText={t('')}
                    uncheckedText={t('')}
                    onChange={(value) =>
                      handleChannelOtherSettingsChange(
                        'upstream_model_update_check_enabled',
                        value,
                      )
                    }
                    extraText={t(
                      '',
                    )}
                  />
                  <Form.Switch
                    field='upstream_model_update_auto_sync_enabled'
                    label={t('')}
                    checkedText={t('')}
                    uncheckedText={t('')}
                    disabled={!inputs.upstream_model_update_check_enabled}
                    onChange={(value) =>
                      handleChannelOtherSettingsChange('upstream_model_update_auto_sync_enabled', value)
                    }
                    extraText={t('')}
                  />
                  <Form.Input
                    field='upstream_model_update_ignored_models'
                    label={t('')}
                    placeholder={t(
                      'gpt-4.1-nano,regex:^claude-.*$,regex:^sora-.*$',
                    )}
                    extraText={t(
                      ' regex: ',
                    )}
                    onChange={(value) =>
                      handleInputChange(
                        'upstream_model_update_ignored_models',
                        value,
                      )
                    }
                    showClear
                  />
                  <div className='text-xs text-gray-500 mb-2'>
                    {t('')}:&nbsp;
                    {formatUnixTime(
                      inputs.upstream_model_update_last_check_time,
                    )}
                  </div>
                  <div className='text-xs text-gray-500 mb-3'>
                    {t('')}:&nbsp;
                    {upstreamDetectedModels.length === 0 ? (
                      t('')
                    ) : (
                      <>
                        <Tooltip
                          position='topLeft'
                          content={
                            <div className='max-w-[640px] break-all text-xs leading-5'>
                              {upstreamDetectedModels.join(', ')}
                            </div>
                          }
                        >
                          <span className='cursor-help break-all'>
                            {upstreamDetectedModelsPreview.join(', ')}
                          </span>
                        </Tooltip>
                        <span className='ml-1 text-gray-400'>
                          {upstreamDetectedModelsOmittedCount > 0
                            ? t(' {{total}}  {{omit}} ', {
                                total: upstreamDetectedModels.length,
                                omit: upstreamDetectedModelsOmittedCount,
                              })
                            : t(' {{total}} ', {
                                total: upstreamDetectedModels.length,
                              })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                )}

                {/* Request Config Section */}
                <div className='py-3 border-b border-gray-100'>
                  <Text className='text-sm font-medium text-gray-500 mb-3 block'>
                    {t('')}
                  </Text>

                  <div className='mb-4'>
                    <div className='flex items-center justify-between gap-2 mb-1'>
                      <Text className='text-sm font-medium'>{t('')}</Text>
                      <Space>
                        <Button
                          size='small'
                          type='primary'
                          icon={<IconCode size={14} />}
                          onClick={() => setParamOverrideEditorVisible(true)}
                        >
                          {t('')}
                        </Button>
                        <Dropdown
                          trigger='click'
                          position='bottomRight'
                          menu={[
                            { node: 'item', name: t(''), onClick: () => applyParamOverrideTemplate('operations', 'fill') },
                            { node: 'item', name: t(''), onClick: () => applyParamOverrideTemplate('legacy', 'fill') },
                            { node: 'item', name: t(''), onClick: clearParamOverride },
                          ]}
                        >
                          <Button size='small' type='tertiary'>
                            {t('')} <IconChevronDown size={12} />
                          </Button>
                        </Dropdown>
                      </Space>
                    </div>
                    <Text type='tertiary' size='small'>
                      {t(' stream ')}
                    </Text>
                    <div
                      className='mt-2 rounded-xl p-3'
                      style={{
                        backgroundColor: 'var(--semi-color-fill-0)',
                        border: '1px solid var(--semi-color-fill-2)',
                      }}
                    >
                      <div className='flex items-center justify-between mb-2'>
                        <Tag color={paramOverrideMeta.tagColor}>
                          {paramOverrideMeta.tagLabel}
                        </Tag>
                        <Button
                          size='small'
                          icon={<IconCopy />}
                          type='tertiary'
                          onClick={copyParamOverrideJson}
                        >
                          {t('')}
                        </Button>
                      </div>
                      <pre className='mb-0 text-xs leading-5 whitespace-pre-wrap break-all max-h-56 overflow-auto'>
                        {paramOverrideMeta.preview}
                      </pre>
                    </div>
                  </div>

                  <Form.TextArea
                    field='header_override'
                    label={t('')}
                    placeholder={
                      t('') +
                      '\n' +
                      t('') +
                      '\n{\n  "User-Agent": "Mozilla/5.0 ...",\n  "Authorization": "Bearer {api_key}"\n}'
                    }
                    autosize
                    onChange={(value) =>
                      handleInputChange('header_override', value)
                    }
                    extraText={
                      <div className='flex flex-col gap-1'>
                        <div className='flex gap-2 flex-wrap items-center'>
                          <Text
                            className='!text-semi-color-primary cursor-pointer'
                            onClick={() =>
                              handleInputChange(
                                'header_override',
                                JSON.stringify({ '*': true, 're:^X-Trace-.*$': true, 'X-Foo': '{client_header:X-Foo}', Authorization: 'Bearer {api_key}', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36 Edg/139.0.0.0' }, null, 2),
                              )
                            }
                          >
                            {t('')}
                          </Text>
                          <Text
                            className='!text-semi-color-primary cursor-pointer'
                            onClick={() =>
                              handleInputChange('header_override', JSON.stringify({ '*': true }, null, 2))
                            }
                          >
                            {t('')}
                          </Text>
                          <Text
                            className='!text-semi-color-primary cursor-pointer'
                            onClick={() => formatJsonField('header_override')}
                          >
                            {t('')}
                          </Text>
                        </div>
                        <div>
                          <Text type='tertiary' size='small'>
                            {t('')}
                          </Text>
                          <div className='text-xs text-tertiary ml-2'>
                            <div>
                              {t('')}: {'{api_key}'}
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                    showClear
                  />
                  <JSONEditor
                    key={`status_code_mapping-${isEdit ? channelId : 'new'}`}
                    field='status_code_mapping'
                    label={t('')}
                    placeholder={
                      t('claude400500') +
                      '\n' +
                      JSON.stringify(STATUS_CODE_MAPPING_EXAMPLE, null, 2)
                    }
                    value={inputs.status_code_mapping || ''}
                    onChange={(value) =>
                      handleInputChange('status_code_mapping', value)
                    }
                    template={STATUS_CODE_MAPPING_EXAMPLE}
                    templateLabel={t('')}
                    editorType='keyValue'
                    formApi={formApiRef.current}
                    extraText={t('')}
                  />
                </div>

                {/* Channel Behavior Section */}
                <div className='py-3 border-b border-gray-100'>
                  <Text className='text-sm font-medium text-gray-500 mb-3 block'>
                    {t('')}
                  </Text>

                  <Form.Input
                    field='tag'
                    label={t('')}
                    placeholder={t('')}
                    showClear
                    onChange={(value) => handleInputChange('tag', value)}
                  />
                  <Form.TextArea
                    field='remark'
                    label={t('')}
                    placeholder={t('')}
                    maxLength={255}
                    showClear
                    onChange={(value) => handleInputChange('remark', value)}
                  />

                  <Row gutter={12}>
                    <Col span={12}>
                      <Form.InputNumber
                        field='priority'
                        label={t('')}
                        placeholder={t('')}
                        min={0}
                        onNumberChange={(value) => handleInputChange('priority', value)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Form.InputNumber
                        field='weight'
                        label={t('')}
                        placeholder={t('')}
                        min={0}
                        onNumberChange={(value) => handleInputChange('weight', value)}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  {inputs.type === 1 && (
                    <>
                      <div className='mt-4 mb-2 text-sm font-medium text-gray-700'>
                        {t('')}
                      </div>
                      <Form.Switch field='allow_service_tier' label={t(' service_tier ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('allow_service_tier', value)} extraText={t('service_tier ')} />
                      <Form.Switch field='disable_store' label={t(' store ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('disable_store', value)} extraText={t('store  OpenAI  Codex ')} />
                      <Form.Switch field='allow_safety_identifier' label={t(' safety_identifier ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('allow_safety_identifier', value)} extraText={t('safety_identifier  OpenAI ')} />
                      <Form.Switch field='allow_include_obfuscation' label={t(' stream_options.include_obfuscation ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('allow_include_obfuscation', value)} extraText={t('include_obfuscation  Responses ')} />
                    </>
                  )}

                  {inputs.type === 14 && (
                    <>
                      <div className='mt-4 mb-2 text-sm font-medium text-gray-700'>
                        {t('')}
                      </div>
                      <Form.Switch field='allow_service_tier' label={t(' service_tier ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('allow_service_tier', value)} extraText={t('service_tier ')} />
                      <Form.Switch field='allow_inference_geo' label={t(' inference_geo ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('allow_inference_geo', value)} extraText={t('inference_geo  Claude ')} />
                      <Form.Switch field='allow_speed' label={t(' speed ')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('allow_speed', value)} extraText={t('speed  Claude  fast ')} />
                    </>
                  )}
                </div>

                {/* Extra Settings Section */}
                <div className='pt-3'>
                  <Text className='text-sm font-medium text-gray-500 mb-3 block'>
                    {t('')}
                  </Text>

                  {inputs.type === 14 && (
                    <Form.Switch field='claude_beta_query' label={t('Claude  beta=true')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelOtherSettingsChange('claude_beta_query', value)} extraText={t(' Claude  ?beta=true')} />
                  )}

                  {inputs.type === 1 && (
                    <Form.Switch field='force_format' label={t('')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelSettingsChange('force_format', value)} extraText={t(' OpenAI OpenAI')} />
                  )}

                  <Form.Switch field='thinking_to_content' label={t('')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelSettingsChange('thinking_to_content', value)} extraText={t(' reasoning_content  <think> ')} />
                  <Form.Switch field='pass_through_body_enabled' label={t('')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelSettingsChange('pass_through_body_enabled', value)} extraText={t('')} />

                  <Form.Input field='proxy' label={t('')} placeholder={t(': socks5://user:pass@host:port')} onChange={(value) => handleChannelSettingsChange('proxy', value)} showClear extraText={t(' socks5 ')} />

                  <Form.TextArea field='system_prompt' label={t('')} placeholder={t('')} onChange={(value) => handleChannelSettingsChange('system_prompt', value)} autosize showClear extraText={t('')} />
                  <Form.Switch field='system_prompt_override' label={t('')} checkedText={t('')} uncheckedText={t('')} onChange={(value) => handleChannelSettingsChange('system_prompt_override', value)} extraText={t('')} />
                </div>
              </div>
            );

            return (
            <>
            <Spin spinning={loading}>
              <div className='p-2 space-y-3' ref={formContainerRef}>
                {!isEdit && clipboardConfig && (
                  <Banner
                    type='info'
                    className='ec-dbcd0a3c01b55203'
                    description={
                      <div className='flex items-center justify-between gap-2'>
                        <span>{t('')}</span>
                        <div className='flex gap-1'>
                          <Button
                            size='small'
                            theme='solid'
                            type='primary'
                            onClick={() => applyClipboardConfig(clipboardConfig)}
                          >
                            {t('')}
                          </Button>
                          <Button
                            size='small'
                            type='tertiary'
                            onClick={() => setClipboardConfig(null)}
                          >
                            {t('')}
                          </Button>
                        </div>
                      </div>
                    }
                  />
                )}
                {/* Core Configuration Card - Always Visible */}
                <Card className='!rounded-2xl shadow-sm border-0'>
                  {/* Header */}
                  <div className='flex items-center mb-4'>
                    <Avatar
                      size='small'
                      color='blue'
                      className='mr-2 shadow-md'
                    >
                      <IconServer size={16} />
                    </Avatar>
                    <div>
                      <Text className='text-lg font-medium'>
                        {t('')}
                      </Text>
                      <div className='text-xs text-gray-600'>
                        {t('')}
                      </div>
                    </div>
                  </div>

                    {isIonetChannel && (
                      <Banner
                        type='info'
                        closeIcon={null}
                        className='mb-4 rounded-xl'
                        description={t(
                          ' IO.NET  API ',
                        )}
                      >
                        <Space>
                          {ionetMetadata?.deployment_id && (
                            <Button
                              size='small'
                              theme='light'
                              type='primary'
                              icon={<IconGlobe />}
                              onClick={handleOpenIonetDeployment}
                            >
                              {t('')}
                            </Button>
                          )}
                        </Space>
                      </Banner>
                    )}

                    <Form.Select
                      field='type'
                      label={t('')}
                      placeholder={t('')}
                      rules={[{ required: true, message: t('') }]}
                      optionList={channelOptionList}
                      style={{ width: '100%' }}
                      filter={selectFilter}
                      autoClearSearchValue={false}
                      searchPosition='dropdown'
                      onSearch={(value) => setChannelSearchValue(value)}
                      renderOptionItem={renderChannelOption}
                      onChange={(value) => handleInputChange('type', value)}
                      disabled={isIonetLocked}
                    />

                    {inputs.type === 57 && (
                      <Banner
                        type='warning'
                        closeIcon={null}
                        className='mb-4 rounded-xl'
                        description={t(
                          ' OpenAI  Codex CLI ',
                        )}
                      />
                    )}

                    {inputs.type === 20 && (
                      <Form.Switch
                        field='is_enterprise_account'
                        label={t('')}
                        checkedText={t('')}
                        uncheckedText={t('')}
                        onChange={(value) => {
                          setIsEnterpriseAccount(value);
                          handleInputChange('is_enterprise_account', value);
                        }}
                        extraText={t(
                          '',
                        )}
                        initValue={inputs.is_enterprise_account}
                      />
                    )}

                    <Form.Input
                      field='name'
                      label={t('')}
                      placeholder={t('')}
                      rules={[{ required: true, message: t('') }]}
                      showClear
                      onChange={(value) => handleInputChange('name', value)}
                      autoComplete='new-password'
                    />

                    {inputs.type === 33 && (
                      <>
                        <Form.Select
                          field='aws_key_type'
                          label={t('')}
                          placeholder={t('')}
                          optionList={[
                            {
                              label: 'AccessKey / SecretAccessKey',
                              value: 'ak_sk',
                            },
                            { label: 'API Key', value: 'api_key' },
                          ]}
                          style={{ width: '100%' }}
                          value={inputs.aws_key_type || 'ak_sk'}
                          onChange={(value) => {
                            handleChannelOtherSettingsChange(
                              'aws_key_type',
                              value,
                            );
                          }}
                          extraText={t(
                            'AK/SK  AccessKey  SecretAccessKeyAPI Key  API Key',
                          )}
                        />
                      </>
                    )}

                    {inputs.type === 41 && (
                      <Form.Select
                        field='vertex_key_type'
                        label={t('')}
                        placeholder={t('')}
                        optionList={[
                          { label: 'JSON', value: 'json' },
                          { label: 'API Key', value: 'api_key' },
                        ]}
                        style={{ width: '100%' }}
                        value={inputs.vertex_key_type || 'json'}
                        onChange={(value) => {
                          //  vertex_key_type
                          handleChannelOtherSettingsChange(
                            'vertex_key_type',
                            value,
                          );
                          //  api_key /
                          if (value === 'api_key') {
                            setBatch(false);
                            setUseManualInput(false);
                            setVertexKeys([]);
                            setVertexFileList([]);
                            if (formApiRef.current) {
                              formApiRef.current.setValue('vertex_files', []);
                            }
                          }
                        }}
                        extraText={
                          inputs.vertex_key_type === 'api_key'
                            ? t('API Key ')
                            : t('JSON  JSON')
                        }
                      />
                    )}
                    {batch ? (
                      inputs.type === 41 &&
                      (inputs.vertex_key_type || 'json') === 'json' ? (
                        <Form.Upload
                          field='vertex_files'
                          label={t(' (.json)')}
                          accept='.json'
                          multiple
                          draggable
                          dragIcon={<IconBolt />}
                          dragMainText={t('')}
                          dragSubText={t(' JSON ')}
                          style={{ marginTop: 10 }}
                          uploadTrigger='custom'
                          beforeUpload={() => false}
                          onChange={handleVertexUploadChange}
                          fileList={vertexFileList}
                          rules={
                            isEdit
                              ? []
                              : [
                                  {
                                    required: true,
                                    message: t(''),
                                  },
                                ]
                          }
                          extraText={batchExtra}
                        />
                      ) : (
                        <Form.TextArea
                          field='key'
                          label={t('')}
                          placeholder={
                            inputs.type === 33
                              ? inputs.aws_key_type === 'api_key'
                                ? t(
                                    ' API KeyAPIKey|Region',
                                  )
                                : t(
                                    'AccessKey|SecretAccessKey|Region',
                                  )
                              : t('')
                          }
                          rules={
                            isEdit
                              ? []
                              : [{ required: true, message: t('') }]
                          }
                          autosize
                          autoComplete='new-password'
                          onChange={(value) => handleInputChange('key', value)}
                          disabled={isIonetLocked}
                          extraText={
                            <div className='flex items-center gap-2 flex-wrap'>
                              {isEdit &&
                                isMultiKeyChannel &&
                                keyMode === 'append' && (
                                  <Text type='warning' size='small'>
                                    {t(
                                      '',
                                    )}
                                  </Text>
                                )}
                              {isEdit && (
                                <Button
                                  size='small'
                                  type='primary'
                                  theme='outline'
                                  onClick={handleShow2FAModal}
                                >
                                  {t('')}
                                </Button>
                              )}
                              {batchExtra}
                            </div>
                          }
                          showClear
                        />
                      )
                    ) : (
                      <>
                        {inputs.type === 57 ? (
                          <>
                            <Form.TextArea
                              field='key'
                              label={
                                isEdit
                                  ? t('')
                                  : t('')
                              }
                              placeholder={t(
                                ' JSON  OAuth \n{\n  "access_token": "...",\n  "account_id": "..." \n}',
                              )}
                              rules={
                                isEdit
                                  ? []
                                  : [
                                      {
                                        required: true,
                                        message: t(''),
                                      },
                                    ]
                              }
                              autoComplete='new-password'
                              onChange={(value) =>
                                handleInputChange('key', value)
                              }
                              disabled={isIonetLocked}
                              extraText={
                                <div className='flex flex-col gap-2'>
                                  <Text type='tertiary' size='small'>
                                    {t(
                                      ' JSON  access_token  account_id',
                                    )}
                                  </Text>

                                  <Space wrap spacing='tight'>
                                    {isEdit && (
                                      <Button
                                        size='small'
                                        type='primary'
                                        theme='outline'
                                        onClick={handleRefreshCodexCredential}
                                        loading={codexCredentialRefreshing}
                                        disabled={isIonetLocked}
                                      >
                                        {t('')}
                                      </Button>
                                    )}
                                    <Button
                                      size='small'
                                      type='primary'
                                      theme='outline'
                                      onClick={() => formatJsonField('key')}
                                      disabled={isIonetLocked}
                                    >
                                      {t('')}
                                    </Button>
                                    {isEdit && (
                                      <Button
                                        size='small'
                                        type='primary'
                                        theme='outline'
                                        onClick={handleShow2FAModal}
                                        disabled={isIonetLocked}
                                      >
                                        {t('')}
                                      </Button>
                                    )}
                                    {batchExtra}
                                  </Space>
                                </div>
                              }
                              autosize
                              showClear
                            />
                          </>
                        ) : inputs.type === 41 &&
                          (inputs.vertex_key_type || 'json') === 'json' ? (
                          <>
                            {!batch && (
                              <div className='flex items-center justify-between mb-3'>
                                <Text className='text-sm font-medium'>
                                  {t('')}
                                </Text>
                                <Space>
                                  <Button
                                    size='small'
                                    type={
                                      !useManualInput ? 'primary' : 'tertiary'
                                    }
                                    onClick={() => {
                                      setUseManualInput(false);
                                      // 
                                      if (formApiRef.current) {
                                        formApiRef.current.setValue('key', '');
                                      }
                                      handleInputChange('key', '');
                                    }}
                                  >
                                    {t('')}
                                  </Button>
                                  <Button
                                    size='small'
                                    type={
                                      useManualInput ? 'primary' : 'tertiary'
                                    }
                                    onClick={() => {
                                      setUseManualInput(true);
                                      // 
                                      setVertexKeys([]);
                                      setVertexFileList([]);
                                      if (formApiRef.current) {
                                        formApiRef.current.setValue(
                                          'vertex_files',
                                          [],
                                        );
                                      }
                                      setInputs((prev) => ({
                                        ...prev,
                                        vertex_files: [],
                                      }));
                                    }}
                                  >
                                    {t('')}
                                  </Button>
                                </Space>
                              </div>
                            )}

                            {batch && (
                              <Banner
                                type='info'
                                description={t(
                                  '',
                                )}
                                className='!rounded-lg mb-3'
                              />
                            )}

                            {useManualInput && !batch ? (
                              <Form.TextArea
                                field='key'
                                label={
                                  isEdit
                                    ? t(
                                        '',
                                      )
                                    : t('')
                                }
                                placeholder={t(
                                  ' JSON \n{\n  "type": "service_account",\n  "project_id": "your-project-id",\n  "private_key_id": "...",\n  "private_key": "...",\n  "client_email": "...",\n  "client_id": "...",\n  "auth_uri": "...",\n  "token_uri": "...",\n  "auth_provider_x509_cert_url": "...",\n  "client_x509_cert_url": "..."\n}',
                                )}
                                rules={
                                  isEdit
                                    ? []
                                    : [
                                        {
                                          required: true,
                                          message: t(''),
                                        },
                                      ]
                                }
                                autoComplete='new-password'
                                onChange={(value) =>
                                  handleInputChange('key', value)
                                }
                                extraText={
                                  <div className='flex items-center gap-2'>
                                    <Text type='tertiary' size='small'>
                                      {t(' JSON ')}
                                    </Text>
                                    {isEdit &&
                                      isMultiKeyChannel &&
                                      keyMode === 'append' && (
                                        <Text type='warning' size='small'>
                                          {t(
                                            '',
                                          )}
                                        </Text>
                                      )}
                                    {isEdit && (
                                      <Button
                                        size='small'
                                        type='primary'
                                        theme='outline'
                                        onClick={handleShow2FAModal}
                                      >
                                        {t('')}
                                      </Button>
                                    )}
                                    {batchExtra}
                                  </div>
                                }
                                autosize
                                showClear
                              />
                            ) : (
                              <Form.Upload
                                field='vertex_files'
                                label={t(' (.json)')}
                                accept='.json'
                                draggable
                                dragIcon={<IconBolt />}
                                dragMainText={t('')}
                                dragSubText={t(' JSON ')}
                                style={{ marginTop: 10 }}
                                uploadTrigger='custom'
                                beforeUpload={() => false}
                                onChange={handleVertexUploadChange}
                                fileList={vertexFileList}
                                rules={
                                  isEdit
                                    ? []
                                    : [
                                        {
                                          required: true,
                                          message: t(''),
                                        },
                                      ]
                                }
                                extraText={batchExtra}
                              />
                            )}
                          </>
                        ) : (
                          <Form.Input
                            field='key'
                            label={
                              isEdit
                                ? t('')
                                : t('')
                            }
                            placeholder={
                              inputs.type === 33
                                ? inputs.aws_key_type === 'api_key'
                                  ? t(' API KeyAPIKey|Region')
                                  : t(
                                      'AccessKey|SecretAccessKey|Region',
                                    )
                                : t(type2secretPrompt(inputs.type))
                            }
                            rules={
                              isEdit
                                ? []
                                : [{ required: true, message: t('') }]
                            }
                            autoComplete='new-password'
                            onChange={(value) =>
                              handleInputChange('key', value)
                            }
                            extraText={
                              <div className='flex items-center gap-2'>
                                {isEdit &&
                                  isMultiKeyChannel &&
                                  keyMode === 'append' && (
                                    <Text type='warning' size='small'>
                                      {t(
                                        '',
                                      )}
                                    </Text>
                                  )}
                                {isEdit && (
                                  <Button
                                    size='small'
                                    type='primary'
                                    theme='outline'
                                    onClick={handleShow2FAModal}
                                  >
                                    {t('')}
                                  </Button>
                                )}
                                {batchExtra}
                              </div>
                            }
                            showClear
                          />
                        )}
                      </>
                    )}

                    {isEdit && isMultiKeyChannel && (
                      <Form.Select
                        field='key_mode'
                        label={t('')}
                        placeholder={t('')}
                        optionList={[
                          { label: t(''), value: 'append' },
                          { label: t(''), value: 'replace' },
                        ]}
                        style={{ width: '100%' }}
                        value={keyMode}
                        onChange={(value) => setKeyMode(value)}
                        extraText={
                          <Text type='tertiary' size='small'>
                            {keyMode === 'replace'
                              ? t('')
                              : t('')}
                          </Text>
                        }
                      />
                    )}
                    {batch && multiToSingle && (
                      <>
                        <Form.Select
                          field='multi_key_mode'
                          label={t('')}
                          placeholder={t('')}
                          optionList={[
                            { label: t(''), value: 'random' },
                            { label: t(''), value: 'polling' },
                          ]}
                          style={{ width: '100%' }}
                          value={inputs.multi_key_mode || 'random'}
                          onChange={(value) => {
                            setMultiKeyMode(value);
                            handleInputChange('multi_key_mode', value);
                          }}
                        />
                        {inputs.multi_key_mode === 'polling' && (
                          <Banner
                            type='warning'
                            description={t(
                              'Redis',
                            )}
                            className='!rounded-lg mt-2'
                          />
                        )}
                      </>
                    )}

                    {inputs.type === 18 && (
                      <Form.Input
                        field='other'
                        label={t('')}
                        placeholder={
                          'v2.1'
                        }
                        onChange={(value) => handleInputChange('other', value)}
                        showClear
                      />
                    )}

                    {inputs.type === 41 && (
                      <JSONEditor
                        key={`region-${isEdit ? channelId : 'new'}`}
                        field='other'
                        label={t('')}
                        placeholder={t(
                          'us-central1\n\n{\n    "default": "us-central1",\n    "claude-3-5-sonnet-20240620": "europe-west1"\n}',
                        )}
                        value={inputs.other || ''}
                        onChange={(value) => handleInputChange('other', value)}
                        rules={[
                          { required: true, message: t('') },
                        ]}
                        template={REGION_EXAMPLE}
                        templateLabel={t('')}
                        editorType='region'
                        formApi={formApiRef.current}
                        extraText={t('')}
                      />
                    )}

                    {inputs.type === 21 && (
                      <Form.Input
                        field='other'
                        label={t(' ID')}
                        placeholder={' ID123456'}
                        onChange={(value) => handleInputChange('other', value)}
                        showClear
                      />
                    )}

                    {inputs.type === 39 && (
                      <Form.Input
                        field='other'
                        label='Account ID'
                        placeholder={
                          'Account IDd6b5da8hk1awo8nap34ube6gh'
                        }
                        onChange={(value) => handleInputChange('other', value)}
                        showClear
                      />
                    )}

                    {inputs.type === 49 && (
                      <Form.Input
                        field='other'
                        label={t('ID')}
                        placeholder={'ID7342866812345'}
                        onChange={(value) => handleInputChange('other', value)}
                        showClear
                      />
                    )}

                    {inputs.type === 1 && (
                      <Form.Input
                        field='openai_organization'
                        label={t('')}
                        placeholder={t('org-xxx')}
                        showClear
                        helpText={t('')}
                        onChange={(value) =>
                          handleInputChange('openai_organization', value)
                        }
                      />
                    )}

                  {/* API Configuration Section */}
                  {showApiConfigCard && (
                    <div onClick={handleApiConfigSecretClick}>

                      {inputs.type === 40 && (
                        <Banner
                          type='info'
                          description={
                            <div>
                              <Text strong>{t('')}:</Text>
                              <Text
                                link
                                underline
                                className='ml-2 cursor-pointer'
                                onClick={() =>
                                  window.open(
                                    'https://cloud.siliconflow.cn/i/hij0YNTZ',
                                  )
                                }
                              >
                                https://cloud.siliconflow.cn/i/hij0YNTZ
                              </Text>
                            </div>
                          }
                          className='!rounded-lg'
                        />
                      )}

                      {inputs.type === 3 && (
                        <>
                          <Banner
                            type='warning'
                            description={t(
                              '2025510"."',
                            )}
                            className='!rounded-lg'
                          />
                          <div>
                            <Form.Input
                              field='base_url'
                              label='AZURE_OPENAI_ENDPOINT'
                              placeholder={t(
                                ' AZURE_OPENAI_ENDPOINThttps://docs-test-001.openai.azure.com',
                              )}
                              onChange={(value) =>
                                handleInputChange('base_url', value)
                              }
                              showClear
                              disabled={isIonetLocked}
                            />
                          </div>
                          <div>
                            <Form.Input
                              field='other'
                              label={t(' API ')}
                              placeholder={t(
                                ' API 2025-04-01-preview',
                              )}
                              onChange={(value) =>
                                handleInputChange('other', value)
                              }
                              showClear
                            />
                          </div>
                          <div>
                            <Form.Input
                              field='azure_responses_version'
                              label={t(
                                ' Responses API ',
                              )}
                              placeholder={t('preview')}
                              onChange={(value) =>
                                handleChannelOtherSettingsChange(
                                  'azure_responses_version',
                                  value,
                                )
                              }
                              showClear
                            />
                          </div>
                        </>
                      )}

                      {inputs.type === 8 && (
                        <>
                          <Banner
                            type='warning'
                            description={t(
                              'One APISolqoraOpenAI',
                            )}
                            className='!rounded-lg'
                          />
                          <div>
                            <Form.Input
                              field='base_url'
                              label={t(' Base URL{model}')}
                              placeholder={t(
                                'URLhttps://api.openai.com/v1/chat/completions',
                              )}
                              onChange={(value) =>
                                handleInputChange('base_url', value)
                              }
                              showClear
                              disabled={isIonetLocked}
                            />
                          </div>
                        </>
                      )}

                      {inputs.type === 37 && (
                        <Banner
                          type='warning'
                          description={t(
                            'Difychatflowagentagent',
                          )}
                          className='!rounded-lg'
                        />
                      )}

                      {inputs.type !== 3 &&
                        inputs.type !== 8 &&
                        inputs.type !== 22 &&
                        inputs.type !== 36 &&
                        (inputs.type !== 45 || doubaoApiEditUnlocked) && (
                          <div>
                            <Form.Input
                              field='base_url'
                              label={t('API')}
                              placeholder={t(
                                'API API /v1/',
                              )}
                              onChange={(value) =>
                                handleInputChange('base_url', value)
                              }
                              showClear
                              disabled={isIonetLocked}
                              extraText={t(
                                'new-apiAzure',
                              )}
                            />
                          </div>
                        )}

                      {inputs.type === 22 && (
                        <div>
                          <Form.Input
                            field='base_url'
                            label={t('')}
                            placeholder={t(
                              'https://fastgpt.run/api/openapi',
                            )}
                            onChange={(value) =>
                              handleInputChange('base_url', value)
                            }
                            showClear
                            disabled={isIonetLocked}
                          />
                        </div>
                      )}

                      {inputs.type === 36 && (
                        <div>
                          <Form.Input
                            field='base_url'
                            label={t(
                              'Chat APIAPI',
                            )}
                            placeholder={t(
                              ' /suno https://api.example.com',
                            )}
                            onChange={(value) =>
                              handleInputChange('base_url', value)
                            }
                            showClear
                            disabled={isIonetLocked}
                          />
                        </div>
                      )}

                      {inputs.type === 45 && !doubaoApiEditUnlocked && (
                        <div>
                          <Form.Select
                            field='base_url'
                            label={t('API')}
                            placeholder={t('API')}
                            onChange={(value) =>
                              handleInputChange('base_url', value)
                            }
                            optionList={[
                              {
                                value: 'https://ark.cn-beijing.volces.com',
                                label: 'https://ark.cn-beijing.volces.com',
                              },
                              {
                                value:
                                  'https://ark.ap-southeast.bytepluses.com',
                                label:
                                  'https://ark.ap-southeast.bytepluses.com',
                              },
                              {
                                value: DEPRECATED_DOUBAO_CODING_PLAN_BASE_URL,
                                label: doubaoCodingPlanOptionLabel,
                                disabled: !canKeepDeprecatedDoubaoCodingPlan,
                              },
                            ]}
                            defaultValue='https://ark.cn-beijing.volces.com'
                            disabled={isIonetLocked}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Model Selection - Part of Core Config */}
                  <Form.Select
                      field='models'
                      label={t('')}
                      placeholder={t('')}
                      rules={[{ required: true, message: t('') }]}
                      multiple
                      filter={selectFilter}
                      allowCreate
                      autoClearSearchValue={false}
                      searchPosition='dropdown'
                      optionList={modelOptions}
                      onSearch={(value) => setModelSearchValue(value)}
                      innerBottomSlot={
                        modelSearchHintText ? (
                          <Text className='px-3 py-2 block text-xs !text-semi-color-text-2'>
                            {modelSearchHintText}
                          </Text>
                        ) : null
                      }
                      style={{ width: '100%' }}
                      onChange={(value) => handleInputChange('models', value)}
                      renderSelectedItem={(optionNode) => {
                        const modelName = String(optionNode?.value ?? '');
                        return {
                          isRenderInTag: true,
                          content: (
                            <span
                              className='cursor-pointer select-none'
                              role='button'
                              tabIndex={0}
                              title={t('')}
                              onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await copy(modelName);
                                if (ok) {
                                  showSuccess(
                                    t('{{name}}', { name: modelName }),
                                  );
                                } else {
                                  showError(t(''));
                                }
                              }}
                            >
                              {optionNode.label || modelName}
                            </span>
                          ),
                        };
                      }}
                      extraText={
                        <Space>
                          <Button
                            size='small'
                            type='primary'
                            onClick={() =>
                              handleInputChange('models', basicModels)
                            }
                          >
                            {t('')}
                          </Button>
                          {MODEL_FETCHABLE_CHANNEL_TYPES.has(inputs.type) && (
                            <Button
                              size='small'
                              type='tertiary'
                              onClick={() => fetchUpstreamModelList('models')}
                            >
                              {t('')}
                            </Button>
                          )}
                          <Dropdown
                            trigger='click'
                            position='bottomRight'
                            menu={[
                              { node: 'item', name: t(''), onClick: () => handleInputChange('models', fullModels) },
                              ...(inputs.type === 4 && isEdit ? [{ node: 'item', name: t('Ollama '), onClick: () => setOllamaModalVisible(true) }] : []),
                              { node: 'divider' },
                              { node: 'item', name: t(''), onClick: () => {
                                if (inputs.models.length === 0) { showInfo(t('')); return; }
                                try { copy(inputs.models.join(',')); showSuccess(t('')); } catch (error) { showError(t('')); }
                              }},
                              { node: 'item', name: t(''), type: 'danger', onClick: () => handleInputChange('models', []) },
                              ...((modelGroups && modelGroups.length > 0) ? [
                                { node: 'divider' },
                                ...modelGroups.map((group) => ({
                                  node: 'item',
                                  name: group.name,
                                  onClick: () => {
                                    let items = [];
                                    try {
                                      if (Array.isArray(group.items)) { items = group.items; }
                                      else if (typeof group.items === 'string') {
                                        const parsed = JSON.parse(group.items || '[]');
                                        if (Array.isArray(parsed)) items = parsed;
                                      }
                                    } catch {}
                                    const current = formApiRef.current?.getValue('models') || inputs.models || [];
                                    const merged = Array.from(new Set([...current, ...items].map((m) => (m || '').trim()).filter(Boolean)));
                                    handleInputChange('models', merged);
                                  },
                                })),
                              ] : []),
                            ]}
                          >
                            <Button size='small' type='tertiary'>
                              {t('')} <IconChevronDown size={12} />
                            </Button>
                          </Dropdown>
                        </Space>
                      }
                    />

                  {/* Custom Model Name - Core Config */}
                  <Form.Input
                    field='custom_model'
                    label={t('')}
                    placeholder={t('')}
                    onChange={(value) => setCustomModel(value.trim())}
                    value={customModel}
                    suffix={
                      <Button
                        size='small'
                        type='primary'
                        onClick={addCustomModels}
                      >
                        {t('')}
                      </Button>
                    }
                  />

                  {/* Groups - Core Config */}
                  <Form.Select
                    field='groups'
                    label={t('')}
                    placeholder={t('')}
                    multiple
                    allowAdditions
                    additionLabel={t(
                      '',
                    )}
                    optionList={groupOptions}
                    style={{ width: '100%' }}
                    position='top'
                    onChange={(value) => handleInputChange('groups', value)}
                  />

                  {/* Model Mapping - Core Config */}
                  <JSONEditor
                    key={`model_mapping-${isEdit ? channelId : 'new'}`}
                    field='model_mapping'
                    label={t('')}
                    placeholder={
                      t(
                        ' JSON ',
                      ) +
                      `\n${JSON.stringify(MODEL_MAPPING_EXAMPLE, null, 2)}`
                    }
                    value={inputs.model_mapping || ''}
                    onChange={(value) =>
                      handleInputChange('model_mapping', value)
                    }
                    template={MODEL_MAPPING_EXAMPLE}
                    templateLabel={t('')}
                    editorType='keyValue'
                    formApi={formApiRef.current}
                    renderStringValueSuffix={({ pairKey, value }) => {
                      if (!MODEL_FETCHABLE_CHANNEL_TYPES.has(inputs.type)) {
                        return null;
                      }
                      const disabled = !String(pairKey ?? '').trim();
                      return (
                        <Tooltip content={t('')}>
                          <Button
                            type='tertiary'
                            theme='borderless'
                            size='small'
                            icon={<IconSearch size={14} />}
                            disabled={disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModelMappingValueModal({ pairKey, value });
                            }}
                          />
                        </Tooltip>
                      );
                    }}
                    extraText={t(
                      '',
                    )}
                  />

                  {/* Auto Ban - Core Config */}
                  <Form.Switch
                    field='auto_ban'
                    label={t('')}
                    checkedText={t('')}
                    uncheckedText={t('')}
                    onChange={(value) => setAutoBan(value)}
                    extraText={t(
                      '',
                    )}
                    initValue={autoBan}
                  />

                  {/* Test Model - Core Config */}
                  <Form.Input
                    field='test_model'
                    label={t('')}
                    placeholder={t('')}
                    onChange={(value) =>
                      handleInputChange('test_model', value)
                    }
                    showClear
                  />
                </Card>

                {/* Advanced Settings Toggle / Collapse */}
                {isMobile ? (
                <Collapse
                  activeKey={advancedSettingsOpen ? ['advanced'] : []}
                  onChange={(keys) => toggleAdvancedSettings(keys.includes('advanced'))}
                >
                  <Collapse.Panel
                    header={
                      <div className='flex items-center gap-2'>
                        <IconSetting size={16} />
                        <Text className='font-medium'>{t('')}</Text>
                      </div>
                    }
                    itemKey='advanced'
                  >
                    {advancedSettingsContent}
                  </Collapse.Panel>
                </Collapse>
                ) : (
                  /* Desktop: toggle button to open side panel */
                  <div
                    className='flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors hover:bg-gray-50'
                    style={{
                      backgroundColor: advancedSettingsOpen ? 'var(--semi-color-primary-light-default)' : 'var(--semi-color-fill-0)',
                      border: '1px solid var(--semi-color-fill-2)',
                    }}
                    onClick={() => toggleAdvancedSettings(!advancedSettingsOpen)}
                  >
                    <div className='flex items-center gap-2'>
                      <IconSetting size={16} />
                      <Text className='font-medium'>{t('')}</Text>
                    </div>
                    <div className='flex items-center gap-1 text-sm' style={{ color: 'var(--semi-color-primary)' }}>
                      <Text size='small' style={{ color: 'var(--semi-color-primary)' }}>
                        {advancedSettingsOpen ? t('') : isEdit ? t('') : t('')}
                      </Text>
                      <IconChevronDown
                        size={14}
                        style={{
                          transform: advancedSettingsOpen
                            ? 'rotate(180deg)'
                            : isEdit ? 'rotate(90deg)' : 'rotate(-90deg)',
                          transition: 'transform 0.2s',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Spin>

            {/* Desktop: Advanced Settings Side Panel - rendered inside Form tree */}
            {!isMobile && advancedSettingsOpen && (
              <div
                className='fixed top-0 h-full overflow-y-auto z-[999] semi-sidesheet-inner'
                style={{
                  width: 600,
                  [isEdit ? 'right' : 'left']: 600,
                  backgroundColor: 'var(--semi-color-bg-0)',
                  borderLeft: isEdit ? 'none' : '1px solid var(--semi-color-border)',
                  borderRight: isEdit ? '1px solid var(--semi-color-border)' : 'none',
                  animation: `slideIn${isEdit ? 'Left' : 'Right'} 0.3s ease-out`,
                }}
              >
                <div className='semi-sidesheet-header'>
                  <div className='semi-sidesheet-title'>
                    <Space>
                      <Tag color='cyan' shape='circle'>
                        {t('')}
                      </Tag>
                      <Title heading={4} className='m-0'>
                        {t('')}
                      </Title>
                    </Space>
                  </div>
                  <Button
                    className='semi-sidesheet-close'
                    type='tertiary'
                    theme='borderless'
                    icon={<IconClose />}
                    size='small'
                    onClick={() => setAdvancedSettingsOpen(false)}
                  />
                </div>
                <div className='semi-sidesheet-body' style={{ padding: 0 }}>
                  <div className='p-2 space-y-3'>
                    <Card className='!rounded-2xl shadow-sm border-0'>
                      <div className='flex items-center mb-4'>
                        <Avatar
                          size='small'
                          color='orange'
                          className='mr-2 shadow-md'
                        >
                          <IconSetting size={16} />
                        </Avatar>
                        <div>
                          <Text className='text-lg font-medium'>
                            {t('')}
                          </Text>
                          <div className='text-xs text-gray-600'>
                            {t('')}
                          </div>
                        </div>
                      </div>
                      {advancedSettingsContent}
                    </Card>
                  </div>
                </div>
              </div>
            )}
            </>
          );
          }}
        </Form>

        <ImagePreview
          src={modalImageUrl}
          visible={isModalOpenurl}
          onVisibleChange={(visible) => setIsModalOpenurl(visible)}
        />
      </SideSheet>
      <StatusCodeRiskGuardModal
        visible={statusCodeRiskConfirmVisible}
        detailItems={statusCodeRiskDetailItems}
        onCancel={() => resolveStatusCodeRiskConfirm(false)}
        onConfirm={() => resolveStatusCodeRiskConfirm(true)}
      />
      {/*  */}
      <SecureVerificationModal
        visible={isModalVisible}
        verificationMethods={verificationMethods}
        verificationState={verificationState}
        onVerify={executeVerification}
        onCancel={cancelVerification}
        onCodeChange={setVerificationCode}
        onMethodSwitch={switchVerificationMethod}
        title={verificationState.title}
        description={verificationState.description}
      />

      {/* ChannelKeyDisplay */}
      <Modal
        title={
          <div className='flex items-center'>
            <div className='w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3'>
              <svg
                className='w-4 h-4 text-green-600 dark:text-green-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            {t('')}
          </div>
        }
        visible={keyDisplayState.showModal}
        onCancel={resetKeyDisplayState}
        footer={
          <Button type='primary' onClick={resetKeyDisplayState}>
            {t('')}
          </Button>
        }
        width={700}
        style={{ maxWidth: '90vw' }}
      >
        <ChannelKeyDisplay
          keyData={keyDisplayState.keyData}
          showSuccessIcon={true}
          successText={t('')}
          showWarning={true}
          warningText={t(
            '',
          )}
        />
      </Modal>

      <ParamOverrideEditorModal
        visible={paramOverrideEditorVisible}
        value={inputs.param_override || ''}
        onCancel={() => setParamOverrideEditorVisible(false)}
        onSave={(nextValue) => {
          handleInputChange('param_override', nextValue);
          setParamOverrideEditorVisible(false);
        }}
      />

      <ModelSelectModal
        visible={modelModalVisible}
        models={fetchedModels}
        selected={inputs.models}
        redirectModels={redirectModelList}
        redirectSourceModels={redirectModelKeyList}
        onConfirm={(selectedModels) => {
          handleInputChange('models', selectedModels);
          showSuccess(t(''));
          setModelModalVisible(false);
        }}
        onCancel={() => setModelModalVisible(false)}
      />

      <SingleModelSelectModal
        visible={modelMappingValueModalVisible}
        models={modelMappingValueModalModels}
        selected={modelMappingValueSelected}
        onConfirm={(selectedModel) => {
          const modelName = String(selectedModel ?? '').trim();
          if (!modelName) {
            showError(t(''));
            return;
          }

          const mappingKey = String(modelMappingValueKey ?? '').trim();
          if (!mappingKey) {
            setModelMappingValueModalVisible(false);
            return;
          }

          let parsed = {};
          const currentMapping = inputs.model_mapping;
          if (typeof currentMapping === 'string' && currentMapping.trim()) {
            try {
              parsed = JSON.parse(currentMapping);
            } catch (error) {
              parsed = {};
            }
          } else if (
            currentMapping &&
            typeof currentMapping === 'object' &&
            !Array.isArray(currentMapping)
          ) {
            parsed = currentMapping;
          }
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            parsed = {};
          }

          parsed[mappingKey] = modelName;
          const nextMapping = JSON.stringify(parsed, null, 2);
          handleInputChange('model_mapping', nextMapping);
          if (formApiRef.current) {
            formApiRef.current.setValue('model_mapping', nextMapping);
          }
          setModelMappingValueModalVisible(false);
        }}
        onCancel={() => setModelMappingValueModalVisible(false)}
      />

      <OllamaModelModal
        visible={ollamaModalVisible}
        onCancel={() => setOllamaModalVisible(false)}
        channelId={channelId}
        channelInfo={inputs}
        onModelsUpdate={(options = {}) => {
          // 
          fetchUpstreamModelList('models', { silent: !!options.silent });
        }}
        onApplyModels={({ mode, modelIds } = {}) => {
          if (!Array.isArray(modelIds) || modelIds.length === 0) {
            return;
          }
          const existingModels = Array.isArray(inputs.models)
            ? inputs.models.map(String)
            : [];
          const incoming = modelIds.map(String);
          const nextModels = Array.from(
            new Set([...existingModels, ...incoming]),
          );

          handleInputChange('models', nextModels);
          if (formApiRef.current) {
            formApiRef.current.setValue('models', nextModels);
          }
          showSuccess(t(''));
        }}
      />
    </>
  );
};

export default EditChannelModal;

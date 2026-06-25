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

import React, { useEffect, useState } from 'react';
import {
  Button,
  Form,
  Row,
  Col,
  Typography,
  Modal,
  Banner,
  Card,
  Collapse,
  Switch,
  Table,
  Tag,
  Popconfirm,
  Space,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconRefresh,
} from '@douyinfe/semi-icons';
import { API, showError, showSuccess, getOAuthProviderIcon } from '../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// Preset templates for common OAuth providers
const OAUTH_PRESETS = {
  'github-enterprise': {
    name: 'GitHub Enterprise',
    authorization_endpoint: '/login/oauth/authorize',
    token_endpoint: '/login/oauth/access_token',
    user_info_endpoint: '/api/v3/user',
    scopes: 'user:email',
    user_id_field: 'id',
    username_field: 'login',
    display_name_field: 'name',
    email_field: 'email',
  },
  gitlab: {
    name: 'GitLab',
    authorization_endpoint: '/oauth/authorize',
    token_endpoint: '/oauth/token',
    user_info_endpoint: '/api/v4/user',
    scopes: 'openid profile email',
    user_id_field: 'id',
    username_field: 'username',
    display_name_field: 'name',
    email_field: 'email',
  },
  gitea: {
    name: 'Gitea',
    authorization_endpoint: '/login/oauth/authorize',
    token_endpoint: '/login/oauth/access_token',
    user_info_endpoint: '/api/v1/user',
    scopes: 'openid profile email',
    user_id_field: 'id',
    username_field: 'login',
    display_name_field: 'full_name',
    email_field: 'email',
  },
  nextcloud: {
    name: 'Nextcloud',
    authorization_endpoint: '/apps/oauth2/authorize',
    token_endpoint: '/apps/oauth2/api/v1/token',
    user_info_endpoint: '/ocs/v2.php/cloud/user?format=json',
    scopes: 'openid profile email',
    user_id_field: 'ocs.data.id',
    username_field: 'ocs.data.id',
    display_name_field: 'ocs.data.displayname',
    email_field: 'ocs.data.email',
  },
  keycloak: {
    name: 'Keycloak',
    authorization_endpoint: '/realms/{realm}/protocol/openid-connect/auth',
    token_endpoint: '/realms/{realm}/protocol/openid-connect/token',
    user_info_endpoint: '/realms/{realm}/protocol/openid-connect/userinfo',
    scopes: 'openid profile email',
    user_id_field: 'sub',
    username_field: 'preferred_username',
    display_name_field: 'name',
    email_field: 'email',
  },
  authentik: {
    name: 'Authentik',
    authorization_endpoint: '/application/o/authorize/',
    token_endpoint: '/application/o/token/',
    user_info_endpoint: '/application/o/userinfo/',
    scopes: 'openid profile email',
    user_id_field: 'sub',
    username_field: 'preferred_username',
    display_name_field: 'name',
    email_field: 'email',
  },
  ory: {
    name: 'ORY Hydra',
    authorization_endpoint: '/oauth2/auth',
    token_endpoint: '/oauth2/token',
    user_info_endpoint: '/userinfo',
    scopes: 'openid profile email',
    user_id_field: 'sub',
    username_field: 'preferred_username',
    display_name_field: 'name',
    email_field: 'email',
  },
};

const OAUTH_PRESET_ICONS = {
  'github-enterprise': 'github',
  gitlab: 'gitlab',
  gitea: 'gitea',
  nextcloud: 'nextcloud',
  keycloak: 'keycloak',
  authentik: 'authentik',
  ory: 'openid',
};

const getPresetIcon = (preset) => OAUTH_PRESET_ICONS[preset] || '';

const PRESET_RESET_VALUES = {
  name: '',
  slug: '',
  icon: '',
  authorization_endpoint: '',
  token_endpoint: '',
  user_info_endpoint: '',
  scopes: '',
  user_id_field: '',
  username_field: '',
  display_name_field: '',
  email_field: '',
  well_known: '',
  auth_style: 0,
  access_policy: '',
  access_denied_message: '',
};

const DISCOVERY_FIELD_LABELS = {
  authorization_endpoint: 'Authorization Endpoint',
  token_endpoint: 'Token Endpoint',
  user_info_endpoint: 'User Info Endpoint',
  scopes: 'Scopes',
  user_id_field: 'User ID Field',
  username_field: 'Username Field',
  display_name_field: 'Display Name Field',
  email_field: 'Email Field',
};

const ACCESS_POLICY_TEMPLATES = {
  level_active: `{
  "logic": "and",
  "conditions": [
    {"field": "trust_level", "op": "gte", "value": 2},
    {"field": "active", "op": "eq", "value": true}
  ]
}`,
  org_or_role: `{
  "logic": "or",
  "conditions": [
    {"field": "org", "op": "eq", "value": "core"},
    {"field": "roles", "op": "contains", "value": "admin"}
  ]
}`,
};

const ACCESS_DENIED_TEMPLATES = {
  level_hint: ' {{required}} {{current}}{{field}}',
  org_hint: '={{current.org}}={{current.roles}}',
};

const CustomOAuthSetting = ({ serverAddress }) => {
  const { t } = useTranslation();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [selectedPreset, setSelectedPreset] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryInfo, setDiscoveryInfo] = useState(null);
  const [advancedActiveKeys, setAdvancedActiveKeys] = useState([]);
  const formApiRef = React.useRef(null);

  const mergeFormValues = (newValues) => {
    setFormValues((prev) => ({ ...prev, ...newValues }));
    if (!formApiRef.current) return;
    Object.entries(newValues).forEach(([key, value]) => {
      formApiRef.current.setValue(key, value);
    });
  };

  const getLatestFormValues = () => {
    const values = formApiRef.current?.getValues?.();
    return values && typeof values === 'object' ? values : formValues;
  };

  const normalizeBaseUrl = (url) => (url || '').trim().replace(/\/+$/, '');

  const inferBaseUrlFromProvider = (provider) => {
    const endpoint = provider?.authorization_endpoint || provider?.token_endpoint;
    if (!endpoint) return '';
    try {
      const url = new URL(endpoint);
      return `${url.protocol}//${url.host}`;
    } catch (error) {
      return '';
    }
  };

  const resetDiscoveryState = () => {
    setDiscoveryInfo(null);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetDiscoveryState();
    setAdvancedActiveKeys([]);
  };

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/custom-oauth-provider/');
      if (res.data.success) {
        setProviders(res.data.data || []);
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t(' OAuth '));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleAdd = () => {
    setEditingProvider(null);
    setFormValues({
      enabled: false,
      icon: '',
      scopes: 'openid profile email',
      user_id_field: 'sub',
      username_field: 'preferred_username',
      display_name_field: 'name',
      email_field: 'email',
      auth_style: 0,
      access_policy: '',
      access_denied_message: '',
    });
    setSelectedPreset('');
    setBaseUrl('');
    resetDiscoveryState();
    setAdvancedActiveKeys([]);
    setModalVisible(true);
  };

  const handleEdit = (provider) => {
    setEditingProvider(provider);
    setFormValues({ ...provider });
    setSelectedPreset(OAUTH_PRESETS[provider.slug] ? provider.slug : '');
    setBaseUrl(inferBaseUrlFromProvider(provider));
    resetDiscoveryState();
    setAdvancedActiveKeys([]);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      const res = await API.delete(`/api/custom-oauth-provider/${id}`);
      if (res.data.success) {
        showSuccess(t(''));
        fetchProviders();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t(''));
    }
  };

  const handleSubmit = async () => {
    const currentValues = getLatestFormValues();

    // Validate required fields
    const requiredFields = [
      'name',
      'slug',
      'client_id',
      'authorization_endpoint',
      'token_endpoint',
      'user_info_endpoint',
    ];
    
    if (!editingProvider) {
      requiredFields.push('client_secret');
    }

    for (const field of requiredFields) {
      if (!currentValues[field]) {
        showError(t(` ${field}`));
        return;
      }
    }

    // Validate endpoint URLs must be full URLs
    const endpointFields = ['authorization_endpoint', 'token_endpoint', 'user_info_endpoint'];
    for (const field of endpointFields) {
      const value = currentValues[field];
      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
        // Check if user selected a preset but forgot to fill issuer URL
        if (selectedPreset && !baseUrl) {
          showError(t(' Issuer URL URL'));
        } else {
          showError(t(' URL  http://  https:// '));
        }
        return;
      }
    }

    try {
      const payload = { ...currentValues, enabled: !!currentValues.enabled };
      delete payload.preset;
      delete payload.base_url;

      let res;
      if (editingProvider) {
        res = await API.put(
          `/api/custom-oauth-provider/${editingProvider.id}`,
          payload
        );
      } else {
        res = await API.post('/api/custom-oauth-provider/', payload);
      }

      if (res.data.success) {
        showSuccess(editingProvider ? t('') : t(''));
        closeModal();
        fetchProviders();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(
        error?.response?.data?.message ||
          (editingProvider ? t('') : t('')),
      );
    }
  };

  const handleFetchFromDiscovery = async () => {
    const cleanBaseUrl = normalizeBaseUrl(baseUrl);
    const configuredWellKnown = (formValues.well_known || '').trim();
    const wellKnownUrl =
      configuredWellKnown ||
      (cleanBaseUrl ? `${cleanBaseUrl}/.well-known/openid-configuration` : '');

    if (!wellKnownUrl) {
      showError(t(' Discovery URL  Issuer URL'));
      return;
    }

    setDiscoveryLoading(true);
    try {
      const res = await API.post('/api/custom-oauth-provider/discovery', {
        well_known_url: configuredWellKnown || '',
        issuer_url: cleanBaseUrl || '',
      });
      if (!res.data.success) {
        throw new Error(res.data.message || t(''));
      }
      const data = res.data.data?.discovery || {};
      const resolvedWellKnown = res.data.data?.well_known_url || wellKnownUrl;

      const discoveredValues = {
        well_known: resolvedWellKnown,
      };
      const autoFilledFields = [];
      if (data.authorization_endpoint) {
        discoveredValues.authorization_endpoint = data.authorization_endpoint;
        autoFilledFields.push('authorization_endpoint');
      }
      if (data.token_endpoint) {
        discoveredValues.token_endpoint = data.token_endpoint;
        autoFilledFields.push('token_endpoint');
      }
      if (data.userinfo_endpoint) {
        discoveredValues.user_info_endpoint = data.userinfo_endpoint;
        autoFilledFields.push('user_info_endpoint');
      }

      const scopesSupported = Array.isArray(data.scopes_supported)
        ? data.scopes_supported
        : [];
      if (scopesSupported.length > 0 && !formValues.scopes) {
        const preferredScopes = ['openid', 'profile', 'email'].filter((scope) =>
          scopesSupported.includes(scope),
        );
        discoveredValues.scopes =
          preferredScopes.length > 0
            ? preferredScopes.join(' ')
            : scopesSupported.slice(0, 5).join(' ');
        autoFilledFields.push('scopes');
      }

      const claimsSupported = Array.isArray(data.claims_supported)
        ? data.claims_supported
        : [];
      const claimMap = {
        user_id_field: 'sub',
        username_field: 'preferred_username',
        display_name_field: 'name',
        email_field: 'email',
      };
      Object.entries(claimMap).forEach(([field, claim]) => {
        if (!formValues[field] && claimsSupported.includes(claim)) {
          discoveredValues[field] = claim;
          autoFilledFields.push(field);
        }
      });

      const hasCoreEndpoint =
        discoveredValues.authorization_endpoint ||
        discoveredValues.token_endpoint ||
        discoveredValues.user_info_endpoint;
      if (!hasCoreEndpoint) {
        showError(t(' Discovery  OAuth '));
        return;
      }

      mergeFormValues(discoveredValues);
      setDiscoveryInfo({
        wellKnown: wellKnownUrl,
        autoFilledFields,
        scopesSupported: scopesSupported.slice(0, 12),
        claimsSupported: claimsSupported.slice(0, 12),
      });
      showSuccess(t(' Discovery '));
    } catch (error) {
      showError(
        t(' Discovery ') + (error?.message || t('')),
      );
    } finally {
      setDiscoveryLoading(false);
    }
  };

  const handlePresetChange = (preset) => {
    setSelectedPreset(preset);
    resetDiscoveryState();
    const cleanUrl = normalizeBaseUrl(baseUrl);
    if (!preset || !OAUTH_PRESETS[preset]) {
      mergeFormValues(PRESET_RESET_VALUES);
      return;
    }

    const presetConfig = OAUTH_PRESETS[preset];
    const newValues = {
      ...PRESET_RESET_VALUES,
      name: presetConfig.name,
      slug: preset,
      icon: getPresetIcon(preset),
      scopes: presetConfig.scopes,
      user_id_field: presetConfig.user_id_field,
      username_field: presetConfig.username_field,
      display_name_field: presetConfig.display_name_field,
      email_field: presetConfig.email_field,
      auth_style: presetConfig.auth_style ?? 0,
    };
    if (cleanUrl) {
      newValues.authorization_endpoint =
        cleanUrl + presetConfig.authorization_endpoint;
      newValues.token_endpoint = cleanUrl + presetConfig.token_endpoint;
      newValues.user_info_endpoint = cleanUrl + presetConfig.user_info_endpoint;
    }
    mergeFormValues(newValues);
  };

  const handleBaseUrlChange = (url) => {
    setBaseUrl(url);
    if (url && selectedPreset && OAUTH_PRESETS[selectedPreset]) {
      const presetConfig = OAUTH_PRESETS[selectedPreset];
      const cleanUrl = normalizeBaseUrl(url);
      const newValues = {
        authorization_endpoint: cleanUrl + presetConfig.authorization_endpoint,
        token_endpoint: cleanUrl + presetConfig.token_endpoint,
        user_info_endpoint: cleanUrl + presetConfig.user_info_endpoint,
      };
      mergeFormValues(newValues);
    }
  };

  const applyAccessPolicyTemplate = (templateKey) => {
    const template = ACCESS_POLICY_TEMPLATES[templateKey];
    if (!template) return;
    mergeFormValues({ access_policy: template });
    showSuccess(t(''));
  };

  const applyDeniedTemplate = (templateKey) => {
    const template = ACCESS_DENIED_TEMPLATES[templateKey];
    if (!template) return;
    mergeFormValues({ access_denied_message: template });
    showSuccess(t(''));
  };

  const columns = [
    {
      title: t(''),
      dataIndex: 'icon',
      key: 'icon',
      width: 80,
      render: (icon) => getOAuthProviderIcon(icon || '', 18),
    },
    {
      title: t(''),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (slug) => <Tag>{slug}</Tag>,
    },
    {
      title: t(''),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled) => (
        <Tag color={enabled ? 'green' : 'grey'}>
          {enabled ? t('') : t('')}
        </Tag>
      ),
    },
    {
      title: t('Client ID'),
      dataIndex: 'client_id',
      key: 'client_id',
      render: (id) => {
        if (!id) return '-';
        return id.length > 20 ? `${id.substring(0, 20)}...` : id;
      },
    },
    {
      title: t(''),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            icon={<IconEdit />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            {t('')}
          </Button>
          <Popconfirm
            title={t(' OAuth ')}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<IconDelete />} size="small" type="danger">
              {t('')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const discoveryAutoFilledLabels = (discoveryInfo?.autoFilledFields || [])
    .map((field) => DISCOVERY_FIELD_LABELS[field] || field)
    .join(', ');

  return (
    <Card>
      <Form.Section text={t(' OAuth ')}>
        <Banner
          type="info"
          description={
            <>
              {t(
                ' OAuth  GitHub EnterpriseGitLabGiteaNextcloudKeycloakORY  OAuth 2.0 '
              )}
              <br />
              {t(' URL ')}: {serverAddress || t('')}/oauth/
              {'{slug}'}
            </>
          }
          style={{ marginBottom: 20 }}
        />

        <Button
          icon={<IconPlus />}
          theme="solid"
          onClick={handleAdd}
          style={{ marginBottom: 16 }}
        >
          {t(' OAuth ')}
        </Button>

        <Table
          columns={columns}
          dataSource={providers}
          loading={loading}
          rowKey="id"
          pagination={false}
          empty={t(' OAuth ')}
        />

        <Modal
          title={editingProvider ? t(' OAuth ') : t(' OAuth ')}
          visible={modalVisible}
          onCancel={closeModal}
          width={860}
          centered
          bodyStyle={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: 6 }}
          footer={
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <Space spacing={8} align='center'>
                <Text type='secondary'>{t('')}</Text>
                <Switch
                  checked={!!formValues.enabled}
                  size='large'
                  onChange={(checked) => mergeFormValues({ enabled: !!checked })}
                />
                <Tag color={formValues.enabled ? 'green' : 'grey'}>
                  {formValues.enabled ? t('') : t('')}
                </Tag>
              </Space>
              <Button onClick={closeModal}>{t('')}</Button>
              <Button type='primary' onClick={handleSubmit}>
                {t('')}
              </Button>
            </div>
          }
        >
          <Form
            initValues={formValues}
            onValueChange={() => {
              setFormValues((prev) => ({ ...prev, ...getLatestFormValues() }));
            }}
            getFormApi={(api) => (formApiRef.current = api)}
          >
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('Configuration')}
            </Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {t(' OAuth ')}
            </Text>
            {discoveryInfo && (
              <Banner
                type='success'
                closeIcon={null}
                style={{ marginBottom: 12 }}
                description={
                  <div>
                    <div>
                      {t(' Discovery ')}
                    </div>
                    {discoveryAutoFilledLabels ? (
                      <div>
                        {t('')}:
                        {' '}
                        {discoveryAutoFilledLabels}
                      </div>
                    ) : null}
                    {discoveryInfo.scopesSupported?.length ? (
                      <div>
                        {t('Discovery scopes')}:
                        {' '}
                        {discoveryInfo.scopesSupported.join(', ')}
                      </div>
                    ) : null}
                    {discoveryInfo.claimsSupported?.length ? (
                      <div>
                        {t('Discovery claims')}:
                        {' '}
                        {discoveryInfo.claimsSupported.join(', ')}
                      </div>
                    ) : null}
                  </div>
                }
              />
            )}

            <Row gutter={16}>
              <Col span={8}>
                <Form.Select
                  field="preset"
                  label={t('')}
                  placeholder={t('')}
                  value={selectedPreset}
                  onChange={handlePresetChange}
                  optionList={[
                    { value: '', label: t('') },
                    ...Object.entries(OAUTH_PRESETS).map(([key, config]) => ({
                      value: key,
                      label: config.name,
                    })),
                  ]}
                />
              </Col>
              <Col span={10}>
                <Form.Input
                  field="base_url"
                  label={t(' URLIssuer URL')}
                  placeholder={t('https://gitea.example.com')}
                  value={baseUrl}
                  onChange={handleBaseUrlChange}
                  extraText={
                    selectedPreset
                      ? t('')
                      : t(' Discovery URL')
                  }
                />
              </Col>
              <Col span={6}>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%' }}>
                  <Button
                    icon={<IconRefresh />}
                    onClick={handleFetchFromDiscovery}
                    loading={discoveryLoading}
                    block
                  >
                    {t(' Discovery ')}
                  </Button>
                </div>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Input
                  field="well_known"
                  label={t('Discovery URL')}
                  placeholder={t('https://example.com/.well-known/openid-configuration')}
                  extraText={t(' Issuer URL + /.well-known/openid-configuration')}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Input
                  field="name"
                  label={t('')}
                  placeholder={t('GitHub Enterprise')}
                  rules={[{ required: true, message: t('') }]}
                />
              </Col>
              <Col span={12}>
                <Form.Input
                  field="slug"
                  label="Slug"
                  placeholder={t('github-enterprise')}
                  extraText={t('URL ')}
                  rules={[{ required: true, message: t(' Slug') }]}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={18}>
                <Form.Input
                  field='icon'
                  label={t('')}
                  placeholder={t('github / si:google / https://example.com/logo.png / 🐱')}
                  extraText={
                    <span>
                      {t(
                        ' react-iconsSimple Icons URL/emojigithubgitlabsi:google',
                      )}
                    </span>
                  }
                  showClear
                />
              </Col>
              <Col span={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    minHeight: 74,
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24,
                    background: 'var(--semi-color-fill-0)',
                  }}
                >
                  {getOAuthProviderIcon(formValues.icon || '', 24)}
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Input
                  field="client_id"
                  label="Client ID"
                  placeholder={t('OAuth Client ID')}
                  rules={[{ required: true, message: t(' Client ID') }]}
                />
              </Col>
              <Col span={12}>
                <Form.Input
                  field="client_secret"
                  label="Client Secret"
                  type="password"
                  placeholder={
                    editingProvider
                      ? t('')
                      : t('OAuth Client Secret')
                  }
                  rules={
                    editingProvider
                      ? []
                      : [{ required: true, message: t(' Client Secret') }]
                  }
                />
              </Col>
            </Row>

            <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>
              {t('OAuth ')}
            </Text>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Input
                  field="authorization_endpoint"
                  label={t('Authorization Endpoint')}
                  placeholder={
                    selectedPreset && OAUTH_PRESETS[selectedPreset]
                      ? t(' Issuer URL ') +
                        OAUTH_PRESETS[selectedPreset].authorization_endpoint
                      : 'https://example.com/oauth/authorize'
                  }
                  rules={[
                    { required: true, message: t(' Authorization Endpoint') },
                  ]}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Input
                  field="token_endpoint"
                  label={t('Token Endpoint')}
                  placeholder={
                    selectedPreset && OAUTH_PRESETS[selectedPreset]
                      ? t('') + OAUTH_PRESETS[selectedPreset].token_endpoint
                      : 'https://example.com/oauth/token'
                  }
                  rules={[{ required: true, message: t(' Token Endpoint') }]}
                />
              </Col>
              <Col span={12}>
                <Form.Input
                  field="user_info_endpoint"
                  label={t('User Info Endpoint')}
                  placeholder={
                    selectedPreset && OAUTH_PRESETS[selectedPreset]
                      ? t('') + OAUTH_PRESETS[selectedPreset].user_info_endpoint
                      : 'https://example.com/api/user'
                  }
                  rules={[
                    { required: true, message: t(' User Info Endpoint') },
                  ]}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Input
                  field="scopes"
                  label={t('Scopes')}
                  placeholder="openid profile email"
                  extraText={
                    discoveryInfo?.scopesSupported?.length
                      ? t('Discovery  scopes') +
                        discoveryInfo.scopesSupported.join(', ')
                      : t(' scope ')
                  }
                />
              </Col>
            </Row>

            <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>
              {t('')}
            </Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              {t(' API  JSONPath ')}
            </Text>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Input
                  field="user_id_field"
                  label={t(' ID ')}
                  placeholder={t('subiddata.user.id')}
                  extraText={t('')}
                />
              </Col>
              <Col span={12}>
                <Form.Input
                  field="username_field"
                  label={t('')}
                  placeholder={t('preferred_usernamelogin')}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Input
                  field="display_name_field"
                  label={t('')}
                  placeholder={t('namefull_name')}
                />
              </Col>
              <Col span={12}>
                <Form.Input
                  field="email_field"
                  label={t('')}
                  placeholder={t('email')}
                />
              </Col>
            </Row>

            <Collapse
              keepDOM
              activeKey={advancedActiveKeys}
              style={{ marginTop: 16 }}
              onChange={(activeKey) => {
                const keys = Array.isArray(activeKey) ? activeKey : [activeKey];
                setAdvancedActiveKeys(keys.filter(Boolean));
              }}
            >
              <Collapse.Panel header={t('')} itemKey='advanced'>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Select
                      field="auth_style"
                      label={t('')}
                      optionList={[
                        { value: 0, label: t('') },
                        { value: 1, label: t('POST ') },
                        { value: 2, label: t('Basic Auth ') },
                      ]}
                    />
                  </Col>
                </Row>

                <Text strong style={{ display: 'block', margin: '16px 0 8px' }}>
                  {t('')}
                </Text>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                  {t(' JSON ')}
                </Text>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.TextArea
                      field='access_policy'
                      value={formValues.access_policy || ''}
                      onChange={(value) => mergeFormValues({ access_policy: value })}
                      label={t(' JSON')}
                      rows={6}
                      placeholder={`{
  "logic": "and",
  "conditions": [
    {"field": "trust_level", "op": "gte", "value": 2},
    {"field": "active", "op": "eq", "value": true}
  ]
}`}
                      extraText={t(' and/or  groups eq/ne/gt/gte/lt/lte/in/not_in/contains/exists')}
                      showClear
                    />
                    <Space spacing={8} style={{ marginTop: 8 }}>
                      <Button size='small' theme='light' onClick={() => applyAccessPolicyTemplate('level_active')}>
                        {t('+')}
                      </Button>
                      <Button size='small' theme='light' onClick={() => applyAccessPolicyTemplate('org_or_role')}>
                        {t('')}
                      </Button>
                    </Space>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Input
                      field='access_denied_message'
                      value={formValues.access_denied_message || ''}
                      onChange={(value) => mergeFormValues({ access_denied_message: value })}
                      label={t('')}
                      placeholder={t(' {{required}} {{current}}')}
                      extraText={t('{{provider}} {{field}} {{op}} {{required}} {{current}}  {{current.path}}')}
                      showClear
                    />
                    <Space spacing={8} style={{ marginTop: 8 }}>
                      <Button size='small' theme='light' onClick={() => applyDeniedTemplate('level_hint')}>
                        {t('')}
                      </Button>
                      <Button size='small' theme='light' onClick={() => applyDeniedTemplate('org_hint')}>
                        {t('')}
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </Collapse.Panel>
            </Collapse>
          </Form>
        </Modal>
      </Form.Section>
    </Card>
  );
};

export default CustomOAuthSetting;

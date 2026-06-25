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
  Form,
  Row,
  Col,
  Typography,
  Modal,
  Banner,
  TagInput,
  Spin,
  Card,
  Radio,
  Select,
} from '@douyinfe/semi-ui';
const { Text } = Typography;
import {
  API,
  removeTrailingSlash,
  showError,
  showSuccess,
  toBoolean,
} from '../../helpers';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import CustomOAuthSetting from './CustomOAuthSetting';

const SystemSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    PasswordLoginEnabled: '',
    PasswordRegisterEnabled: '',
    EmailVerificationEnabled: '',
    GitHubOAuthEnabled: '',
    GitHubClientId: '',
    GitHubClientSecret: '',
    'discord.enabled': '',
    'discord.client_id': '',
    'discord.client_secret': '',
    'oidc.enabled': '',
    'oidc.client_id': '',
    'oidc.client_secret': '',
    'oidc.well_known': '',
    'oidc.authorization_endpoint': '',
    'oidc.token_endpoint': '',
    'oidc.user_info_endpoint': '',
    Notice: '',
    SMTPServer: '',
    SMTPPort: '',
    SMTPAccount: '',
    SMTPFrom: '',
    SMTPToken: '',
    WorkerUrl: '',
    WorkerValidKey: '',
    WorkerAllowHttpImageRequestEnabled: '',
    Footer: '',
    WeChatAuthEnabled: '',
    WeChatServerAddress: '',
    WeChatServerToken: '',
    WeChatAccountQRCodeImageURL: '',
    TurnstileCheckEnabled: '',
    TurnstileSiteKey: '',
    TurnstileSecretKey: '',
    RegisterEnabled: '',
    'passkey.enabled': '',
    'passkey.rp_display_name': '',
    'passkey.rp_id': '',
    'passkey.origins': [],
    'passkey.allow_insecure_origin': '',
    'passkey.user_verification': 'preferred',
    'passkey.attachment_preference': '',
    EmailDomainRestrictionEnabled: '',
    EmailAliasRestrictionEnabled: '',
    SMTPSSLEnabled: '',
    SMTPStartTLSEnabled: '',
    SMTPForceAuthLogin: '',
    EmailDomainWhitelist: [],
    TelegramOAuthEnabled: '',
    TelegramBotToken: '',
    TelegramBotName: '',
    LinuxDOOAuthEnabled: '',
    LinuxDOClientId: '',
    LinuxDOClientSecret: '',
    LinuxDOMinimumTrustLevel: '',
    ServerAddress: '',
    // SSRF
    'fetch_setting.enable_ssrf_protection': true,
    'fetch_setting.allow_private_ip': '',
    'fetch_setting.domain_filter_mode': false, // true false 
    'fetch_setting.ip_filter_mode': false, // true false 
    'fetch_setting.domain_list': [],
    'fetch_setting.ip_list': [],
    'fetch_setting.allowed_ports': [],
    'fetch_setting.apply_ip_filter_for_domain': true,
  });

  const [originInputs, setOriginInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const formApiRef = useRef(null);
  const [emailDomainWhitelist, setEmailDomainWhitelist] = useState([]);
  const [showPasswordLoginConfirmModal, setShowPasswordLoginConfirmModal] =
    useState(false);
  const [linuxDOOAuthEnabled, setLinuxDOOAuthEnabled] = useState(false);
  const [emailToAdd, setEmailToAdd] = useState('');
  const [domainFilterMode, setDomainFilterMode] = useState(true);
  const [ipFilterMode, setIpFilterMode] = useState(true);
  const [domainList, setDomainList] = useState([]);
  const [ipList, setIpList] = useState([]);
  const [allowedPorts, setAllowedPorts] = useState([]);

  const getOptions = async () => {
    setLoading(true);
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        switch (item.key) {
          case 'TopupGroupRatio':
            item.value = JSON.stringify(JSON.parse(item.value), null, 2);
            break;
          case 'EmailDomainWhitelist':
            setEmailDomainWhitelist(item.value ? item.value.split(',') : []);
            break;
          case 'fetch_setting.allow_private_ip':
          case 'fetch_setting.enable_ssrf_protection':
          case 'fetch_setting.domain_filter_mode':
          case 'fetch_setting.ip_filter_mode':
          case 'fetch_setting.apply_ip_filter_for_domain':
            item.value = toBoolean(item.value);
            break;
          case 'fetch_setting.domain_list':
            try {
              const domains = item.value ? JSON.parse(item.value) : [];
              setDomainList(Array.isArray(domains) ? domains : []);
            } catch (e) {
              setDomainList([]);
            }
            break;
          case 'fetch_setting.ip_list':
            try {
              const ips = item.value ? JSON.parse(item.value) : [];
              setIpList(Array.isArray(ips) ? ips : []);
            } catch (e) {
              setIpList([]);
            }
            break;
          case 'fetch_setting.allowed_ports':
            try {
              const ports = item.value ? JSON.parse(item.value) : [];
              setAllowedPorts(Array.isArray(ports) ? ports : []);
            } catch (e) {
              setAllowedPorts(['80', '443', '8080', '8443']);
            }
            break;
          case 'PasswordLoginEnabled':
          case 'PasswordRegisterEnabled':
          case 'EmailVerificationEnabled':
          case 'GitHubOAuthEnabled':
          case 'WeChatAuthEnabled':
          case 'TelegramOAuthEnabled':
          case 'RegisterEnabled':
          case 'TurnstileCheckEnabled':
          case 'EmailDomainRestrictionEnabled':
          case 'EmailAliasRestrictionEnabled':
          case 'SMTPSSLEnabled':
          case 'SMTPStartTLSEnabled':
          case 'SMTPForceAuthLogin':
          case 'LinuxDOOAuthEnabled':
          case 'discord.enabled':
          case 'oidc.enabled':
          case 'passkey.enabled':
          case 'passkey.allow_insecure_origin':
          case 'WorkerAllowHttpImageRequestEnabled':
            item.value = toBoolean(item.value);
            break;
          case 'passkey.origins':
            // origins
            item.value = item.value || '';
            break;
          case 'passkey.rp_display_name':
          case 'passkey.rp_id':
          case 'passkey.attachment_preference':
            // null/undefined
            item.value = item.value || '';
            break;
          case 'passkey.user_verification':
            // 
            item.value = item.value || 'preferred';
            break;
          case 'Price':
          case 'MinTopUp':
            item.value = parseFloat(item.value);
            break;
          default:
            break;
        }
        newInputs[item.key] = item.value;
      });
      setInputs(newInputs);
      setOriginInputs(newInputs);
      // 
      if (
        typeof newInputs['fetch_setting.domain_filter_mode'] !== 'undefined'
      ) {
        setDomainFilterMode(!!newInputs['fetch_setting.domain_filter_mode']);
      }
      if (typeof newInputs['fetch_setting.ip_filter_mode'] !== 'undefined') {
        setIpFilterMode(!!newInputs['fetch_setting.ip_filter_mode']);
      }
      if (formApiRef.current) {
        formApiRef.current.setValues(newInputs);
      }
      setIsLoaded(true);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    getOptions();
  }, []);

  const updateOptions = async (options) => {
    setLoading(true);
    try {
      //  checkbox 
      const checkboxOptions = options.filter((opt) =>
        opt.key.toLowerCase().endsWith('enabled'),
      );
      const otherOptions = options.filter(
        (opt) => !opt.key.toLowerCase().endsWith('enabled'),
      );

      //  checkbox 
      for (const opt of checkboxOptions) {
        const res = await API.put('/api/option/', {
          key: opt.key,
          value: opt.value.toString(),
        });
        if (!res.data.success) {
          showError(res.data.message);
          return;
        }
      }

      // 
      if (otherOptions.length > 0) {
        const requestQueue = otherOptions.map((opt) =>
          API.put('/api/option/', {
            key: opt.key,
            value:
              typeof opt.value === 'boolean' ? opt.value.toString() : opt.value,
          }),
        );

        const results = await Promise.all(requestQueue);

        // 
        const errorResults = results.filter((res) => !res.data.success);
        errorResults.forEach((res) => {
          showError(res.data.message);
        });
      }

      showSuccess(t(''));
      // 
      const newInputs = { ...inputs };
      options.forEach((opt) => {
        newInputs[opt.key] = opt.value;
      });
      setInputs(newInputs);
    } catch (error) {
      showError(t(''));
    }
    setLoading(false);
  };

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitWorker = async () => {
    let WorkerUrl = removeTrailingSlash(inputs.WorkerUrl);
    const options = [
      { key: 'WorkerUrl', value: WorkerUrl },
      {
        key: 'WorkerAllowHttpImageRequestEnabled',
        value: inputs.WorkerAllowHttpImageRequestEnabled ? 'true' : 'false',
      },
    ];
    if (inputs.WorkerValidKey !== '' || WorkerUrl === '') {
      options.push({ key: 'WorkerValidKey', value: inputs.WorkerValidKey });
    }
    await updateOptions(options);
  };

  const submitServerAddress = async () => {
    let ServerAddress = removeTrailingSlash(inputs.ServerAddress);
    await updateOptions([{ key: 'ServerAddress', value: ServerAddress }]);
  };

  const submitSMTP = async () => {
    const options = [];
    const smtpSecurityMode = inputs.SMTPSSLEnabled
      ? 'ssl_tls'
      : inputs.SMTPStartTLSEnabled
        ? 'starttls'
        : 'none';
    const nextSMTPSSLEnabled = smtpSecurityMode === 'ssl_tls';
    const nextSMTPStartTLSEnabled = smtpSecurityMode === 'starttls';

    if (originInputs['SMTPServer'] !== inputs.SMTPServer) {
      options.push({ key: 'SMTPServer', value: inputs.SMTPServer });
    }
    if (originInputs['SMTPAccount'] !== inputs.SMTPAccount) {
      options.push({ key: 'SMTPAccount', value: inputs.SMTPAccount });
    }
    if (originInputs['SMTPFrom'] !== inputs.SMTPFrom) {
      options.push({ key: 'SMTPFrom', value: inputs.SMTPFrom });
    }
    if (
      originInputs['SMTPPort'] !== inputs.SMTPPort &&
      inputs.SMTPPort !== ''
    ) {
      options.push({ key: 'SMTPPort', value: inputs.SMTPPort });
    }
    if (
      originInputs['SMTPToken'] !== inputs.SMTPToken &&
      inputs.SMTPToken !== ''
    ) {
      options.push({ key: 'SMTPToken', value: inputs.SMTPToken });
    }
    if (originInputs['SMTPSSLEnabled'] !== nextSMTPSSLEnabled) {
      options.push({ key: 'SMTPSSLEnabled', value: nextSMTPSSLEnabled });
    }
    if (originInputs['SMTPStartTLSEnabled'] !== nextSMTPStartTLSEnabled) {
      options.push({
        key: 'SMTPStartTLSEnabled',
        value: nextSMTPStartTLSEnabled,
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitEmailDomainWhitelist = async () => {
    if (Array.isArray(emailDomainWhitelist)) {
      await updateOptions([
        {
          key: 'EmailDomainWhitelist',
          value: emailDomainWhitelist.join(','),
        },
      ]);
    } else {
      showError(t(''));
    }
  };

  const submitSSRF = async () => {
    const options = [];

    // 
    options.push({
      key: 'fetch_setting.domain_filter_mode',
      value: domainFilterMode,
    });
    if (Array.isArray(domainList)) {
      options.push({
        key: 'fetch_setting.domain_list',
        value: JSON.stringify(domainList),
      });
    }

    // IP
    options.push({
      key: 'fetch_setting.ip_filter_mode',
      value: ipFilterMode,
    });
    if (Array.isArray(ipList)) {
      options.push({
        key: 'fetch_setting.ip_list',
        value: JSON.stringify(ipList),
      });
    }

    // 
    if (Array.isArray(allowedPorts)) {
      options.push({
        key: 'fetch_setting.allowed_ports',
        value: JSON.stringify(allowedPorts),
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const handleAddEmail = () => {
    if (emailToAdd && emailToAdd.trim() !== '') {
      const domain = emailToAdd.trim();

      // 
      const domainRegex =
        /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
      if (!domainRegex.test(domain)) {
        showError(t(' gmail.com'));
        return;
      }

      // 
      if (emailDomainWhitelist.includes(domain)) {
        showError(t(''));
        return;
      }

      setEmailDomainWhitelist([...emailDomainWhitelist, domain]);
      setEmailToAdd('');
      showSuccess(t(''));
    }
  };

  const submitWeChat = async () => {
    const options = [];

    if (originInputs['WeChatServerAddress'] !== inputs.WeChatServerAddress) {
      options.push({
        key: 'WeChatServerAddress',
        value: removeTrailingSlash(inputs.WeChatServerAddress),
      });
    }
    if (
      originInputs['WeChatAccountQRCodeImageURL'] !==
      inputs.WeChatAccountQRCodeImageURL
    ) {
      options.push({
        key: 'WeChatAccountQRCodeImageURL',
        value: inputs.WeChatAccountQRCodeImageURL,
      });
    }
    if (
      originInputs['WeChatServerToken'] !== inputs.WeChatServerToken &&
      inputs.WeChatServerToken !== ''
    ) {
      options.push({
        key: 'WeChatServerToken',
        value: inputs.WeChatServerToken,
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitGitHubOAuth = async () => {
    const options = [];

    if (originInputs['GitHubClientId'] !== inputs.GitHubClientId) {
      options.push({ key: 'GitHubClientId', value: inputs.GitHubClientId });
    }
    if (
      originInputs['GitHubClientSecret'] !== inputs.GitHubClientSecret &&
      inputs.GitHubClientSecret !== ''
    ) {
      options.push({
        key: 'GitHubClientSecret',
        value: inputs.GitHubClientSecret,
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitDiscordOAuth = async () => {
    const options = [];

    if (originInputs['discord.client_id'] !== inputs['discord.client_id']) {
      options.push({
        key: 'discord.client_id',
        value: inputs['discord.client_id'],
      });
    }
    if (
      originInputs['discord.client_secret'] !==
        inputs['discord.client_secret'] &&
      inputs['discord.client_secret'] !== ''
    ) {
      options.push({
        key: 'discord.client_secret',
        value: inputs['discord.client_secret'],
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitOIDCSettings = async () => {
    if (inputs['oidc.well_known'] && inputs['oidc.well_known'] !== '') {
      if (
        !inputs['oidc.well_known'].startsWith('http://') &&
        !inputs['oidc.well_known'].startsWith('https://')
      ) {
        showError(t('Well-Known URL  http://  https:// '));
        return;
      }
      try {
        const res = await axios.create().get(inputs['oidc.well_known']);
        inputs['oidc.authorization_endpoint'] =
          res.data['authorization_endpoint'];
        inputs['oidc.token_endpoint'] = res.data['token_endpoint'];
        inputs['oidc.user_info_endpoint'] = res.data['userinfo_endpoint'];
        showSuccess(t(' OIDC '));
      } catch (err) {
        console.error(err);
        showError(
          t(' OIDC  Well-Known URL '),
        );
        return;
      }
    }

    const options = [];

    if (originInputs['oidc.well_known'] !== inputs['oidc.well_known']) {
      options.push({
        key: 'oidc.well_known',
        value: inputs['oidc.well_known'],
      });
    }
    if (originInputs['oidc.client_id'] !== inputs['oidc.client_id']) {
      options.push({ key: 'oidc.client_id', value: inputs['oidc.client_id'] });
    }
    if (
      originInputs['oidc.client_secret'] !== inputs['oidc.client_secret'] &&
      inputs['oidc.client_secret'] !== ''
    ) {
      options.push({
        key: 'oidc.client_secret',
        value: inputs['oidc.client_secret'],
      });
    }
    if (
      originInputs['oidc.authorization_endpoint'] !==
      inputs['oidc.authorization_endpoint']
    ) {
      options.push({
        key: 'oidc.authorization_endpoint',
        value: inputs['oidc.authorization_endpoint'],
      });
    }
    if (originInputs['oidc.token_endpoint'] !== inputs['oidc.token_endpoint']) {
      options.push({
        key: 'oidc.token_endpoint',
        value: inputs['oidc.token_endpoint'],
      });
    }
    if (
      originInputs['oidc.user_info_endpoint'] !==
      inputs['oidc.user_info_endpoint']
    ) {
      options.push({
        key: 'oidc.user_info_endpoint',
        value: inputs['oidc.user_info_endpoint'],
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitTelegramSettings = async () => {
    const options = [
      { key: 'TelegramBotToken', value: inputs.TelegramBotToken },
      { key: 'TelegramBotName', value: inputs.TelegramBotName },
    ];
    await updateOptions(options);
  };

  const submitTurnstile = async () => {
    const options = [];

    if (originInputs['TurnstileSiteKey'] !== inputs.TurnstileSiteKey) {
      options.push({ key: 'TurnstileSiteKey', value: inputs.TurnstileSiteKey });
    }
    if (
      originInputs['TurnstileSecretKey'] !== inputs.TurnstileSecretKey &&
      inputs.TurnstileSecretKey !== ''
    ) {
      options.push({
        key: 'TurnstileSecretKey',
        value: inputs.TurnstileSecretKey,
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitLinuxDOOAuth = async () => {
    const options = [];

    if (originInputs['LinuxDOClientId'] !== inputs.LinuxDOClientId) {
      options.push({ key: 'LinuxDOClientId', value: inputs.LinuxDOClientId });
    }
    if (
      originInputs['LinuxDOClientSecret'] !== inputs.LinuxDOClientSecret &&
      inputs.LinuxDOClientSecret !== ''
    ) {
      options.push({
        key: 'LinuxDOClientSecret',
        value: inputs.LinuxDOClientSecret,
      });
    }
    if (
      originInputs['LinuxDOMinimumTrustLevel'] !==
      inputs.LinuxDOMinimumTrustLevel
    ) {
      options.push({
        key: 'LinuxDOMinimumTrustLevel',
        value: inputs.LinuxDOMinimumTrustLevel,
      });
    }

    if (options.length > 0) {
      await updateOptions(options);
    }
  };

  const submitPasskeySettings = async () => {
    // formApi
    const formValues = formApiRef.current?.getValues() || {};

    const options = [];

    options.push({
      key: 'passkey.rp_display_name',
      value:
        formValues['passkey.rp_display_name'] ||
        inputs['passkey.rp_display_name'] ||
        '',
    });
    options.push({
      key: 'passkey.rp_id',
      value: formValues['passkey.rp_id'] || inputs['passkey.rp_id'] || '',
    });
    options.push({
      key: 'passkey.user_verification',
      value:
        formValues['passkey.user_verification'] ||
        inputs['passkey.user_verification'] ||
        'preferred',
    });
    options.push({
      key: 'passkey.attachment_preference',
      value:
        formValues['passkey.attachment_preference'] ||
        inputs['passkey.attachment_preference'] ||
        '',
    });
    options.push({
      key: 'passkey.origins',
      value: formValues['passkey.origins'] || inputs['passkey.origins'] || '',
    });

    await updateOptions(options);
  };

  const handleCheckboxChange = async (optionKey, event) => {
    const value = event.target.checked;

    if (optionKey === 'PasswordLoginEnabled' && !value) {
      setShowPasswordLoginConfirmModal(true);
    } else {
      await updateOptions([{ key: optionKey, value }]);
    }
    if (optionKey === 'LinuxDOOAuthEnabled') {
      setLinuxDOOAuthEnabled(value);
    }
  };

  const handleSMTPSecurityModeChange = async (event) => {
    const mode = event && event.target ? event.target.value : event;
    const nextSMTPSSLEnabled = mode === 'ssl_tls';
    const nextSMTPStartTLSEnabled = mode === 'starttls';

    formApiRef.current?.setValue('SMTPSSLEnabled', nextSMTPSSLEnabled);
    formApiRef.current?.setValue(
      'SMTPStartTLSEnabled',
      nextSMTPStartTLSEnabled,
    );

    await updateOptions([
      { key: 'SMTPSSLEnabled', value: nextSMTPSSLEnabled },
      { key: 'SMTPStartTLSEnabled', value: nextSMTPStartTLSEnabled },
    ]);
  };

  const handlePasswordLoginConfirm = async () => {
    await updateOptions([{ key: 'PasswordLoginEnabled', value: false }]);
    setShowPasswordLoginConfirmModal(false);
  };

  return (
    <div>
      {isLoaded ? (
        <Form
          initValues={inputs}
          onValueChange={handleFormChange}
          getFormApi={(api) => (formApiRef.current = api)}
        >
          {({ formState, values, formApi }) => (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                marginTop: '10px',
              }}
            >
              <Card>
                <Form.Section text={t('')}>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Input
                        field='ServerAddress'
                        label={t('')}
                        placeholder='https://yourdomain.com'
                        extraText={t(
                          '',
                        )}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitServerAddress}>
                    {t('')}
                  </Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t('')}>
                  <Banner
                    type='info'
                    description={t(
                      'WebhookAI API',
                    )}
                    style={{ marginBottom: 20, marginTop: 16 }}
                  />
                  <Text>
                    {t('')}{' '}
                    <a
                      href='https://github.com/Calcium-Ion/new-api-worker'
                      target='_blank'
                      rel='noreferrer'
                    >
                      new-api-worker
                    </a>{' '}
                    {t('new-api-worker')}
                  </Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='WorkerUrl'
                        label={t('Worker')}
                        placeholder='https://workername.yourdomain.workers.dev'
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='WorkerValidKey'
                        label={t('Worker')}
                        placeholder=''
                        type='password'
                      />
                    </Col>
                  </Row>
                  <Form.Checkbox
                    field='WorkerAllowHttpImageRequestEnabled'
                    noLabel
                  >
                    {t(' HTTP ')}
                  </Form.Checkbox>
                  <Button onClick={submitWorker}>{t('Worker')}</Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t('SSRF')}>
                  <Text extraText={t('SSRF')}>
                    {t('(SSRF)')}
                  </Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Checkbox
                        field='fetch_setting.enable_ssrf_protection'
                        noLabel
                        extraText={t('SSRF')}
                        onChange={(e) =>
                          handleCheckboxChange(
                            'fetch_setting.enable_ssrf_protection',
                            e,
                          )
                        }
                      >
                        {t('SSRF')}
                      </Form.Checkbox>
                    </Col>
                  </Row>

                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Checkbox
                        field='fetch_setting.allow_private_ip'
                        noLabel
                        extraText={t('IP')}
                        onChange={(e) =>
                          handleCheckboxChange(
                            'fetch_setting.allow_private_ip',
                            e,
                          )
                        }
                      >
                        {t(
                          'IP127.0.0.1192.168.x.x',
                        )}
                      </Form.Checkbox>
                    </Col>
                  </Row>

                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Checkbox
                        field='fetch_setting.apply_ip_filter_for_domain'
                        noLabel
                        extraText={t('IP')}
                        onChange={(e) =>
                          handleCheckboxChange(
                            'fetch_setting.apply_ip_filter_for_domain',
                            e,
                          )
                        }
                        style={{ marginBottom: 8 }}
                      >
                        {t(' IP ')}
                      </Form.Checkbox>
                      <Text strong>
                        {t(domainFilterMode ? '' : '')}
                      </Text>
                      <Text
                        type='secondary'
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        {t(
                          'example.com, *.api.example.com',
                        )}
                      </Text>
                      <Radio.Group
                        type='button'
                        value={domainFilterMode ? 'whitelist' : 'blacklist'}
                        onChange={(val) => {
                          const selected =
                            val && val.target ? val.target.value : val;
                          const isWhitelist = selected === 'whitelist';
                          setDomainFilterMode(isWhitelist);
                          setInputs((prev) => ({
                            ...prev,
                            'fetch_setting.domain_filter_mode': isWhitelist,
                          }));
                        }}
                        style={{ marginBottom: 8 }}
                      >
                        <Radio value='whitelist'>{t('')}</Radio>
                        <Radio value='blacklist'>{t('')}</Radio>
                      </Radio.Group>
                      <TagInput
                        value={domainList}
                        onChange={(value) => {
                          setDomainList(value);
                          // FormonChange
                          setInputs((prev) => ({
                            ...prev,
                            'fetch_setting.domain_list': value,
                          }));
                        }}
                        placeholder={t('example.com')}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Text strong>
                        {t(ipFilterMode ? 'IP' : 'IP')}
                      </Text>
                      <Text
                        type='secondary'
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        {t('CIDR8.8.8.8, 192.168.1.0/24')}
                      </Text>
                      <Radio.Group
                        type='button'
                        value={ipFilterMode ? 'whitelist' : 'blacklist'}
                        onChange={(val) => {
                          const selected =
                            val && val.target ? val.target.value : val;
                          const isWhitelist = selected === 'whitelist';
                          setIpFilterMode(isWhitelist);
                          setInputs((prev) => ({
                            ...prev,
                            'fetch_setting.ip_filter_mode': isWhitelist,
                          }));
                        }}
                        style={{ marginBottom: 8 }}
                      >
                        <Radio value='whitelist'>{t('')}</Radio>
                        <Radio value='blacklist'>{t('')}</Radio>
                      </Radio.Group>
                      <TagInput
                        value={ipList}
                        onChange={(value) => {
                          setIpList(value);
                          // FormonChange
                          setInputs((prev) => ({
                            ...prev,
                            'fetch_setting.ip_list': value,
                          }));
                        }}
                        placeholder={t('IP8.8.8.8')}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  </Row>

                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Text strong>{t('')}</Text>
                      <Text
                        type='secondary'
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        {t('80, 443, 8000-8999')}
                      </Text>
                      <TagInput
                        value={allowedPorts}
                        onChange={(value) => {
                          setAllowedPorts(value);
                          // FormonChange
                          setInputs((prev) => ({
                            ...prev,
                            'fetch_setting.allowed_ports': value,
                          }));
                        }}
                        placeholder={t('80  8000-8999')}
                        style={{ width: '100%' }}
                      />
                      <Text
                        type='secondary'
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        {t('')}
                      </Text>
                    </Col>
                  </Row>

                  <Button onClick={submitSSRF} style={{ marginTop: 16 }}>
                    {t('SSRF')}
                  </Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t('')}>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Checkbox
                        field='PasswordLoginEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('PasswordLoginEnabled', e)
                        }
                      >
                        {t('')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='PasswordRegisterEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('PasswordRegisterEnabled', e)
                        }
                      >
                        {t('')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='EmailVerificationEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('EmailVerificationEnabled', e)
                        }
                      >
                        {t('')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='RegisterEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('RegisterEnabled', e)
                        }
                      >
                        {t('')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='TurnstileCheckEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('TurnstileCheckEnabled', e)
                        }
                      >
                        {t(' Turnstile ')}
                      </Form.Checkbox>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Checkbox
                        field='GitHubOAuthEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('GitHubOAuthEnabled', e)
                        }
                      >
                        {t(' GitHub  & ')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='discord.enabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('discord.enabled', e)
                        }
                      >
                        {t(' Discord  & ')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='LinuxDOOAuthEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('LinuxDOOAuthEnabled', e)
                        }
                      >
                        {t(' Linux DO  & ')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='WeChatAuthEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('WeChatAuthEnabled', e)
                        }
                      >
                        {t(' & ')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field='TelegramOAuthEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('TelegramOAuthEnabled', e)
                        }
                      >
                        {t(' Telegram ')}
                      </Form.Checkbox>
                      <Form.Checkbox
                        field="['oidc.enabled']"
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('oidc.enabled', e)
                        }
                      >
                        {t(' OIDC ')}
                      </Form.Checkbox>
                    </Col>
                  </Row>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t(' Passkey')}>
                  <Text>{t(' WebAuthn ')}</Text>
                  <Banner
                    type='info'
                    description={t(
                      'Passkey  WebAuthn ',
                    )}
                    style={{ marginBottom: 20, marginTop: 16 }}
                  />
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Checkbox
                        field="['passkey.enabled']"
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('passkey.enabled', e)
                        }
                      >
                        {t(' Passkey  & ')}
                      </Form.Checkbox>
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['passkey.rp_display_name']"
                        label={t('')}
                        placeholder={t('')}
                        extraText={t(
                          "''",
                        )}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['passkey.rp_id']"
                        label={t('')}
                        placeholder={t('example.com')}
                        extraText={t(
                          'http://https://',
                        )}
                      />
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Select
                        field="['passkey.user_verification']"
                        label={t('')}
                        placeholder={t('/')}
                        optionList={[
                          {
                            label: t(''),
                            value: 'preferred',
                          },
                          { label: t(''), value: 'required' },
                          { label: t(''), value: 'discouraged' },
                        ]}
                        extraText={t('')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Select
                        field="['passkey.attachment_preference']"
                        label={t('')}
                        placeholder={t('')}
                        optionList={[
                          { label: t(''), value: '' },
                          { label: t(''), value: 'platform' },
                          { label: t(''), value: 'cross-platform' },
                        ]}
                        extraText={t(
                          '/USB',
                        )}
                      />
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Checkbox
                        field="['passkey.allow_insecure_origin']"
                        noLabel
                        extraText={t(' HTTPS')}
                        onChange={(e) =>
                          handleCheckboxChange(
                            'passkey.allow_insecure_origin',
                            e,
                          )
                        }
                      >
                        {t(' OriginHTTP')}
                      </Form.Checkbox>
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={24} lg={24} xl={24}>
                      <Form.Input
                        field="['passkey.origins']"
                        label={t(' Origins')}
                        placeholder={t('https')}
                        extraText={t(
                          ' Origin  https://solqora.pro,https://solqora.com ,[]https',
                        )}
                      />
                    </Col>
                  </Row>
                  <Button
                    onClick={submitPasskeySettings}
                    style={{ marginTop: 16 }}
                  >
                    {t(' Passkey ')}
                  </Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t('')}>
                  <Text>{t('')}</Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Checkbox
                        field='EmailDomainRestrictionEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange(
                            'EmailDomainRestrictionEnabled',
                            e,
                          )
                        }
                      >
                        
                      </Form.Checkbox>
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Checkbox
                        field='EmailAliasRestrictionEnabled'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange(
                            'EmailAliasRestrictionEnabled',
                            e,
                          )
                        }
                      >
                        
                      </Form.Checkbox>
                    </Col>
                  </Row>
                  <TagInput
                    value={emailDomainWhitelist}
                    onChange={setEmailDomainWhitelist}
                    placeholder={t('')}
                    style={{ width: '100%', marginTop: 16 }}
                  />
                  <Form.Input
                    placeholder={t('')}
                    value={emailToAdd}
                    onChange={(value) => setEmailToAdd(value)}
                    style={{ marginTop: 16 }}
                    suffix={
                      <Button
                        theme='solid'
                        type='primary'
                        onClick={handleAddEmail}
                      >
                        {t('')}
                      </Button>
                    }
                    onEnterPress={handleAddEmail}
                  />
                  <Button
                    onClick={submitEmailDomainWhitelist}
                    style={{ marginTop: 10 }}
                  >
                    {t('')}
                  </Button>
                </Form.Section>
              </Card>
              <Card>
                <Form.Section text={t(' SMTP')}>
                  <Text>{t('')}</Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input
                        field='SMTPServer'
                        label={t('SMTP ')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input field='SMTPPort' label={t('SMTP ')} />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input field='SMTPAccount' label={t('SMTP ')} />
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                    style={{ marginTop: 16 }}
                  >
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input
                        field='SMTPFrom'
                        label={t('SMTP ')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input
                        field='SMTPToken'
                        label={t('SMTP ')}
                        type='password'
                        placeholder=''
                      />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Text strong>{t('SMTP ')}</Text>
                      <Radio.Group
                        type='button'
                        value={
                          inputs.SMTPSSLEnabled
                            ? 'ssl_tls'
                            : inputs.SMTPStartTLSEnabled
                              ? 'starttls'
                              : 'none'
                        }
                        onChange={handleSMTPSecurityModeChange}
                        style={{ marginTop: 8, marginBottom: 8 }}
                      >
                        <Radio value='none'>{t('')}</Radio>
                        <Radio value='ssl_tls'>{t('SSL/TLS')}</Radio>
                        <Radio value='starttls'>{t('STARTTLS')}</Radio>
                      </Radio.Group>
                      <Text
                        type='secondary'
                        size='small'
                        style={{ display: 'block', marginBottom: 8 }}
                      >
                        {t(' SMTP ')}
                      </Text>
                      <Form.Checkbox
                        field='SMTPForceAuthLogin'
                        noLabel
                        onChange={(e) =>
                          handleCheckboxChange('SMTPForceAuthLogin', e)
                        }
                      >
                        {t(' AUTH LOGIN')}
                      </Form.Checkbox>
                    </Col>
                  </Row>
                  <Button onClick={submitSMTP}>{t(' SMTP ')}</Button>
                </Form.Section>
              </Card>
              <Card>
                <Form.Section text={t(' OIDC')}>
                  <Text>
                    {t(
                      ' OIDC  OktaAuth0  OIDC  IdP',
                    )}
                  </Text>
                  <Banner
                    type='info'
                    description={`${t('')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}${t(' URL ')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}/oauth/oidc`}
                    style={{ marginBottom: 20, marginTop: 16 }}
                  />
                  <Text>
                    {t(
                      ' OIDC Provider  Discovery Endpoint OIDC Well-Known URL OIDC ',
                    )}
                  </Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['oidc.well_known']"
                        label={t('Well-Known URL')}
                        placeholder={t(' OIDC  Well-Known URL')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['oidc.client_id']"
                        label={t('Client ID')}
                        placeholder={t(' OIDC  Client ID')}
                      />
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['oidc.client_secret']"
                        label={t('Client Secret')}
                        type='password'
                        placeholder={t('')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['oidc.authorization_endpoint']"
                        label={t('Authorization Endpoint')}
                        placeholder={t(' OIDC  Authorization Endpoint')}
                      />
                    </Col>
                  </Row>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['oidc.token_endpoint']"
                        label={t('Token Endpoint')}
                        placeholder={t(' OIDC  Token Endpoint')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['oidc.user_info_endpoint']"
                        label={t('User Info Endpoint')}
                        placeholder={t(' OIDC  Userinfo Endpoint')}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitOIDCSettings}>
                    {t(' OIDC ')}
                  </Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t(' GitHub OAuth App')}>
                  <Text>{t(' GitHub ')}</Text>
                  <Banner
                    type='info'
                    description={`${t('Homepage URL ')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}${t('Authorization callback URL ')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}/oauth/github`}
                    style={{ marginBottom: 20, marginTop: 16 }}
                  />
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='GitHubClientId'
                        label={t('GitHub Client ID')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='GitHubClientSecret'
                        label={t('GitHub Client Secret')}
                        type='password'
                        placeholder={t('')}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitGitHubOAuth}>
                    {t(' GitHub OAuth ')}
                  </Button>
                </Form.Section>
              </Card>
              <Card>
                <Form.Section text={t(' Discord OAuth')}>
                  <Text>{t(' Discord ')}</Text>
                  <Banner
                    type='info'
                    description={`${t('Homepage URL ')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}${t('Authorization callback URL ')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}/oauth/discord`}
                    style={{ marginBottom: 20, marginTop: 16 }}
                  />
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['discord.client_id']"
                        label={t('Discord Client ID')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field="['discord.client_secret']"
                        label={t('Discord Client Secret')}
                        type='password'
                        placeholder={t('')}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitDiscordOAuth}>
                    {t(' Discord OAuth ')}
                  </Button>
                </Form.Section>
              </Card>
              <Card>
                <Form.Section text={t(' Linux DO OAuth')}>
                  <Text>
                    {t(' Linux DO ')}
                    <a
                      href='https://connect.linux.do/'
                      target='_blank'
                      rel='noreferrer'
                      style={{
                        display: 'inline-block',
                        marginLeft: 4,
                        marginRight: 4,
                      }}
                    >
                      {t('')}
                    </a>
                    {t(' LinuxDO OAuth App')}
                  </Text>
                  <Banner
                    type='info'
                    description={`${t(' URL ')} ${inputs.ServerAddress ? inputs.ServerAddress : t('')}/oauth/linuxdo`}
                    style={{ marginBottom: 20, marginTop: 16 }}
                  />
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={10} lg={10} xl={10}>
                      <Form.Input
                        field='LinuxDOClientId'
                        label={t('Linux DO Client ID')}
                        placeholder={t(' LinuxDO OAuth APP  ID')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={10} lg={10} xl={10}>
                      <Form.Input
                        field='LinuxDOClientSecret'
                        label={t('Linux DO Client Secret')}
                        type='password'
                        placeholder={t('')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={4} lg={4} xl={4}>
                      <Form.Input
                        field='LinuxDOMinimumTrustLevel'
                        label='LinuxDO Minimum Trust Level'
                        placeholder=''
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitLinuxDOOAuth}>
                    {t(' Linux DO OAuth ')}
                  </Button>
                </Form.Section>
              </Card>

              <CustomOAuthSetting serverAddress={inputs.ServerAddress} />

              <Card>
                <Form.Section text={t(' WeChat Server')}>
                  <Text>{t('')}</Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input
                        field='WeChatServerAddress'
                        label={t('WeChat Server ')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input
                        field='WeChatServerToken'
                        label={t('WeChat Server ')}
                        type='password'
                        placeholder={t('')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={8} xl={8}>
                      <Form.Input
                        field='WeChatAccountQRCodeImageURL'
                        label={t('')}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitWeChat}>
                    {t(' WeChat Server ')}
                  </Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t(' Telegram ')}>
                  <Text>{t(' Telegram ')}</Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='TelegramBotToken'
                        label={t('Telegram Bot Token')}
                        placeholder={t('')}
                        type='password'
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='TelegramBotName'
                        label={t('Telegram Bot ')}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitTelegramSettings}>
                    {t(' Telegram ')}
                  </Button>
                </Form.Section>
              </Card>

              <Card>
                <Form.Section text={t(' Turnstile')}>
                  <Text>{t('')}</Text>
                  <Row
                    gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}
                  >
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='TurnstileSiteKey'
                        label={t('Turnstile Site Key')}
                      />
                    </Col>
                    <Col xs={24} sm={24} md={12} lg={12} xl={12}>
                      <Form.Input
                        field='TurnstileSecretKey'
                        label={t('Turnstile Secret Key')}
                        type='password'
                        placeholder={t('')}
                      />
                    </Col>
                  </Row>
                  <Button onClick={submitTurnstile}>
                    {t(' Turnstile ')}
                  </Button>
                </Form.Section>
              </Card>

              <Modal
                title={t('')}
                visible={showPasswordLoginConfirmModal}
                onOk={handlePasswordLoginConfirm}
                onCancel={() => {
                  setShowPasswordLoginConfirmModal(false);
                  formApiRef.current.setValue('PasswordLoginEnabled', true);
                }}
                okText={t('')}
                cancelText={t('')}
              >
                <p>
                  {t(
                    '',
                  )}
                </p>
              </Modal>
            </div>
          )}
        </Form>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <Spin size='large' />
        </div>
      )}
    </div>
  );
};

export default SystemSetting;

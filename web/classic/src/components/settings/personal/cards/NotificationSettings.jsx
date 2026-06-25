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

import React, { useRef, useEffect, useState, useContext } from 'react';
import {
  Button,
  Typography,
  Card,
  Avatar,
  Form,
  Radio,
  Toast,
  Tabs,
  TabPane,
  Switch,
  Row,
  Col,
} from '@douyinfe/semi-ui';
import { IconMail, IconKey, IconBell, IconLink } from '@douyinfe/semi-icons';
import { ShieldCheck, Bell, DollarSign, Settings } from 'lucide-react';
import {
  renderQuotaWithPrompt,
  API,
  showSuccess,
  showError,
} from '../../../../helpers';
import CodeViewer from '../../../playground/CodeViewer';
import { StatusContext } from '../../../../context/Status';
import { UserContext } from '../../../../context/User';
import { useUserPermissions } from '../../../../hooks/common/useUserPermissions';
import {
  mergeAdminConfig,
  useSidebar,
} from '../../../../hooks/common/useSidebar';

const NotificationSettings = ({
  t,
  notificationSettings,
  handleNotificationSettingChange,
  saveNotificationSettings,
}) => {
  const formApiRef = useRef(null);
  const [statusState] = useContext(StatusContext);
  const [userState] = useContext(UserContext);
  const isAdminOrRoot = (userState?.user?.role || 0) >= 10;

  // 
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('notification');
  const [sidebarModulesUser, setSidebarModulesUser] = useState({
    chat: {
      enabled: true,
      playground: true,
      chat: true,
    },
    console: {
      enabled: true,
      detail: true,
      token: true,
      log: true,
      midjourney: true,
      task: true,
    },
    personal: {
      enabled: true,
      topup: true,
      personal: true,
    },
    admin: {
      enabled: true,
      channel: true,
      models: true,
      deployment: true,
      subscription: true,
      redemption: true,
      user: true,
      setting: true,
    },
  });
  const [adminConfig, setAdminConfig] = useState(null);

  // 
  const {
    permissions,
    loading: permissionsLoading,
    hasSidebarSettingsPermission,
    isSidebarSectionAllowed,
    isSidebarModuleAllowed,
  } = useUserPermissions();

  // useSidebar
  const { refreshUserConfig } = useSidebar();

  // 
  const handleSectionChange = (sectionKey) => {
    return (checked) => {
      const newModules = {
        ...sidebarModulesUser,
        [sectionKey]: {
          ...sidebarModulesUser[sectionKey],
          enabled: checked,
        },
      };
      setSidebarModulesUser(newModules);
    };
  };

  const handleModuleChange = (sectionKey, moduleKey) => {
    return (checked) => {
      const newModules = {
        ...sidebarModulesUser,
        [sectionKey]: {
          ...sidebarModulesUser[sectionKey],
          [moduleKey]: checked,
        },
      };
      setSidebarModulesUser(newModules);
    };
  };

  const saveSidebarSettings = async () => {
    setSidebarLoading(true);
    try {
      const res = await API.put('/api/user/self', {
        sidebar_modules: JSON.stringify(sidebarModulesUser),
      });
      if (res.data.success) {
        showSuccess(t(''));

        // useSidebar
        await refreshUserConfig();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(t(''));
    }
    setSidebarLoading(false);
  };

  const resetSidebarModules = () => {
    const defaultConfig = {
      chat: { enabled: true, playground: true, chat: true },
      console: {
        enabled: true,
        detail: true,
        token: true,
        log: true,
        midjourney: true,
        task: true,
      },
      personal: { enabled: true, topup: true, personal: true },
      admin: {
        enabled: true,
        channel: true,
        models: true,
        deployment: true,
        subscription: true,
        redemption: true,
        user: true,
        setting: true,
      },
    };
    setSidebarModulesUser(defaultConfig);
  };

  // 
  useEffect(() => {
    const loadSidebarConfigs = async () => {
      try {
        // 
        if (statusState?.status?.SidebarModulesAdmin) {
          try {
            const adminConf = JSON.parse(
              statusState.status.SidebarModulesAdmin,
            );
            setAdminConfig(mergeAdminConfig(adminConf));
          } catch (error) {
            setAdminConfig(mergeAdminConfig(null));
          }
        } else {
          setAdminConfig(mergeAdminConfig(null));
        }

        // 
        const userRes = await API.get('/api/user/self');
        if (userRes.data.success && userRes.data.data.sidebar_modules) {
          let userConf;
          if (typeof userRes.data.data.sidebar_modules === 'string') {
            userConf = JSON.parse(userRes.data.data.sidebar_modules);
          } else {
            userConf = userRes.data.data.sidebar_modules;
          }
          setSidebarModulesUser(userConf);
        }
      } catch (error) {
        console.error(':', error);
      }
    };

    loadSidebarConfigs();
  }, [statusState]);

  // 
  useEffect(() => {
    if (formApiRef.current && notificationSettings) {
      formApiRef.current.setValues(notificationSettings);
    }
  }, [notificationSettings]);

  // 
  const handleFormChange = (field, value) => {
    handleNotificationSettingChange(field, value);
  };

  // 
  const isAllowedByAdmin = (sectionKey, moduleKey = null) => {
    if (!adminConfig) return true;

    if (moduleKey) {
      return (
        adminConfig[sectionKey]?.enabled && adminConfig[sectionKey]?.[moduleKey]
      );
    } else {
      return adminConfig[sectionKey]?.enabled;
    }
  };

  // 
  const sectionConfigs = [
    {
      key: 'chat',
      title: t(''),
      description: t(''),
      modules: [
        {
          key: 'playground',
          title: t(''),
          description: t('AI'),
        },
        { key: 'chat', title: t(''), description: t('') },
      ],
    },
    {
      key: 'console',
      title: t(''),
      description: t(''),
      modules: [
        { key: 'detail', title: t(''), description: t('') },
        { key: 'token', title: t(''), description: t('API') },
        { key: 'log', title: t(''), description: t('API') },
        {
          key: 'midjourney',
          title: t(''),
          description: t(''),
        },
        { key: 'task', title: t(''), description: t('') },
      ],
    },
    {
      key: 'personal',
      title: t(''),
      description: t(''),
      modules: [
        { key: 'topup', title: t(''), description: t('') },
        {
          key: 'personal',
          title: t(''),
          description: t(''),
        },
      ],
    },
    // 
    {
      key: 'admin',
      title: t(''),
      description: t(''),
      modules: [
        { key: 'channel', title: t(''), description: t('API') },
        { key: 'models', title: t(''), description: t('AI') },
        {
          key: 'deployment',
          title: t(''),
          description: t(''),
        },
        {
          key: 'subscription',
          title: t(''),
          description: t(''),
        },
        {
          key: 'redemption',
          title: t(''),
          description: t(''),
        },
        { key: 'user', title: t(''), description: t('') },
        {
          key: 'setting',
          title: t(''),
          description: t(''),
        },
      ],
    },
  ]
    .filter((section) => {
      // 
      return isSidebarSectionAllowed(section.key);
    })
    .map((section) => ({
      ...section,
      modules: section.modules.filter((module) =>
        isSidebarModuleAllowed(section.key, module.key),
      ),
    }))
    .filter(
      (section) =>
        // 
        section.modules.length > 0 && isAllowedByAdmin(section.key),
    );

  // 
  const handleSubmit = () => {
    if (formApiRef.current) {
      formApiRef.current
        .validate()
        .then(() => {
          saveNotificationSettings();
        })
        .catch((errors) => {
          console.log(':', errors);
          Toast.error(t(''));
        });
    } else {
      saveNotificationSettings();
    }
  };

  return (
    <Card
      className='!rounded-2xl shadow-sm border-0'
      footer={
        <div className='flex justify-end gap-3'>
          {activeTabKey === 'sidebar' ? (
            // 
            <>
              <Button
                type='tertiary'
                onClick={resetSidebarModules}
                className='!rounded-lg'
              >
                {t('')}
              </Button>
              <Button
                type='primary'
                onClick={saveSidebarSettings}
                loading={sidebarLoading}
                className='!rounded-lg'
              >
                {t('')}
              </Button>
            </>
          ) : (
            // 
            <Button type='primary' onClick={handleSubmit}>
              {t('')}
            </Button>
          )}
        </div>
      }
    >
      {/*  */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='blue' className='mr-3 shadow-md'>
          <Bell size={16} />
        </Avatar>
        <div>
          <Typography.Text className='text-lg font-medium'>
            {t('')}
          </Typography.Text>
          <div className='text-xs text-gray-600'>
            {t('')}
          </div>
        </div>
      </div>

      <Form
        getFormApi={(api) => (formApiRef.current = api)}
        initValues={notificationSettings}
        onSubmit={handleSubmit}
      >
        {() => (
          <Tabs
            type='card'
            defaultActiveKey='notification'
            onChange={(key) => setActiveTabKey(key)}
          >
            {/*  Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <Bell size={16} className='mr-2' />
                  {t('')}
                </div>
              }
              itemKey='notification'
            >
              <div className='py-4'>
                <Form.RadioGroup
                  field='warningType'
                  label={t('')}
                  initValue={notificationSettings.warningType}
                  onChange={(value) => handleFormChange('warningType', value)}
                  rules={[{ required: true, message: t('') }]}
                >
                  <Radio value='email'>{t('')}</Radio>
                  <Radio value='webhook'>{t('Webhook')}</Radio>
                  <Radio value='bark'>{t('Bark')}</Radio>
                  <Radio value='gotify'>{t('Gotify')}</Radio>
                </Form.RadioGroup>

                <Form.AutoComplete
                  field='warningThreshold'
                  label={
                    <span>
                      {t('')}{' '}
                      {renderQuotaWithPrompt(
                        notificationSettings.warningThreshold,
                      )}
                    </span>
                  }
                  placeholder={t('')}
                  data={[
                    { value: 100000, label: '0.2$' },
                    { value: 500000, label: '1$' },
                    { value: 1000000, label: '2$' },
                    { value: 5000000, label: '10$' },
                  ]}
                  onChange={(val) => handleFormChange('warningThreshold', val)}
                  prefix={<IconBell />}
                  extraText={t(
                    '',
                  )}
                  style={{ width: '100%', maxWidth: '300px' }}
                  rules={[
                    { required: true, message: t('') },
                    {
                      validator: (rule, value) => {
                        const numValue = Number(value);
                        if (isNaN(numValue) || numValue <= 0) {
                          return Promise.reject(t(''));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                />

                {isAdminOrRoot && (
                  <Form.Switch
                    field='upstreamModelUpdateNotifyEnabled'
                    label={t('')}
                    checkedText={t('')}
                    uncheckedText={t('')}
                    onChange={(value) =>
                      handleFormChange('upstreamModelUpdateNotifyEnabled', value)
                    }
                    extraText={t(
                      '',
                    )}
                  />
                )}

                {/*  */}
                {notificationSettings.warningType === 'email' && (
                  <Form.Input
                    field='notificationEmail'
                    label={t('')}
                    placeholder={t('')}
                    onChange={(val) =>
                      handleFormChange('notificationEmail', val)
                    }
                    prefix={<IconMail />}
                    extraText={t(
                      '',
                    )}
                    showClear
                  />
                )}

                {/* Webhook */}
                {notificationSettings.warningType === 'webhook' && (
                  <>
                    <Form.Input
                      field='webhookUrl'
                      label={t('Webhook')}
                      placeholder={t(
                        'Webhook: https://example.com/webhook',
                      )}
                      onChange={(val) => handleFormChange('webhookUrl', val)}
                      prefix={<IconLink />}
                      extraText={t(
                        'HTTPSPOSTPOST',
                      )}
                      showClear
                      rules={[
                        {
                          required:
                            notificationSettings.warningType === 'webhook',
                          message: t('Webhook'),
                        },
                        {
                          pattern: /^https:\/\/.+/,
                          message: t('Webhookhttps://'),
                        },
                      ]}
                    />

                    <Form.Input
                      field='webhookSecret'
                      label={t('')}
                      placeholder={t('')}
                      onChange={(val) => handleFormChange('webhookSecret', val)}
                      prefix={<IconKey />}
                      extraText={t(
                        'Bearerwebhook',
                      )}
                      showClear
                    />

                    <Form.Slot label={t('Webhook')}>
                      <div>
                        <div style={{ height: '200px', marginBottom: '12px' }}>
                          <CodeViewer
                            content={{
                              type: 'quota_exceed',
                              title: '',
                              content:
                                ' {{value}}',
                              values: ['$0.99'],
                              timestamp: 1739950503,
                            }}
                            title='webhook'
                            language='json'
                          />
                        </div>
                        <div className='text-xs text-gray-500 leading-relaxed'>
                          <div>
                            <strong>type:</strong>{' '}
                            {t(' (quota_exceed: )')}{' '}
                          </div>
                          <div>
                            <strong>title:</strong> {t('')}
                          </div>
                          <div>
                            <strong>content:</strong>{' '}
                            {t(' {{value}} ')}
                          </div>
                          <div>
                            <strong>values:</strong>{' '}
                            {t('content')}
                          </div>
                          <div>
                            <strong>timestamp:</strong> {t('Unix')}
                          </div>
                        </div>
                      </div>
                    </Form.Slot>
                  </>
                )}

                {/* Bark */}
                {notificationSettings.warningType === 'bark' && (
                  <>
                    <Form.Input
                      field='barkUrl'
                      label={t('BarkURL')}
                      placeholder={t(
                        'BarkURL: https://api.day.app/yourkey/{{title}}/{{content}}',
                      )}
                      onChange={(val) => handleFormChange('barkUrl', val)}
                      prefix={<IconLink />}
                      extraText={t(
                        'HTTPHTTPS: {{title}} (), {{content}} ()',
                      )}
                      showClear
                      rules={[
                        {
                          required: notificationSettings.warningType === 'bark',
                          message: t('BarkURL'),
                        },
                        {
                          pattern: /^https?:\/\/.+/,
                          message: t('BarkURLhttp://https://'),
                        },
                      ]}
                    />

                    <div className='mt-3 p-4 bg-gray-50/50 rounded-xl'>
                      <div className='text-sm text-gray-700 mb-3'>
                        <strong>{t('')}</strong>
                      </div>
                      <div className='text-xs text-gray-600 font-mono bg-white p-3 rounded-lg shadow-sm mb-4'>
                        https://api.day.app/yourkey/{'{{title}}'}/
                        {'{{content}}'}?sound=alarm&group=quota
                      </div>
                      <div className='text-xs text-gray-500 space-y-2'>
                        <div>
                          • <strong>{'title'}:</strong> {t('')}
                        </div>
                        <div>
                          • <strong>{'content'}:</strong> {t('')}
                        </div>
                        <div className='mt-3 pt-3 border-t border-gray-200'>
                          <span className='text-gray-400'>
                            {t('')}
                          </span>{' '}
                          <a
                            href='https://github.com/Finb/Bark'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-500 hover:text-blue-600 font-medium'
                          >
                            Bark {t('')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Gotify */}
                {notificationSettings.warningType === 'gotify' && (
                  <>
                    <Form.Input
                      field='gotifyUrl'
                      label={t('Gotify')}
                      placeholder={t(
                        'Gotify: https://gotify.example.com',
                      )}
                      onChange={(val) => handleFormChange('gotifyUrl', val)}
                      prefix={<IconLink />}
                      extraText={t(
                        'HTTPHTTPSGotifyURL',
                      )}
                      showClear
                      rules={[
                        {
                          required:
                            notificationSettings.warningType === 'gotify',
                          message: t('Gotify'),
                        },
                        {
                          pattern: /^https?:\/\/.+/,
                          message: t(
                            'Gotifyhttp://https://',
                          ),
                        },
                      ]}
                    />

                    <Form.Input
                      field='gotifyToken'
                      label={t('Gotify')}
                      placeholder={t('Gotify')}
                      onChange={(val) => handleFormChange('gotifyToken', val)}
                      prefix={<IconKey />}
                      extraText={t(
                        'Gotify',
                      )}
                      showClear
                      rules={[
                        {
                          required:
                            notificationSettings.warningType === 'gotify',
                          message: t('Gotify'),
                        },
                      ]}
                    />

                    <Form.AutoComplete
                      field='gotifyPriority'
                      label={t('')}
                      placeholder={t('')}
                      data={[
                        { value: 0, label: t('0 - ') },
                        { value: 2, label: t('2 - ') },
                        { value: 5, label: t('5 - ') },
                        { value: 8, label: t('8 - ') },
                        { value: 10, label: t('10 - ') },
                      ]}
                      onChange={(val) =>
                        handleFormChange('gotifyPriority', val)
                      }
                      prefix={<IconBell />}
                      extraText={t('0-105')}
                      style={{ width: '100%', maxWidth: '300px' }}
                    />

                    <div className='mt-3 p-4 bg-gray-50/50 rounded-xl'>
                      <div className='text-sm text-gray-700 mb-3'>
                        <strong>{t('')}</strong>
                      </div>
                      <div className='text-xs text-gray-500 space-y-2'>
                        <div>
                          1. {t('Gotify')}
                        </div>
                        <div>
                          2.{' '}
                          {t(
                            'Token',
                          )}
                        </div>
                        <div>3. {t('GotifyURL')}</div>
                        <div className='mt-3 pt-3 border-t border-gray-200'>
                          <span className='text-gray-400'>
                            {t('')}
                          </span>{' '}
                          <a
                            href='https://gotify.net/'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-blue-500 hover:text-blue-600 font-medium'
                          >
                            Gotify {t('')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabPane>

            {/*  Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <DollarSign size={16} className='mr-2' />
                  {t('')}
                </div>
              }
              itemKey='pricing'
            >
              <div className='py-4'>
                <Form.Switch
                  field='acceptUnsetModelRatioModel'
                  label={t('')}
                  checkedText={t('')}
                  uncheckedText={t('')}
                  onChange={(value) =>
                    handleFormChange('acceptUnsetModelRatioModel', value)
                  }
                  extraText={t(
                    '',
                  )}
                />
              </div>
            </TabPane>

            {/*  Tab */}
            <TabPane
              tab={
                <div className='flex items-center'>
                  <ShieldCheck size={16} className='mr-2' />
                  {t('')}
                </div>
              }
              itemKey='privacy'
            >
              <div className='py-4'>
                <Form.Switch
                  field='recordIpLog'
                  label={t('IP')}
                  checkedText={t('')}
                  uncheckedText={t('')}
                  onChange={(value) => handleFormChange('recordIpLog', value)}
                  extraText={t(
                    '""""IP',
                  )}
                />
              </div>
            </TabPane>

            {/*  Tab -  */}
            {hasSidebarSettingsPermission() && (
              <TabPane
                tab={
                  <div className='flex items-center'>
                    <Settings size={16} className='mr-2' />
                    {t('')}
                  </div>
                }
                itemKey='sidebar'
              >
                <div className='py-4'>
                  <div className='mb-4'>
                    <Typography.Text
                      type='secondary'
                      size='small'
                      style={{
                        fontSize: '12px',
                        lineHeight: '1.5',
                        color: 'var(--semi-color-text-2)',
                      }}
                    >
                      {t('')}
                    </Typography.Text>
                  </div>
                  {/*  */}
                  <div
                    className='border rounded-xl p-4'
                    style={{
                      borderColor: 'var(--semi-color-border)',
                      backgroundColor: 'var(--semi-color-bg-1)',
                    }}
                  >
                    {sectionConfigs.map((section) => (
                      <div key={section.key} className='mb-6'>
                        {/*  */}
                        <div
                          className='flex justify-between items-center mb-4 p-4 rounded-lg'
                          style={{
                            backgroundColor: 'var(--semi-color-fill-0)',
                            border: '1px solid var(--semi-color-border-light)',
                            borderColor: 'var(--semi-color-fill-1)',
                          }}
                        >
                          <div>
                            <div className='font-semibold text-base text-gray-900 mb-1'>
                              {section.title}
                            </div>
                            <Typography.Text
                              type='secondary'
                              size='small'
                              style={{
                                fontSize: '12px',
                                lineHeight: '1.5',
                                color: 'var(--semi-color-text-2)',
                              }}
                            >
                              {section.description}
                            </Typography.Text>
                          </div>
                          <Switch
                            checked={
                              sidebarModulesUser[section.key]?.enabled !== false
                            }
                            onChange={handleSectionChange(section.key)}
                            size='default'
                          />
                        </div>

                        {/*  */}
                        <Row gutter={[12, 12]}>
                          {section.modules
                            .filter((module) =>
                              isAllowedByAdmin(section.key, module.key),
                            )
                            .map((module) => (
                              <Col
                                key={module.key}
                                xs={24}
                                sm={24}
                                md={12}
                                lg={8}
                                xl={8}
                              >
                                <Card
                                  className={`!rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 ${
                                    sidebarModulesUser[section.key]?.enabled !==
                                    false
                                      ? ''
                                      : 'opacity-50'
                                  }`}
                                  bodyStyle={{ padding: '16px' }}
                                  hoverable
                                >
                                  <div className='flex justify-between items-center h-full'>
                                    <div className='flex-1 text-left'>
                                      <div className='font-semibold text-sm text-gray-900 mb-1'>
                                        {module.title}
                                      </div>
                                      <Typography.Text
                                        type='secondary'
                                        size='small'
                                        className='block'
                                        style={{
                                          fontSize: '12px',
                                          lineHeight: '1.5',
                                          color: 'var(--semi-color-text-2)',
                                          marginTop: '4px',
                                        }}
                                      >
                                        {module.description}
                                      </Typography.Text>
                                    </div>
                                    <div className='ml-4'>
                                      <Switch
                                        checked={
                                          sidebarModulesUser[section.key]?.[
                                            module.key
                                          ] !== false
                                        }
                                        onChange={handleModuleChange(
                                          section.key,
                                          module.key,
                                        )}
                                        size='default'
                                        disabled={
                                          sidebarModulesUser[section.key]
                                            ?.enabled === false
                                        }
                                      />
                                    </div>
                                  </div>
                                </Card>
                              </Col>
                            ))}
                        </Row>
                      </div>
                    ))}
                  </div>{' '}
                  {/*  */}
                </div>
              </TabPane>
            )}
          </Tabs>
        )}
      </Form>
    </Card>
  );
};

export default NotificationSettings;

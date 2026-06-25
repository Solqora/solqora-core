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

import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Button,
  Switch,
  Typography,
  Row,
  Col,
  Avatar,
} from '@douyinfe/semi-ui';
import { API, showSuccess, showError } from '../../../helpers';
import { StatusContext } from '../../../context/Status';
import { UserContext } from '../../../context/User';
import { useUserPermissions } from '../../../hooks/common/useUserPermissions';
import { mergeAdminConfig, useSidebar } from '../../../hooks/common/useSidebar';
import { Settings } from 'lucide-react';

const { Text } = Typography;

export default function SettingsSidebarModulesUser() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statusState] = useContext(StatusContext);

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
  if (!permissionsLoading && !hasSidebarSettingsPermission()) {
    return null;
  }

  // 
  if (permissionsLoading) {
    return null;
  }

  // 
  const generateDefaultConfig = () => {
    const defaultConfig = {};

    //  - 
    if (isSidebarSectionAllowed('chat')) {
      defaultConfig.chat = {
        enabled: true,
        playground: isSidebarModuleAllowed('chat', 'playground'),
        chat: isSidebarModuleAllowed('chat', 'chat'),
      };
    }

    //  - 
    if (isSidebarSectionAllowed('console')) {
      defaultConfig.console = {
        enabled: true,
        detail: isSidebarModuleAllowed('console', 'detail'),
        token: isSidebarModuleAllowed('console', 'token'),
        log: isSidebarModuleAllowed('console', 'log'),
        midjourney: isSidebarModuleAllowed('console', 'midjourney'),
        task: isSidebarModuleAllowed('console', 'task'),
      };
    }

    //  - 
    if (isSidebarSectionAllowed('personal')) {
      defaultConfig.personal = {
        enabled: true,
        topup: isSidebarModuleAllowed('personal', 'topup'),
        personal: isSidebarModuleAllowed('personal', 'personal'),
      };
    }

    //  - 
    if (isSidebarSectionAllowed('admin')) {
      defaultConfig.admin = {
        enabled: true,
        channel: isSidebarModuleAllowed('admin', 'channel'),
        models: isSidebarModuleAllowed('admin', 'models'),
        deployment: isSidebarModuleAllowed('admin', 'deployment'),
        redemption: isSidebarModuleAllowed('admin', 'redemption'),
        user: isSidebarModuleAllowed('admin', 'user'),
        setting: isSidebarModuleAllowed('admin', 'setting'),
      };
    }

    return defaultConfig;
  };

  // 
  const [sidebarModulesUser, setSidebarModulesUser] = useState({});

  // 
  const [adminConfig, setAdminConfig] = useState(null);

  // 
  function handleSectionChange(sectionKey) {
    return (checked) => {
      const newModules = {
        ...sidebarModulesUser,
        [sectionKey]: {
          ...sidebarModulesUser[sectionKey],
          enabled: checked,
        },
      };
      setSidebarModulesUser(newModules);
      console.log(':', sectionKey, checked, newModules);
    };
  }

  // 
  function handleModuleChange(sectionKey, moduleKey) {
    return (checked) => {
      const newModules = {
        ...sidebarModulesUser,
        [sectionKey]: {
          ...sidebarModulesUser[sectionKey],
          [moduleKey]: checked,
        },
      };
      setSidebarModulesUser(newModules);
      console.log(
        ':',
        sectionKey,
        moduleKey,
        checked,
        newModules,
      );
    };
  }

  // 
  function resetSidebarModules() {
    const defaultConfig = generateDefaultConfig();
    setSidebarModulesUser(defaultConfig);
    showSuccess(t(''));
    console.log(':', defaultConfig);
  }

  // 
  async function onSubmit() {
    setLoading(true);
    try {
      console.log(':', sidebarModulesUser);
      const res = await API.put('/api/user/self', {
        sidebar_modules: JSON.stringify(sidebarModulesUser),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t(''));
        console.log('');

        // useSidebar
        await refreshUserConfig();
        console.log('');
      } else {
        showError(message);
        console.error(':', message);
      }
    } catch (error) {
      showError(t(''));
      console.error(':', error);
    } finally {
      setLoading(false);
    }
  }

  // 
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        // 
        if (statusState?.status?.SidebarModulesAdmin) {
          try {
            const adminConf = JSON.parse(
              statusState.status.SidebarModulesAdmin,
            );
            const mergedAdminConf = mergeAdminConfig(adminConf);
            setAdminConfig(mergedAdminConf);
            console.log(':', mergedAdminConf);
          } catch (error) {
            const mergedAdminConf = mergeAdminConfig(null);
            setAdminConfig(mergedAdminConf);
            console.log(
              ':',
              mergedAdminConf,
            );
          }
        } else {
          const mergedAdminConf = mergeAdminConfig(null);
          setAdminConfig(mergedAdminConf);
          console.log(':', mergedAdminConf);
        }

        // 
        const userRes = await API.get('/api/user/self');
        if (userRes.data.success && userRes.data.data.sidebar_modules) {
          let userConf;
          // sidebar_modules
          if (typeof userRes.data.data.sidebar_modules === 'string') {
            userConf = JSON.parse(userRes.data.data.sidebar_modules);
          } else {
            userConf = userRes.data.data.sidebar_modules;
          }
          console.log('API:', userConf);

          // 
          const filteredUserConf = {};
          Object.keys(userConf).forEach((sectionKey) => {
            if (isSidebarSectionAllowed(sectionKey)) {
              filteredUserConf[sectionKey] = { ...userConf[sectionKey] };
              // 
              Object.keys(userConf[sectionKey]).forEach((moduleKey) => {
                if (
                  moduleKey !== 'enabled' &&
                  !isSidebarModuleAllowed(sectionKey, moduleKey)
                ) {
                  delete filteredUserConf[sectionKey][moduleKey];
                }
              });
            }
          });
          setSidebarModulesUser(filteredUserConf);
          console.log(':', filteredUserConf);
        } else {
          // 
          const defaultConfig = generateDefaultConfig();
          setSidebarModulesUser(defaultConfig);
          console.log(':', defaultConfig);
        }
      } catch (error) {
        console.error(':', error);
        // 
        const defaultConfig = generateDefaultConfig();
        setSidebarModulesUser(defaultConfig);
      }
    };

    // 
    if (!permissionsLoading && hasSidebarSettingsPermission()) {
      loadConfigs();
    }
  }, [
    statusState,
    permissionsLoading,
    hasSidebarSettingsPermission,
    isSidebarSectionAllowed,
    isSidebarModuleAllowed,
  ]);

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

  return (
    <Card className='!rounded-2xl shadow-sm border-0'>
      {/*  */}
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='purple' className='mr-3 shadow-md'>
          <Settings size={16} />
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

      <div className='mb-4'>
        <Text type='secondary' className='text-sm text-gray-600'>
          {t('')}
        </Text>
      </div>

      {sectionConfigs.map((section) => (
        <div key={section.key} className='mb-6'>
          {/*  */}
          <div className='flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200'>
            <div>
              <div className='font-semibold text-base text-gray-900 mb-1'>
                {section.title}
              </div>
              <Text className='text-xs text-gray-600'>
                {section.description}
              </Text>
            </div>
            <Switch
              checked={sidebarModulesUser[section.key]?.enabled !== false}
              onChange={handleSectionChange(section.key)}
              size='default'
            />
          </div>

          {/*  */}
          <Row gutter={[12, 12]}>
            {section.modules.map((module) => (
              <Col key={module.key} xs={24} sm={12} md={8} lg={6} xl={6}>
                <Card
                  className={`!rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 ${
                    sidebarModulesUser[section.key]?.enabled !== false
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
                      <Text className='text-xs text-gray-600 leading-relaxed block'>
                        {module.description}
                      </Text>
                    </div>
                    <div className='ml-4'>
                      <Switch
                        checked={
                          sidebarModulesUser[section.key]?.[module.key] !==
                          false
                        }
                        onChange={handleModuleChange(section.key, module.key)}
                        size='default'
                        disabled={
                          sidebarModulesUser[section.key]?.enabled === false
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

      {/*  */}
      <div className='flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200'>
        <Button
          type='tertiary'
          onClick={resetSidebarModules}
          className='!rounded-lg'
        >
          {t('')}
        </Button>
        <Button
          type='primary'
          onClick={onSubmit}
          loading={loading}
          className='!rounded-lg'
        >
          {t('')}
        </Button>
      </div>
    </Card>
  );
}

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

import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Form,
  Button,
  Switch,
  Row,
  Col,
  Typography,
} from '@douyinfe/semi-ui';
import { API, showSuccess, showError } from '../../../helpers';
import { StatusContext } from '../../../context/Status';

const { Text } = Typography;

export default function SettingsSidebarModulesAdmin(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statusState, statusDispatch] = useContext(StatusContext);

  // 
  const [sidebarModulesAdmin, setSidebarModulesAdmin] = useState({
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
      redemption: true,
      user: true,
      subscription: true,
      setting: true,
    },
  });

  // 
  function handleSectionChange(sectionKey) {
    return (checked) => {
      const newModules = {
        ...sidebarModulesAdmin,
        [sectionKey]: {
          ...sidebarModulesAdmin[sectionKey],
          enabled: checked,
        },
      };
      setSidebarModulesAdmin(newModules);
    };
  }

  // 
  function handleModuleChange(sectionKey, moduleKey) {
    return (checked) => {
      const newModules = {
        ...sidebarModulesAdmin,
        [sectionKey]: {
          ...sidebarModulesAdmin[sectionKey],
          [moduleKey]: checked,
        },
      };
      setSidebarModulesAdmin(newModules);
    };
  }

  // 
  function resetSidebarModules() {
    const defaultModules = {
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
        redemption: true,
        user: true,
        subscription: true,
        setting: true,
      },
    };
    setSidebarModulesAdmin(defaultModules);
    showSuccess(t(''));
  }

  // 
  async function onSubmit() {
    setLoading(true);
    try {
      const res = await API.put('/api/option/', {
        key: 'SidebarModulesAdmin',
        value: JSON.stringify(sidebarModulesAdmin),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t(''));

        // StatusContext
        statusDispatch({
          type: 'set',
          payload: {
            ...statusState.status,
            SidebarModulesAdmin: JSON.stringify(sidebarModulesAdmin),
          },
        });

        // 
        if (props.refresh) {
          await props.refresh();
        }
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t(''));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    //  props.options 
    if (props.options && props.options.SidebarModulesAdmin) {
      try {
        const modules = JSON.parse(props.options.SidebarModulesAdmin);
        setSidebarModulesAdmin(modules);
      } catch (error) {
        // 
        const defaultModules = {
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
            redemption: true,
            user: true,
            subscription: true,
            setting: true,
          },
        };
        setSidebarModulesAdmin(defaultModules);
      }
    }
  }, [props.options]);

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
  ];

  return (
    <Card>
      <Form.Section
        text={t('')}
        extraText={t(
          '',
        )}
      >
        {sectionConfigs.map((section) => (
          <div key={section.key} style={{ marginBottom: '32px' }}>
            {/*  */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                padding: '12px 16px',
                backgroundColor: 'var(--semi-color-fill-0)',
                borderRadius: '8px',
                border: '1px solid var(--semi-color-border)',
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: '600',
                    fontSize: '16px',
                    color: 'var(--semi-color-text-0)',
                    marginBottom: '4px',
                  }}
                >
                  {section.title}
                </div>
                <Text
                  type='secondary'
                  size='small'
                  style={{
                    fontSize: '12px',
                    color: 'var(--semi-color-text-2)',
                    lineHeight: '1.4',
                  }}
                >
                  {section.description}
                </Text>
              </div>
              <Switch
                checked={sidebarModulesAdmin[section.key]?.enabled}
                onChange={handleSectionChange(section.key)}
                size='default'
              />
            </div>

            {/*  */}
            <Row gutter={[16, 16]}>
              {section.modules.map((module) => (
                <Col key={module.key} xs={24} sm={12} md={8} lg={6} xl={6}>
                  <Card
                    bodyStyle={{ padding: '16px' }}
                    hoverable
                    style={{
                      opacity: sidebarModulesAdmin[section.key]?.enabled
                        ? 1
                        : 0.5,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        height: '100%',
                      }}
                    >
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div
                          style={{
                            fontWeight: '600',
                            fontSize: '14px',
                            color: 'var(--semi-color-text-0)',
                            marginBottom: '4px',
                          }}
                        >
                          {module.title}
                        </div>
                        <Text
                          type='secondary'
                          size='small'
                          style={{
                            fontSize: '12px',
                            color: 'var(--semi-color-text-2)',
                            lineHeight: '1.4',
                            display: 'block',
                          }}
                        >
                          {module.description}
                        </Text>
                      </div>
                      <div style={{ marginLeft: '16px' }}>
                        <Switch
                          checked={
                            sidebarModulesAdmin[section.key]?.[module.key]
                          }
                          onChange={handleModuleChange(section.key, module.key)}
                          size='default'
                          disabled={!sidebarModulesAdmin[section.key]?.enabled}
                        />
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        ))}

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingTop: '8px',
            borderTop: '1px solid var(--semi-color-border)',
          }}
        >
          <Button
            size='default'
            type='tertiary'
            onClick={resetSidebarModules}
            style={{
              borderRadius: '6px',
              fontWeight: '500',
            }}
          >
            {t('')}
          </Button>
          <Button
            size='default'
            type='primary'
            onClick={onSubmit}
            loading={loading}
            style={{
              borderRadius: '6px',
              fontWeight: '500',
              minWidth: '100px',
            }}
          >
            {t('')}
          </Button>
        </div>
      </Form.Section>
    </Card>
  );
}

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
  Banner,
  Button,
  Dropdown,
  Form,
  Space,
  Spin,
  RadioGroup,
  Radio,
  Table,
  Modal,
  Input,
  Divider,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconSearch,
  IconSaveStroked,
  IconBolt,
} from '@douyinfe/semi-icons';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function SettingsChats(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    Chats: '[]',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  const [editMode, setEditMode] = useState('visual');
  const [chatConfigs, setChatConfigs] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [searchText, setSearchText] = useState('');
  const modalFormRef = useRef();

  const BUILTIN_TEMPLATES = [
    { name: 'Cherry Studio', url: 'cherrystudio://providers/api-keys?v=1&data={cherryConfig}' },
    { name: 'AionUI', url: 'aionui://provider/add?v=1&data={aionuiConfig}' },
    { name: '', url: 'fluentread' },
    { name: 'CC Switch', url: 'ccswitch' },
    { name: 'DeepChat', url: 'deepchat://provider/install?v=1&data={deepchatConfig}' },
    { name: 'Lobe Chat', url: 'https://chat-preview.lobehub.com/?settings={"keyVaults":{"openai":{"apiKey":"{key}","baseURL":"{address}/v1"}}}' },
    { name: 'AI as Workspace', url: 'https://aiaw.app/set-provider?provider={"type":"openai","settings":{"apiKey":"{key}","baseURL":"{address}/v1","compatibility":"strict"}}' },
    { name: 'AMA ', url: 'ama://set-api-key?server={address}&key={key}' },
    { name: 'OpenCat', url: 'opencat://team/join?domain={address}&token={key}' },
  ];

  const addTemplates = (templates) => {
    const existingNames = new Set(chatConfigs.map((c) => c.name));
    const toAdd = templates.filter((tpl) => !existingNames.has(tpl.name));
    if (toAdd.length === 0) {
      showWarning(t(''));
      return;
    }
    let maxId = chatConfigs.length > 0
      ? Math.max(...chatConfigs.map((c) => c.id))
      : -1;
    const newItems = toAdd.map((tpl) => ({
      id: ++maxId,
      name: tpl.name,
      url: tpl.url,
    }));
    const newConfigs = [...chatConfigs, ...newItems];
    setChatConfigs(newConfigs);
    syncConfigsToJson(newConfigs);
    showSuccess(t(' {{count}} ', { count: toAdd.length }));
  };

  const jsonToConfigs = (jsonString) => {
    try {
      const configs = JSON.parse(jsonString);
      return Array.isArray(configs)
        ? configs.map((config, index) => ({
            id: index,
            name: Object.keys(config)[0] || '',
            url: Object.values(config)[0] || '',
          }))
        : [];
    } catch (error) {
      console.error('JSON parse error:', error);
      return [];
    }
  };

  const configsToJson = (configs) => {
    const jsonArray = configs.map((config) => ({
      [config.name]: config.url,
    }));
    return JSON.stringify(jsonArray, null, 2);
  };

  const syncJsonToConfigs = () => {
    const configs = jsonToConfigs(inputs.Chats);
    setChatConfigs(configs);
  };

  const syncConfigsToJson = (configs) => {
    const jsonString = configsToJson(configs);
    setInputs((prev) => ({
      ...prev,
      Chats: jsonString,
    }));
    if (refForm.current && editMode === 'json') {
      refForm.current.setValues({ Chats: jsonString });
    }
  };

  async function onSubmit() {
    try {
      if (editMode === 'json' && refForm.current) {
        try {
          await refForm.current.validate();
        } catch (error) {
          console.error('Validation failed:', error);
          showError(t(''));
          return;
        }
      }

      const updateArray = compareObjects(inputs, inputsRow);
      if (!updateArray.length)
        return showWarning(t(''));
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
      try {
        const res = await Promise.all(requestQueue);
        if (res.includes(undefined)) {
          if (requestQueue.length > 1) {
            showError(t(''));
          }
          return;
        }
        showSuccess(t(''));
        props.refresh();
      } catch {
        showError(t(''));
      } finally {
        setLoading(false);
      }
    } catch (error) {
      showError(t(''));
      console.error(error);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        if (key === 'Chats') {
          const obj = JSON.parse(props.options[key]);
          currentInputs[key] = JSON.stringify(obj, null, 2);
        } else {
          currentInputs[key] = props.options[key];
        }
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    if (refForm.current) {
      refForm.current.setValues(currentInputs);
    }

    // 
    const configs = jsonToConfigs(currentInputs.Chats || '[]');
    setChatConfigs(configs);
  }, [props.options]);

  useEffect(() => {
    if (editMode === 'visual') {
      syncJsonToConfigs();
    }
  }, [inputs.Chats, editMode]);

  useEffect(() => {
    if (refForm.current && editMode === 'json') {
      refForm.current.setValues(inputs);
    }
  }, [editMode, inputs]);

  const handleAddConfig = () => {
    setEditingConfig({ name: '', url: '' });
    setIsEdit(false);
    setModalVisible(true);
    setTimeout(() => {
      if (modalFormRef.current) {
        modalFormRef.current.setValues({ name: '', url: '' });
      }
    }, 100);
  };

  const handleEditConfig = (config) => {
    setEditingConfig({ ...config });
    setIsEdit(true);
    setModalVisible(true);
    setTimeout(() => {
      if (modalFormRef.current) {
        modalFormRef.current.setValues(config);
      }
    }, 100);
  };

  const handleDeleteConfig = (id) => {
    const newConfigs = chatConfigs.filter((config) => config.id !== id);
    setChatConfigs(newConfigs);
    syncConfigsToJson(newConfigs);
    showSuccess(t(''));
  };

  const handleModalOk = () => {
    if (modalFormRef.current) {
      modalFormRef.current
        .validate()
        .then((values) => {
          // 
          const isDuplicate = chatConfigs.some(
            (config) =>
              config.name === values.name &&
              (!isEdit || config.id !== editingConfig.id),
          );

          if (isDuplicate) {
            showError(t(''));
            return;
          }

          if (isEdit) {
            const newConfigs = chatConfigs.map((config) =>
              config.id === editingConfig.id
                ? { ...editingConfig, name: values.name, url: values.url }
                : config,
            );
            setChatConfigs(newConfigs);
            syncConfigsToJson(newConfigs);
          } else {
            const maxId =
              chatConfigs.length > 0
                ? Math.max(...chatConfigs.map((c) => c.id))
                : -1;
            const newConfig = {
              id: maxId + 1,
              name: values.name,
              url: values.url,
            };
            const newConfigs = [...chatConfigs, newConfig];
            setChatConfigs(newConfigs);
            syncConfigsToJson(newConfigs);
          }
          setModalVisible(false);
          setEditingConfig(null);
          showSuccess(isEdit ? t('') : t(''));
        })
        .catch((error) => {
          console.error('Modal form validation error:', error);
        });
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingConfig(null);
  };

  const filteredConfigs = chatConfigs.filter(
    (config) =>
      !searchText ||
      config.name.toLowerCase().includes(searchText.toLowerCase()),
  );

  const highlightKeywords = (text) => {
    if (!text) return text;

    const parts = text.split(/(\{address\}|\{key\})/g);
    return parts.map((part, index) => {
      if (part === '{address}') {
        return (
          <span key={index} style={{ color: '#0077cc', fontWeight: 600 }}>
            {part}
          </span>
        );
      } else if (part === '{key}') {
        return (
          <span key={index} style={{ color: '#ff6b35', fontWeight: 600 }}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const columns = [
    {
      title: t(''),
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || t(''),
    },
    {
      title: t('URL'),
      dataIndex: 'url',
      key: 'url',
      render: (text) => (
        <div style={{ maxWidth: 300, wordBreak: 'break-all' }}>
          {highlightKeywords(text)}
        </div>
      ),
    },
    {
      title: t(''),
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type='primary'
            icon={<IconEdit />}
            size='small'
            onClick={() => handleEditConfig(record)}
          >
            {t('')}
          </Button>
          <Button
            type='danger'
            icon={<IconDelete />}
            size='small'
            onClick={() => handleDeleteConfig(record.id)}
          >
            {t('')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space vertical style={{ width: '100%' }}>
        <Form.Section text={t('')}>
          <Banner
            type='info'
            description={t(
              '{key}sk-xxxx{address}//v1',
            )}
          />

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <span style={{ marginRight: 16, fontWeight: 600 }}>
              {t('')}:
            </span>
            <RadioGroup
              type='button'
              value={editMode}
              onChange={(e) => {
                const newMode = e.target.value;
                setEditMode(newMode);

                // 
                setTimeout(() => {
                  if (newMode === 'json' && refForm.current) {
                    refForm.current.setValues(inputs);
                  }
                }, 100);
              }}
            >
              <Radio value='visual'>{t('')}</Radio>
              <Radio value='json'>{t('JSON')}</Radio>
            </RadioGroup>
          </div>

          {editMode === 'visual' ? (
            <div>
              <Space style={{ marginBottom: 16 }}>
                <Button
                  type='primary'
                  icon={<IconPlus />}
                  onClick={handleAddConfig}
                >
                  {t('')}
                </Button>
                <Dropdown
                  trigger='click'
                  position='bottomLeft'
                  menu={[
                    ...BUILTIN_TEMPLATES.map((tpl, idx) => ({
                      node: 'item',
                      key: String(idx),
                      name: tpl.name,
                      onClick: () => addTemplates([tpl]),
                    })),
                    { node: 'divider', key: 'divider' },
                    {
                      node: 'item',
                      key: 'all',
                      name: t(''),
                      onClick: () => addTemplates(BUILTIN_TEMPLATES),
                    },
                  ]}
                >
                  <Button icon={<IconBolt />}>
                    {t('')}
                  </Button>
                </Dropdown>
                <Button
                  type='primary'
                  theme='solid'
                  icon={<IconSaveStroked />}
                  onClick={onSubmit}
                >
                  {t('')}
                </Button>
                <Input
                  prefix={<IconSearch />}
                  placeholder={t('')}
                  value={searchText}
                  onChange={(value) => setSearchText(value)}
                  style={{ width: 250 }}
                  showClear
                />
              </Space>

              <Table
                columns={columns}
                dataSource={filteredConfigs}
                rowKey='id'
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                  showQuickJumper: true,
                  showTotal: (total, range) =>
                    t(' {{total}}  {{start}}-{{end}} ', {
                      total,
                      start: range[0],
                      end: range[1],
                    }),
                }}
              />
            </div>
          ) : (
            <Form
              values={inputs}
              getFormApi={(formAPI) => (refForm.current = formAPI)}
            >
              <Form.TextArea
                label={t('')}
                extraText={''}
                placeholder={t(' JSON ')}
                field={'Chats'}
                autosize={{ minRows: 6, maxRows: 12 }}
                trigger='blur'
                stopValidateWithError
                rules={[
                  {
                    validator: (rule, value) => {
                      return verifyJSON(value);
                    },
                    message: t(' JSON '),
                  },
                ]}
                onChange={(value) =>
                  setInputs({
                    ...inputs,
                    Chats: value,
                  })
                }
              />
            </Form>
          )}
        </Form.Section>

        {editMode === 'json' && (
          <Space>
            <Button
              type='primary'
              icon={<IconSaveStroked />}
              onClick={onSubmit}
            >
              {t('')}
            </Button>
          </Space>
        )}
      </Space>

      <Modal
        title={isEdit ? t('') : t('')}
        visible={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form getFormApi={(api) => (modalFormRef.current = api)}>
          <Form.Input
            field='name'
            label={t('')}
            placeholder={t('')}
            rules={[
              { required: true, message: t('') },
              { min: 1, message: t('') },
            ]}
          />
          <Form.Input
            field='url'
            label={t('URL')}
            placeholder={t('URL')}
            rules={[{ required: true, message: t('URL') }]}
          />
          <Banner
            type='info'
            description={t(
              '{key}API{address}',
            )}
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>
    </Spin>
  );
}

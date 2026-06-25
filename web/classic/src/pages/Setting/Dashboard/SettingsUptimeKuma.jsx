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
  Space,
  Table,
  Form,
  Typography,
  Empty,
  Divider,
  Modal,
  Switch,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { Plus, Edit, Trash2, Save, Activity } from 'lucide-react';
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const SettingsUptimeKuma = ({ options, refresh }) => {
  const { t } = useTranslation();

  const [uptimeGroupsList, setUptimeGroupsList] = useState([]);
  const [showUptimeModal, setShowUptimeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [uptimeForm, setUptimeForm] = useState({
    categoryName: '',
    url: '',
    slug: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [panelEnabled, setPanelEnabled] = useState(true);

  const columns = [
    {
      title: t(''),
      dataIndex: 'categoryName',
      key: 'categoryName',
      render: (text) => (
        <div
          style={{
            fontWeight: 'bold',
            color: 'var(--semi-color-text-0)',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: t('Uptime Kuma'),
      dataIndex: 'url',
      key: 'url',
      render: (text) => (
        <div
          style={{
            maxWidth: '300px',
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            color: 'var(--semi-color-primary)',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: t('Slug'),
      dataIndex: 'slug',
      key: 'slug',
      render: (text) => (
        <div
          style={{
            fontFamily: 'monospace',
            color: 'var(--semi-color-text-1)',
          }}
        >
          {text}
        </div>
      ),
    },
    {
      title: t(''),
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (text, record) => (
        <Space>
          <Button
            icon={<Edit size={14} />}
            theme='light'
            type='tertiary'
            size='small'
            onClick={() => handleEditGroup(record)}
          >
            {t('')}
          </Button>
          <Button
            icon={<Trash2 size={14} />}
            type='danger'
            theme='light'
            size='small'
            onClick={() => handleDeleteGroup(record)}
          >
            {t('')}
          </Button>
        </Space>
      ),
    },
  ];

  const updateOption = async (key, value) => {
    const res = await API.put('/api/option/', {
      key,
      value,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess('Uptime Kuma');
      if (refresh) refresh();
    } else {
      showError(message);
    }
  };

  const submitUptimeGroups = async () => {
    try {
      setLoading(true);
      const groupsJson = JSON.stringify(uptimeGroupsList);
      await updateOption('console_setting.uptime_kuma_groups', groupsJson);
      setHasChanges(false);
    } catch (error) {
      console.error('Uptime Kuma', error);
      showError('Uptime Kuma');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGroup = () => {
    setEditingGroup(null);
    setUptimeForm({
      categoryName: '',
      url: '',
      slug: '',
    });
    setShowUptimeModal(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setUptimeForm({
      categoryName: group.categoryName,
      url: group.url,
      slug: group.slug,
    });
    setShowUptimeModal(true);
  };

  const handleDeleteGroup = (group) => {
    setDeletingGroup(group);
    setShowDeleteModal(true);
  };

  const confirmDeleteGroup = () => {
    if (deletingGroup) {
      const newList = uptimeGroupsList.filter(
        (item) => item.id !== deletingGroup.id,
      );
      setUptimeGroupsList(newList);
      setHasChanges(true);
      showSuccess('“”');
    }
    setShowDeleteModal(false);
    setDeletingGroup(null);
  };

  const handleSaveGroup = async () => {
    if (!uptimeForm.categoryName || !uptimeForm.url || !uptimeForm.slug) {
      showError('');
      return;
    }

    try {
      new URL(uptimeForm.url);
    } catch (error) {
      showError('URL');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(uptimeForm.slug)) {
      showError('Slug');
      return;
    }

    try {
      setModalLoading(true);

      let newList;
      if (editingGroup) {
        newList = uptimeGroupsList.map((item) =>
          item.id === editingGroup.id ? { ...item, ...uptimeForm } : item,
        );
      } else {
        const newId =
          Math.max(...uptimeGroupsList.map((item) => item.id), 0) + 1;
        const newGroup = {
          id: newId,
          ...uptimeForm,
        };
        newList = [...uptimeGroupsList, newGroup];
      }

      setUptimeGroupsList(newList);
      setHasChanges(true);
      setShowUptimeModal(false);
      showSuccess(
        editingGroup
          ? '“”'
          : '“”',
      );
    } catch (error) {
      showError(': ' + error.message);
    } finally {
      setModalLoading(false);
    }
  };

  const parseUptimeGroups = (groupsStr) => {
    if (!groupsStr) {
      setUptimeGroupsList([]);
      return;
    }

    try {
      const parsed = JSON.parse(groupsStr);
      const list = Array.isArray(parsed) ? parsed : [];
      const listWithIds = list.map((item, index) => ({
        ...item,
        id: item.id || index + 1,
      }));
      setUptimeGroupsList(listWithIds);
    } catch (error) {
      console.error('Uptime Kuma:', error);
      setUptimeGroupsList([]);
    }
  };

  useEffect(() => {
    const groupsStr = options['console_setting.uptime_kuma_groups'];
    if (groupsStr !== undefined) {
      parseUptimeGroups(groupsStr);
    }
  }, [options['console_setting.uptime_kuma_groups']]);

  useEffect(() => {
    const enabledStr = options['console_setting.uptime_kuma_enabled'];
    setPanelEnabled(
      enabledStr === undefined
        ? true
        : enabledStr === 'true' || enabledStr === true,
    );
  }, [options['console_setting.uptime_kuma_enabled']]);

  const handleToggleEnabled = async (checked) => {
    const newValue = checked ? 'true' : 'false';
    try {
      const res = await API.put('/api/option/', {
        key: 'console_setting.uptime_kuma_enabled',
        value: newValue,
      });
      if (res.data.success) {
        setPanelEnabled(checked);
        showSuccess(t(''));
        refresh?.();
      } else {
        showError(res.data.message);
      }
    } catch (err) {
      showError(err.message);
    }
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      showError('');
      return;
    }

    const newList = uptimeGroupsList.filter(
      (item) => !selectedRowKeys.includes(item.id),
    );
    setUptimeGroupsList(newList);
    setSelectedRowKeys([]);
    setHasChanges(true);
    showSuccess(
      ` ${selectedRowKeys.length} “”`,
    );
  };

  const renderHeader = () => (
    <div className='flex flex-col w-full'>
      <div className='mb-2'>
        <div className='flex items-center text-blue-500'>
          <Activity size={16} className='mr-2' />
          <Text>
            {t(
              'Uptime Kuma20',
            )}
          </Text>
        </div>
      </div>

      <Divider margin='12px' />

      <div className='flex flex-col md:flex-row justify-between items-center gap-4 w-full'>
        <div className='flex gap-2 w-full md:w-auto order-2 md:order-1'>
          <Button
            theme='light'
            type='primary'
            icon={<Plus size={14} />}
            className='w-full md:w-auto'
            onClick={handleAddGroup}
          >
            {t('')}
          </Button>
          <Button
            icon={<Trash2 size={14} />}
            type='danger'
            theme='light'
            onClick={handleBatchDelete}
            disabled={selectedRowKeys.length === 0}
            className='w-full md:w-auto'
          >
            {t('')}{' '}
            {selectedRowKeys.length > 0 && `(${selectedRowKeys.length})`}
          </Button>
          <Button
            icon={<Save size={14} />}
            onClick={submitUptimeGroups}
            loading={loading}
            disabled={!hasChanges}
            type='secondary'
            className='w-full md:w-auto'
          >
            {t('')}
          </Button>
        </div>

        {/*  */}
        <div className='order-1 md:order-2 flex items-center gap-2'>
          <Switch checked={panelEnabled} onChange={handleToggleEnabled} />
          <Text>{panelEnabled ? t('') : t('')}</Text>
        </div>
      </div>
    </div>
  );

  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return uptimeGroupsList.slice(startIndex, endIndex);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
    },
    onSelect: (record, selected, selectedRows) => {
      console.log(`: ${selected}`, record);
    },
    onSelectAll: (selected, selectedRows) => {
      console.log(`: ${selected}`, selectedRows);
    },
    getCheckboxProps: (record) => ({
      disabled: false,
      name: record.id,
    }),
  };

  return (
    <>
      <Form.Section text={renderHeader()}>
        <Table
          columns={columns}
          dataSource={getCurrentPageData()}
          rowSelection={rowSelection}
          rowKey='id'
          scroll={{ x: 'max-content' }}
          pagination={{
            currentPage: currentPage,
            pageSize: pageSize,
            total: uptimeGroupsList.length,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
            onShowSizeChange: (current, size) => {
              setCurrentPage(1);
              setPageSize(size);
            },
          }}
          size='middle'
          loading={loading}
          empty={
            <Empty
              image={
                <IllustrationNoResult style={{ width: 150, height: 150 }} />
              }
              darkModeImage={
                <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
              }
              description={t('')}
              style={{ padding: 30 }}
            />
          }
          className='overflow-hidden'
        />
      </Form.Section>

      <Modal
        title={editingGroup ? t('') : t('')}
        visible={showUptimeModal}
        onOk={handleSaveGroup}
        onCancel={() => setShowUptimeModal(false)}
        okText={t('')}
        cancelText={t('')}
        confirmLoading={modalLoading}
        width={600}
      >
        <Form
          layout='vertical'
          initValues={uptimeForm}
          key={editingGroup ? editingGroup.id : 'new'}
        >
          <Form.Input
            field='categoryName'
            label={t('')}
            placeholder={t('OpenAIClaude')}
            maxLength={50}
            rules={[{ required: true, message: t('') }]}
            onChange={(value) =>
              setUptimeForm({ ...uptimeForm, categoryName: value })
            }
          />
          <Form.Input
            field='url'
            label={t('Uptime Kuma')}
            placeholder={t(
              'Uptime Kumahttps://status.example.com',
            )}
            maxLength={500}
            rules={[{ required: true, message: t('Uptime Kuma') }]}
            onChange={(value) => setUptimeForm({ ...uptimeForm, url: value })}
          />
          <Form.Input
            field='slug'
            label={t('Slug')}
            placeholder={t('Slugmy-status')}
            maxLength={100}
            rules={[{ required: true, message: t('Slug') }]}
            onChange={(value) => setUptimeForm({ ...uptimeForm, slug: value })}
          />
        </Form>
      </Modal>

      <Modal
        title={t('')}
        visible={showDeleteModal}
        onOk={confirmDeleteGroup}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingGroup(null);
        }}
        okText={t('')}
        cancelText={t('')}
        type='warning'
        okButtonProps={{
          type: 'danger',
          theme: 'solid',
        }}
      >
        <Text>{t('')}</Text>
      </Modal>
    </>
  );
};

export default SettingsUptimeKuma;

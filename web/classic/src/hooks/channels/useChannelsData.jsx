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

import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showInfo,
  showSuccess,
  loadChannelModels,
  copy,
  toBoolean,
} from '../../helpers';
import {
  CHANNEL_OPTIONS,
  ITEMS_PER_PAGE,
  MODEL_TABLE_PAGE_SIZE,
} from '../../constants';
import { useIsMobile } from '../common/useIsMobile';
import { useTableCompactMode } from '../common/useTableCompactMode';
import { useChannelUpstreamUpdates } from './useChannelUpstreamUpdates';
import { parseUpstreamUpdateMeta } from './upstreamUpdateUtils';
import { Modal, Button } from '@douyinfe/semi-ui';
import { openCodexUsageModal } from '../../components/table/channels/modals/CodexUsageModal';

export const useChannelsData = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  // Basic states
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [idSort, setIdSort] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [channelCount, setChannelCount] = useState(0);
  const [groupOptions, setGroupOptions] = useState([]);

  // UI states
  const [showEdit, setShowEdit] = useState(false);
  const [enableBatchDelete, setEnableBatchDelete] = useState(false);
  const [editingChannel, setEditingChannel] = useState({ id: undefined });
  const [showEditTag, setShowEditTag] = useState(false);
  const [editingTag, setEditingTag] = useState('');
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [enableTagMode, setEnableTagMode] = useState(false);
  const [showBatchSetTag, setShowBatchSetTag] = useState(false);
  const [batchSetTagValue, setBatchSetTagValue] = useState('');
  const [compactMode, setCompactMode] = useTableCompactMode('channels');

  // Column visibility states
  const [visibleColumns, setVisibleColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Status filter
  const [statusFilter, setStatusFilter] = useState(
    localStorage.getItem('channel-status-filter') || 'all',
  );

  // Type tabs states
  const [activeTypeKey, setActiveTypeKey] = useState('all');
  const [typeCounts, setTypeCounts] = useState({});

  // Model test states
  const [showModelTestModal, setShowModelTestModal] = useState(false);
  const [currentTestChannel, setCurrentTestChannel] = useState(null);
  const [modelSearchKeyword, setModelSearchKeyword] = useState('');
  const [modelTestResults, setModelTestResults] = useState({});
  const [testingModels, setTestingModels] = useState(new Set());
  const [selectedModelKeys, setSelectedModelKeys] = useState([]);
  const [isBatchTesting, setIsBatchTesting] = useState(false);
  const [modelTablePage, setModelTablePage] = useState(1);
  const [selectedEndpointType, setSelectedEndpointType] = useState('');
  const [isStreamTest, setIsStreamTest] = useState(false);
  const [globalPassThroughEnabled, setGlobalPassThroughEnabled] =
    useState(false);

  const fetchGlobalPassThroughEnabled = async () => {
    try {
      const res = await API.get('/api/option/');
      const { success, data } = res?.data || {};
      if (!success || !Array.isArray(data)) {
        return;
      }
      const option = data.find(
        (item) => item?.key === 'global.pass_through_request_enabled',
      );
      if (option) {
        setGlobalPassThroughEnabled(toBoolean(option.value));
      }
    } catch (error) {
      setGlobalPassThroughEnabled(false);
    }
  };

  //  ref 
  const shouldStopBatchTestingRef = useRef(false);

  // Multi-key management states
  const [showMultiKeyManageModal, setShowMultiKeyManageModal] = useState(false);
  const [currentMultiKeyChannel, setCurrentMultiKeyChannel] = useState(null);

  // Refs
  const requestCounter = useRef(0);
  const allSelectingRef = useRef(false);
  const [formApi, setFormApi] = useState(null);

  const formInitValues = {
    searchKeyword: '',
    searchGroup: '',
    searchModel: '',
  };

  // Column keys
  const COLUMN_KEYS = {
    ID: 'id',
    NAME: 'name',
    GROUP: 'group',
    TYPE: 'type',
    STATUS: 'status',
    RESPONSE_TIME: 'response_time',
    BALANCE: 'balance',
    PRIORITY: 'priority',
    WEIGHT: 'weight',
    OPERATE: 'operate',
  };

  // Initialize from localStorage
  useEffect(() => {
    const localIdSort = localStorage.getItem('id-sort') === 'true';
    const localPageSize =
      parseInt(localStorage.getItem('page-size')) || ITEMS_PER_PAGE;
    const localEnableTagMode =
      localStorage.getItem('enable-tag-mode') === 'true';
    const localEnableBatchDelete =
      localStorage.getItem('enable-batch-delete') === 'true';

    setIdSort(localIdSort);
    setPageSize(localPageSize);
    setEnableTagMode(localEnableTagMode);
    setEnableBatchDelete(localEnableBatchDelete);

    loadChannels(1, localPageSize, localIdSort, localEnableTagMode)
      .then()
      .catch((reason) => {
        showError(reason);
      });
    fetchGroups().then();
    loadChannelModels().then();
    fetchGlobalPassThroughEnabled().then();
  }, []);

  // Column visibility management
  const getDefaultColumnVisibility = () => {
    return {
      [COLUMN_KEYS.ID]: true,
      [COLUMN_KEYS.NAME]: true,
      [COLUMN_KEYS.GROUP]: true,
      [COLUMN_KEYS.TYPE]: true,
      [COLUMN_KEYS.STATUS]: true,
      [COLUMN_KEYS.RESPONSE_TIME]: true,
      [COLUMN_KEYS.BALANCE]: true,
      [COLUMN_KEYS.PRIORITY]: true,
      [COLUMN_KEYS.WEIGHT]: true,
      [COLUMN_KEYS.OPERATE]: true,
    };
  };

  const initDefaultColumns = () => {
    const defaults = getDefaultColumnVisibility();
    setVisibleColumns(defaults);
  };

  // Load saved column preferences
  useEffect(() => {
    const savedColumns = localStorage.getItem('channels-table-columns');
    if (savedColumns) {
      try {
        const parsed = JSON.parse(savedColumns);
        const defaults = getDefaultColumnVisibility();
        const merged = { ...defaults, ...parsed };
        setVisibleColumns(merged);
      } catch (e) {
        console.error('Failed to parse saved column preferences', e);
        initDefaultColumns();
      }
    } else {
      initDefaultColumns();
    }
  }, []);

  // Save column preferences
  useEffect(() => {
    if (Object.keys(visibleColumns).length > 0) {
      localStorage.setItem(
        'channels-table-columns',
        JSON.stringify(visibleColumns),
      );
    }
  }, [visibleColumns]);

  const handleColumnVisibilityChange = (columnKey, checked) => {
    const updatedColumns = { ...visibleColumns, [columnKey]: checked };
    setVisibleColumns(updatedColumns);
  };

  const handleSelectAll = (checked) => {
    const allKeys = Object.keys(COLUMN_KEYS).map((key) => COLUMN_KEYS[key]);
    const updatedColumns = {};
    allKeys.forEach((key) => {
      updatedColumns[key] = checked;
    });
    setVisibleColumns(updatedColumns);
  };

  // Data formatting
  const setChannelFormat = (channels, enableTagMode) => {
    let channelDates = [];
    let channelTags = {};

    for (let i = 0; i < channels.length; i++) {
      channels[i].upstreamUpdateMeta = parseUpstreamUpdateMeta(
        channels[i].settings,
      );
      channels[i].key = '' + channels[i].id;
      if (!enableTagMode) {
        channelDates.push(channels[i]);
      } else {
        let tag = channels[i].tag ? channels[i].tag : '';
        let tagIndex = channelTags[tag];
        let tagChannelDates = undefined;

        if (tagIndex === undefined) {
          channelTags[tag] = 1;
          tagChannelDates = {
            key: tag,
            id: tag,
            tag: tag,
            name: '' + tag,
            group: '',
            used_quota: 0,
            response_time: 0,
            priority: -1,
            weight: -1,
          };
          tagChannelDates.children = [];
          channelDates.push(tagChannelDates);
        } else {
          tagChannelDates = channelDates.find((item) => item.key === tag);
        }

        if (tagChannelDates.priority === -1) {
          tagChannelDates.priority = channels[i].priority;
        } else {
          if (tagChannelDates.priority !== channels[i].priority) {
            tagChannelDates.priority = '';
          }
        }

        if (tagChannelDates.weight === -1) {
          tagChannelDates.weight = channels[i].weight;
        } else {
          if (tagChannelDates.weight !== channels[i].weight) {
            tagChannelDates.weight = '';
          }
        }

        if (tagChannelDates.group === '') {
          tagChannelDates.group = channels[i].group;
        } else {
          let channelGroupsStr = channels[i].group;
          channelGroupsStr.split(',').forEach((item, index) => {
            if (tagChannelDates.group.indexOf(item) === -1) {
              tagChannelDates.group += ',' + item;
            }
          });
        }

        tagChannelDates.children.push(channels[i]);
        if (channels[i].status === 1) {
          tagChannelDates.status = 1;
        }
        tagChannelDates.used_quota += channels[i].used_quota;
        tagChannelDates.response_time += channels[i].response_time;
        tagChannelDates.response_time = tagChannelDates.response_time / 2;
      }
    }
    setChannels(channelDates);
  };

  // Get form values helper
  const getFormValues = () => {
    const formValues = formApi ? formApi.getValues() : {};
    return {
      searchKeyword: formValues.searchKeyword || '',
      searchGroup: formValues.searchGroup || '',
      searchModel: formValues.searchModel || '',
    };
  };

  // Load channels
  const loadChannels = async (
    page,
    pageSize,
    idSort,
    enableTagMode,
    typeKey = activeTypeKey,
    statusF,
  ) => {
    if (statusF === undefined) statusF = statusFilter;

    const { searchKeyword, searchGroup, searchModel } = getFormValues();
    if (searchKeyword !== '' || searchGroup !== '' || searchModel !== '') {
      setLoading(true);
      await searchChannels(
        enableTagMode,
        typeKey,
        statusF,
        page,
        pageSize,
        idSort,
      );
      setLoading(false);
      return;
    }

    const reqId = ++requestCounter.current;
    setLoading(true);
    const typeParam = typeKey !== 'all' ? `&type=${typeKey}` : '';
    const statusParam = statusF !== 'all' ? `&status=${statusF}` : '';
    const res = await API.get(
      `/api/channel/?p=${page}&page_size=${pageSize}&id_sort=${idSort}&tag_mode=${enableTagMode}${typeParam}${statusParam}`,
    );

    if (res === undefined || reqId !== requestCounter.current) {
      return;
    }

    const { success, message, data } = res.data;
    if (success) {
      const { items, total, type_counts } = data;
      if (type_counts) {
        const sumAll = Object.values(type_counts).reduce(
          (acc, v) => acc + v,
          0,
        );
        setTypeCounts({ ...type_counts, all: sumAll });
      }
      setChannelFormat(items, enableTagMode);
      setChannelCount(total);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  // Search channels
  const searchChannels = async (
    enableTagMode,
    typeKey = activeTypeKey,
    statusF = statusFilter,
    page = 1,
    pageSz = pageSize,
    sortFlag = idSort,
  ) => {
    const { searchKeyword, searchGroup, searchModel } = getFormValues();
    setSearching(true);
    try {
      if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
        await loadChannels(
          page,
          pageSz,
          sortFlag,
          enableTagMode,
          typeKey,
          statusF,
        );
        return;
      }

      const typeParam = typeKey !== 'all' ? `&type=${typeKey}` : '';
      const statusParam = statusF !== 'all' ? `&status=${statusF}` : '';
      const res = await API.get(
        `/api/channel/search?keyword=${searchKeyword}&group=${searchGroup}&model=${searchModel}&id_sort=${sortFlag}&tag_mode=${enableTagMode}&p=${page}&page_size=${pageSz}${typeParam}${statusParam}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        const { items = [], total = 0, type_counts = {} } = data;
        const sumAll = Object.values(type_counts).reduce(
          (acc, v) => acc + v,
          0,
        );
        setTypeCounts({ ...type_counts, all: sumAll });
        setChannelFormat(items, enableTagMode);
        setChannelCount(total);
        setActivePage(page);
      } else {
        showError(message);
      }
    } finally {
      setSearching(false);
    }
  };

  // Refresh
  const refresh = async (page = activePage) => {
    const { searchKeyword, searchGroup, searchModel } = getFormValues();
    if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
      await loadChannels(page, pageSize, idSort, enableTagMode);
    } else {
      await searchChannels(
        enableTagMode,
        activeTypeKey,
        statusFilter,
        page,
        pageSize,
        idSort,
      );
    }
  };

  const upstreamUpdates = useChannelUpstreamUpdates({ t, refresh });

  // Channel management
  const manageChannel = async (id, action, record, value) => {
    let data = { id };
    let res;
    switch (action) {
      case 'delete':
        res = await API.delete(`/api/channel/${id}/`);
        break;
      case 'enable':
        data.status = 1;
        res = await API.put('/api/channel/', data);
        break;
      case 'disable':
        data.status = 2;
        res = await API.put('/api/channel/', data);
        break;
      case 'priority':
        if (value === '') return;
        data.priority = parseInt(value);
        res = await API.put('/api/channel/', data);
        break;
      case 'weight':
        if (value === '') return;
        data.weight = parseInt(value);
        if (data.weight < 0) data.weight = 0;
        res = await API.put('/api/channel/', data);
        break;
      case 'enable_all':
        data.channel_info = record.channel_info;
        data.channel_info.multi_key_status_list = {};
        res = await API.put('/api/channel/', data);
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t(''));
      let channel = res.data.data;
      let newChannels = [...channels];
      if (action !== 'delete') {
        record.status = channel.status;
      }
      setChannels(newChannels);
    } else {
      showError(message);
    }
  };

  // Tag management
  const manageTag = async (tag, action) => {
    let res;
    switch (action) {
      case 'enable':
        res = await API.post('/api/channel/tag/enabled', { tag: tag });
        break;
      case 'disable':
        res = await API.post('/api/channel/tag/disabled', { tag: tag });
        break;
    }
    const { success, message } = res.data;
    if (success) {
      showSuccess(t(''));
      let newChannels = [...channels];
      for (let i = 0; i < newChannels.length; i++) {
        if (newChannels[i].tag === tag) {
          let status = action === 'enable' ? 1 : 2;
          newChannels[i]?.children?.forEach((channel) => {
            channel.status = status;
          });
          newChannels[i].status = status;
        }
      }
      setChannels(newChannels);
    } else {
      showError(message);
    }
  };

  // Page handlers
  const handlePageChange = (page) => {
    const { searchKeyword, searchGroup, searchModel } = getFormValues();
    setActivePage(page);
    if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
      loadChannels(page, pageSize, idSort, enableTagMode).then(() => {});
    } else {
      searchChannels(
        enableTagMode,
        activeTypeKey,
        statusFilter,
        page,
        pageSize,
        idSort,
      );
    }
  };

  const handlePageSizeChange = async (size) => {
    localStorage.setItem('page-size', size + '');
    setPageSize(size);
    setActivePage(1);
    const { searchKeyword, searchGroup, searchModel } = getFormValues();
    if (searchKeyword === '' && searchGroup === '' && searchModel === '') {
      loadChannels(1, size, idSort, enableTagMode)
        .then()
        .catch((reason) => {
          showError(reason);
        });
    } else {
      searchChannels(
        enableTagMode,
        activeTypeKey,
        statusFilter,
        1,
        size,
        idSort,
      );
    }
  };

  // Fetch groups
  const fetchGroups = async () => {
    try {
      let res = await API.get(`/api/group/`);
      if (res === undefined) return;
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

  // Copy channel
  const copySelectedChannel = async (record) => {
    try {
      const res = await API.post(`/api/channel/copy/${record.id}`);
      if (res?.data?.success) {
        showSuccess(t(''));
        await refresh();
      } else {
        showError(res?.data?.message || t(''));
      }
    } catch (error) {
      showError(
        t(': ') +
          (error?.response?.data?.message || error?.message || error),
      );
    }
  };

  // Update channel property
  const updateChannelProperty = (channelId, updateFn) => {
    const newChannels = [...channels];
    let updated = false;

    newChannels.forEach((channel) => {
      if (channel.children !== undefined) {
        channel.children.forEach((child) => {
          if (child.id === channelId) {
            updateFn(child);
            updated = true;
          }
        });
      } else if (channel.id === channelId) {
        updateFn(channel);
        updated = true;
      }
    });

    if (updated) {
      setChannels(newChannels);
    }
  };

  // Tag edit
  const submitTagEdit = async (type, data) => {
    switch (type) {
      case 'priority':
        if (data.priority === undefined || data.priority === '') {
          showInfo('');
          return;
        }
        data.priority = parseInt(data.priority);
        break;
      case 'weight':
        if (
          data.weight === undefined ||
          data.weight < 0 ||
          data.weight === ''
        ) {
          showInfo('');
          return;
        }
        data.weight = parseInt(data.weight);
        break;
    }

    try {
      const res = await API.put('/api/channel/tag', data);
      if (res?.data?.success) {
        showSuccess('');
        await refresh();
      }
    } catch (error) {
      showError(error);
    }
  };

  // Close edit
  const closeEdit = () => {
    setShowEdit(false);
  };

  // Row style
  const handleRow = (record, index) => {
    if (record.status !== 1) {
      return {
        style: {
          background: 'var(--semi-color-disabled-border)',
        },
      };
    } else {
      return {};
    }
  };

  // Batch operations
  const batchSetChannelTag = async () => {
    if (selectedChannels.length === 0) {
      showError(t(''));
      return;
    }
    if (batchSetTagValue === '') {
      showError(t(''));
      return;
    }
    let ids = selectedChannels.map((channel) => channel.id);
    const res = await API.post('/api/channel/batch/tag', {
      ids: ids,
      tag: batchSetTagValue === '' ? null : batchSetTagValue,
    });
    if (res.data.success) {
      showSuccess(
        t(' ${count} ').replace('${count}', res.data.data),
      );
      await refresh();
      setShowBatchSetTag(false);
    } else {
      showError(res.data.message);
    }
  };

  const batchDeleteChannels = async () => {
    if (selectedChannels.length === 0) {
      showError(t(''));
      return;
    }
    setLoading(true);
    let ids = [];
    selectedChannels.forEach((channel) => {
      ids.push(channel.id);
    });
    const res = await API.post(`/api/channel/batch`, { ids: ids });
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(t(' ${data} ').replace('${data}', data));
      await refresh();
      setTimeout(() => {
        if (channels.length === 0 && activePage > 1) {
          refresh(activePage - 1);
        }
      }, 100);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  // Channel operations
  const testAllChannels = async () => {
    const res = await API.get(`/api/channel/test`);
    const { success, message } = res.data;
    if (success) {
      showInfo(t(''));
    } else {
      showError(message);
    }
  };

  const deleteAllDisabledChannels = async () => {
    const res = await API.delete(`/api/channel/disabled`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(
        t(' ${data} ').replace('${data}', data),
      );
      await refresh();
    } else {
      showError(message);
    }
  };

  const updateAllChannelsBalance = async () => {
    const res = await API.get(`/api/channel/update_balance`);
    const { success, message } = res.data;
    if (success) {
      showInfo(t(''));
    } else {
      showError(message);
    }
  };

  const updateChannelBalance = async (record) => {
    if (record?.type === 57) {
      openCodexUsageModal({
        t,
        record,
        onCopy: async (text) => {
          const ok = await copy(text);
          if (ok) showSuccess(t(''));
          else showError(t(''));
        },
      });
      return;
    }

    const res = await API.get(`/api/channel/update_balance/${record.id}/`);
    const { success, message, balance } = res.data;
    if (success) {
      updateChannelProperty(record.id, (channel) => {
        channel.balance = balance;
        channel.balance_updated_time = Date.now() / 1000;
      });
      showInfo(
        t(' ${name} ').replace('${name}', record.name),
      );
    } else {
      showError(message);
    }
  };

  const fixChannelsAbilities = async () => {
    const res = await API.post(`/api/channel/fix`);
    const { success, message, data } = res.data;
    if (success) {
      showSuccess(
        t(' ${success}  ${fails} ')
          .replace('${success}', data.success)
          .replace('${fails}', data.fails),
      );
      await refresh();
    } else {
      showError(message);
    }
  };

  const checkOllamaVersion = async (record) => {
    try {
      const res = await API.get(`/api/channel/ollama/version/${record.id}`);
      const { success, message, data } = res.data;

      if (success) {
        const version = data?.version || '-';
        const infoMessage = t(' Ollama  ${version}').replace(
          '${version}',
          version,
        );

        const handleCopyVersion = async () => {
          if (!version || version === '-') {
            showInfo(t(''));
            return;
          }

          const copied = await copy(version);
          if (copied) {
            showSuccess(t(''));
          } else {
            showError(t(''));
          }
        };

        Modal.info({
          title: t('Ollama '),
          content: infoMessage,
          centered: true,
          footer: (
            <div className='flex justify-end gap-2'>
              <Button type='tertiary' onClick={handleCopyVersion}>
                {t('')}
              </Button>
              <Button
                type='primary'
                theme='solid'
                onClick={() => Modal.destroyAll()}
              >
                {t('')}
              </Button>
            </div>
          ),
          hasCancel: false,
          hasOk: false,
          closable: true,
          maskClosable: true,
        });
      } else {
        showError(message || t(' Ollama '));
      }
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        t(' Ollama ');
      showError(errMsg);
    }
  };

  // Test channel - 
  const testChannel = async (
    record,
    model,
    endpointType = '',
    stream = false,
  ) => {
    const testKey = `${record.id}-${model}`;

    // 
    if (shouldStopBatchTestingRef.current && isBatchTesting) {
      return Promise.resolve();
    }

    // 
    setTestingModels((prev) => new Set([...prev, model]));

    try {
      let url = `/api/channel/test/${record.id}?model=${model}`;
      if (endpointType) {
        url += `&endpoint_type=${endpointType}`;
      }
      if (stream) {
        url += `&stream=true`;
      }
      const res = await API.get(url);

      // 
      if (shouldStopBatchTestingRef.current && isBatchTesting) {
        return Promise.resolve();
      }

      const { success, message, time, error_code } = res.data;

      // 
      setModelTestResults((prev) => ({
        ...prev,
        [testKey]: {
          success,
          message,
          time: time || 0,
          timestamp: Date.now(),
          errorCode: error_code || null,
        },
      }));

      if (success) {
        // 
        updateChannelProperty(record.id, (channel) => {
          channel.response_time = time * 1000;
          channel.test_time = Date.now() / 1000;
        });

        if (!model || model === '') {
          showInfo(
            t(' ${name}  ${time.toFixed(2)} ')
              .replace('${name}', record.name)
              .replace('${time.toFixed(2)}', time.toFixed(2)),
          );
        } else {
          showInfo(
            t(
              ' ${name}  ${model}  ${time.toFixed(2)} ',
            )
              .replace('${name}', record.name)
              .replace('${model}', model)
              .replace('${time.toFixed(2)}', time.toFixed(2)),
          );
        }
      } else {
        showError(message);
      }
    } catch (error) {
      // 
      const testKey = `${record.id}-${model}`;
      setModelTestResults((prev) => ({
        ...prev,
        [testKey]: {
          success: false,
          message: error.message || t(''),
          time: 0,
          timestamp: Date.now(),
          errorCode: null,
        },
      }));
      showError(error.message || t(''));
    } finally {
      // 
      setTestingModels((prev) => {
        const newSet = new Set(prev);
        newSet.delete(model);
        return newSet;
      });
    }
  };

  // 
  const batchTestModels = async () => {
    if (!currentTestChannel || !currentTestChannel.models) {
      showError(t(''));
      return;
    }

    const models = currentTestChannel.models
      .split(',')
      .filter((model) =>
        model.toLowerCase().includes(modelSearchKeyword.toLowerCase()),
      );

    if (models.length === 0) {
      showError(t(''));
      return;
    }

    setIsBatchTesting(true);
    shouldStopBatchTestingRef.current = false; // 

    // 
    setModelTestResults((prev) => {
      const newResults = { ...prev };
      models.forEach((model) => {
        const testKey = `${currentTestChannel.id}-${model}`;
        delete newResults[testKey];
      });
      return newResults;
    });

    try {
      showInfo(
        t(' ${count} ...').replace(
          '${count}',
          models.length,
        ),
      );

      // 
      const concurrencyLimit = 5;
      const results = [];

      for (let i = 0; i < models.length; i += concurrencyLimit) {
        // 
        if (shouldStopBatchTestingRef.current) {
          showInfo(t(''));
          break;
        }

        const batch = models.slice(i, i + concurrencyLimit);
        showInfo(
          t(' ${current} - ${end}  ( ${total} )')
            .replace('${current}', i + 1)
            .replace('${end}', Math.min(i + concurrencyLimit, models.length))
            .replace('${total}', models.length),
        );

        const batchPromises = batch.map((model) =>
          testChannel(
            currentTestChannel,
            model,
            selectedEndpointType,
            isStreamTest,
          ),
        );
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // 
        if (shouldStopBatchTestingRef.current) {
          showInfo(t(''));
          break;
        }

        // 
        if (i + concurrencyLimit < models.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      if (!shouldStopBatchTestingRef.current) {
        // 
        await new Promise((resolve) => setTimeout(resolve, 300));

        // 
        setModelTestResults((currentResults) => {
          let successCount = 0;
          let failCount = 0;

          models.forEach((model) => {
            const testKey = `${currentTestChannel.id}-${model}`;
            const result = currentResults[testKey];
            if (result && result.success) {
              successCount++;
            } else {
              failCount++;
            }
          });

          // 
          setTimeout(() => {
            showSuccess(
              t(': ${success}, : ${fail}, : ${total}')
                .replace('${success}', successCount)
                .replace('${fail}', failCount)
                .replace('${total}', models.length),
            );
          }, 100);

          return currentResults; // 
        });
      }
    } catch (error) {
      showError(t(': ') + error.message);
    } finally {
      setIsBatchTesting(false);
    }
  };

  // 
  const stopBatchTesting = () => {
    shouldStopBatchTestingRef.current = true;
    setIsBatchTesting(false);
    setTestingModels(new Set());
    showInfo(t(''));
  };

  // 
  const clearTestResults = () => {
    setModelTestResults({});
    showInfo(t(''));
  };

  // Handle close modal
  const handleCloseModal = () => {
    // 
    if (isBatchTesting) {
      shouldStopBatchTestingRef.current = true;
      showInfo(t(''));
    }

    setShowModelTestModal(false);
    setModelSearchKeyword('');
    setIsBatchTesting(false);
    setTestingModels(new Set());
    setSelectedModelKeys([]);
    setModelTablePage(1);
    setSelectedEndpointType('');
    setIsStreamTest(false);
    // 
  };

  // Type counts
  const channelTypeCounts = useMemo(() => {
    if (Object.keys(typeCounts).length > 0) return typeCounts;
    const counts = { all: channels.length };
    channels.forEach((channel) => {
      const collect = (ch) => {
        const type = ch.type;
        counts[type] = (counts[type] || 0) + 1;
      };
      if (channel.children !== undefined) {
        channel.children.forEach(collect);
      } else {
        collect(channel);
      }
    });
    return counts;
  }, [typeCounts, channels]);

  const availableTypeKeys = useMemo(() => {
    const keys = ['all'];
    Object.entries(channelTypeCounts).forEach(([k, v]) => {
      if (k !== 'all' && v > 0) keys.push(String(k));
    });
    return keys;
  }, [channelTypeCounts]);

  return {
    // Basic states
    channels,
    loading,
    searching,
    activePage,
    pageSize,
    channelCount,
    groupOptions,
    idSort,
    enableTagMode,
    enableBatchDelete,
    statusFilter,
    compactMode,
    globalPassThroughEnabled,

    // UI states
    showEdit,
    setShowEdit,
    editingChannel,
    setEditingChannel,
    showEditTag,
    setShowEditTag,
    editingTag,
    setEditingTag,
    selectedChannels,
    setSelectedChannels,
    showBatchSetTag,
    setShowBatchSetTag,
    batchSetTagValue,
    setBatchSetTagValue,

    // Column states
    visibleColumns,
    showColumnSelector,
    setShowColumnSelector,
    COLUMN_KEYS,

    // Type tab states
    activeTypeKey,
    setActiveTypeKey,
    typeCounts,
    channelTypeCounts,
    availableTypeKeys,

    // Model test states
    showModelTestModal,
    setShowModelTestModal,
    currentTestChannel,
    setCurrentTestChannel,
    modelSearchKeyword,
    setModelSearchKeyword,
    modelTestResults,
    testingModels,
    selectedModelKeys,
    setSelectedModelKeys,
    isBatchTesting,
    modelTablePage,
    setModelTablePage,
    selectedEndpointType,
    setSelectedEndpointType,
    isStreamTest,
    setIsStreamTest,
    allSelectingRef,

    // Multi-key management states
    showMultiKeyManageModal,
    setShowMultiKeyManageModal,
    currentMultiKeyChannel,
    setCurrentMultiKeyChannel,
    ...upstreamUpdates,

    // Form
    formApi,
    setFormApi,
    formInitValues,

    // Helpers
    t,
    isMobile,

    // Functions
    loadChannels,
    searchChannels,
    refresh,
    manageChannel,
    manageTag,
    handlePageChange,
    handlePageSizeChange,
    copySelectedChannel,
    updateChannelProperty,
    submitTagEdit,
    closeEdit,
    handleRow,
    batchSetChannelTag,
    batchDeleteChannels,
    testAllChannels,
    deleteAllDisabledChannels,
    updateAllChannelsBalance,
    updateChannelBalance,
    fixChannelsAbilities,
    checkOllamaVersion,
    testChannel,
    batchTestModels,
    handleCloseModal,
    getFormValues,

    // Column functions
    handleColumnVisibilityChange,
    handleSelectAll,
    initDefaultColumns,
    getDefaultColumnVisibility,

    // Setters
    setIdSort,
    setEnableTagMode,
    setEnableBatchDelete,
    setStatusFilter,
    setCompactMode,
    setActivePage,
  };
};

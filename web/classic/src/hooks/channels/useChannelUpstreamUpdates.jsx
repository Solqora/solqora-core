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

import { useRef, useState } from 'react';
import { API, showError, showInfo, showSuccess } from '../../helpers';
import { normalizeModelList } from './upstreamUpdateUtils';

const getManualIgnoredModelCountFromSettings = (settings) => {
  let parsed = null;
  if (settings && typeof settings === 'object') {
    parsed = settings;
  } else if (typeof settings === 'string') {
    try {
      parsed = JSON.parse(settings);
    } catch (error) {
      parsed = null;
    }
  }
  if (!parsed || typeof parsed !== 'object') {
    return 0;
  }
  return normalizeModelList(parsed.upstream_model_update_ignored_models).length;
};

export const useChannelUpstreamUpdates = ({ t, refresh }) => {
  const [showUpstreamUpdateModal, setShowUpstreamUpdateModal] = useState(false);
  const [upstreamUpdateChannel, setUpstreamUpdateChannel] = useState(null);
  const [upstreamUpdateAddModels, setUpstreamUpdateAddModels] = useState([]);
  const [upstreamUpdateRemoveModels, setUpstreamUpdateRemoveModels] = useState(
    [],
  );
  const [upstreamUpdatePreferredTab, setUpstreamUpdatePreferredTab] =
    useState('add');
  const [upstreamApplyLoading, setUpstreamApplyLoading] = useState(false);
  const [detectAllUpstreamUpdatesLoading, setDetectAllUpstreamUpdatesLoading] =
    useState(false);
  const [applyAllUpstreamUpdatesLoading, setApplyAllUpstreamUpdatesLoading] =
    useState(false);

  const applyUpstreamUpdatesInFlightRef = useRef(false);
  const detectChannelUpstreamUpdatesInFlightRef = useRef(false);
  const detectAllUpstreamUpdatesInFlightRef = useRef(false);
  const applyAllUpstreamUpdatesInFlightRef = useRef(false);

  const openUpstreamUpdateModal = (
    record,
    pendingAddModels = [],
    pendingRemoveModels = [],
    preferredTab = 'add',
  ) => {
    const normalizedAddModels = normalizeModelList(pendingAddModels);
    const normalizedRemoveModels = normalizeModelList(pendingRemoveModels);
    if (
      !record?.id ||
      (normalizedAddModels.length === 0 && normalizedRemoveModels.length === 0)
    ) {
      showInfo(t(''));
      return;
    }
    setUpstreamUpdateChannel(record);
    setUpstreamUpdateAddModels(normalizedAddModels);
    setUpstreamUpdateRemoveModels(normalizedRemoveModels);
    const normalizedPreferredTab = preferredTab === 'remove' ? 'remove' : 'add';
    setUpstreamUpdatePreferredTab(normalizedPreferredTab);
    setShowUpstreamUpdateModal(true);
  };

  const closeUpstreamUpdateModal = () => {
    setShowUpstreamUpdateModal(false);
    setUpstreamUpdateChannel(null);
    setUpstreamUpdateAddModels([]);
    setUpstreamUpdateRemoveModels([]);
    setUpstreamUpdatePreferredTab('add');
  };

  const applyUpstreamUpdates = async ({
    addModels: selectedAddModels = [],
    removeModels: selectedRemoveModels = [],
  } = {}) => {
    if (applyUpstreamUpdatesInFlightRef.current) {
      showInfo(t(''));
      return;
    }
    if (!upstreamUpdateChannel?.id) {
      closeUpstreamUpdateModal();
      return;
    }
    applyUpstreamUpdatesInFlightRef.current = true;
    setUpstreamApplyLoading(true);

    try {
      const normalizedSelectedAddModels = normalizeModelList(selectedAddModels);
      const normalizedSelectedRemoveModels =
        normalizeModelList(selectedRemoveModels);
      const selectedAddSet = new Set(normalizedSelectedAddModels);
      const ignoreModels = upstreamUpdateAddModels.filter(
        (model) => !selectedAddSet.has(model),
      );

      const res = await API.post(
        '/api/channel/upstream_updates/apply',
        {
          id: upstreamUpdateChannel.id,
          add_models: normalizedSelectedAddModels,
          ignore_models: ignoreModels,
          remove_models: normalizedSelectedRemoveModels,
        },
        { skipErrorHandler: true },
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t(''));
        return;
      }

      const addedCount = data?.added_models?.length || 0;
      const removedCount = data?.removed_models?.length || 0;
      const totalIgnoredCount = getManualIgnoredModelCountFromSettings(
        data?.settings,
      );
      const ignoredCount = normalizeModelList(ignoreModels).length;
      showSuccess(
        t(
          ' {{added}}  {{removed}}  {{ignored}}  {{totalIgnored}} ',
          {
            added: addedCount,
            removed: removedCount,
            ignored: ignoredCount,
            totalIgnored: totalIgnoredCount,
          },
        ),
      );
      closeUpstreamUpdateModal();
      await refresh();
    } catch (error) {
      showError(
        error?.response?.data?.message || error?.message || t(''),
      );
    } finally {
      applyUpstreamUpdatesInFlightRef.current = false;
      setUpstreamApplyLoading(false);
    }
  };

  const applyAllUpstreamUpdates = async () => {
    if (applyAllUpstreamUpdatesInFlightRef.current) {
      showInfo(t(''));
      return;
    }
    applyAllUpstreamUpdatesInFlightRef.current = true;
    setApplyAllUpstreamUpdatesLoading(true);
    try {
      const res = await API.post(
        '/api/channel/upstream_updates/apply_all',
        {},
        { skipErrorHandler: true },
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t(''));
        return;
      }

      const channelCount = data?.processed_channels || 0;
      const addedCount = data?.added_models || 0;
      const removedCount = data?.removed_models || 0;
      const failedCount = (data?.failed_channel_ids || []).length;
      showSuccess(
        t(
          ' {{channels}}  {{added}}  {{removed}}  {{fails}} ',
          {
            channels: channelCount,
            added: addedCount,
            removed: removedCount,
            fails: failedCount,
          },
        ),
      );
      await refresh();
    } catch (error) {
      showError(
        error?.response?.data?.message || error?.message || t(''),
      );
    } finally {
      applyAllUpstreamUpdatesInFlightRef.current = false;
      setApplyAllUpstreamUpdatesLoading(false);
    }
  };

  const detectChannelUpstreamUpdates = async (channel) => {
    if (detectChannelUpstreamUpdatesInFlightRef.current) {
      showInfo(t(''));
      return;
    }
    if (!channel?.id) {
      return;
    }
    detectChannelUpstreamUpdatesInFlightRef.current = true;
    try {
      const res = await API.post(
        '/api/channel/upstream_updates/detect',
        {
          id: channel.id,
        },
        { skipErrorHandler: true },
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t(''));
        return;
      }

      const addCount = data?.add_models?.length || 0;
      const removeCount = data?.remove_models?.length || 0;
      showSuccess(
        t(' {{add}}  {{remove}} ', {
          add: addCount,
          remove: removeCount,
        }),
      );
      await refresh();
    } catch (error) {
      showError(
        error?.response?.data?.message || error?.message || t(''),
      );
    } finally {
      detectChannelUpstreamUpdatesInFlightRef.current = false;
    }
  };

  const detectAllUpstreamUpdates = async () => {
    if (detectAllUpstreamUpdatesInFlightRef.current) {
      showInfo(t(''));
      return;
    }
    detectAllUpstreamUpdatesInFlightRef.current = true;
    setDetectAllUpstreamUpdatesLoading(true);
    try {
      const res = await API.post(
        '/api/channel/upstream_updates/detect_all',
        {},
        { skipErrorHandler: true },
      );
      const { success, message, data } = res.data || {};
      if (!success) {
        showError(message || t(''));
        return;
      }

      const channelCount = data?.processed_channels || 0;
      const addCount = data?.detected_add_models || 0;
      const removeCount = data?.detected_remove_models || 0;
      const failedCount = (data?.failed_channel_ids || []).length;
      showSuccess(
        t(
          ' {{channels}}  {{add}}  {{remove}}  {{fails}} ',
          {
            channels: channelCount,
            add: addCount,
            remove: removeCount,
            fails: failedCount,
          },
        ),
      );
      await refresh();
    } catch (error) {
      showError(
        error?.response?.data?.message || error?.message || t(''),
      );
    } finally {
      detectAllUpstreamUpdatesInFlightRef.current = false;
      setDetectAllUpstreamUpdatesLoading(false);
    }
  };

  return {
    showUpstreamUpdateModal,
    setShowUpstreamUpdateModal,
    upstreamUpdateChannel,
    upstreamUpdateAddModels,
    upstreamUpdateRemoveModels,
    upstreamUpdatePreferredTab,
    upstreamApplyLoading,
    detectAllUpstreamUpdatesLoading,
    applyAllUpstreamUpdatesLoading,
    openUpstreamUpdateModal,
    closeUpstreamUpdateModal,
    applyUpstreamUpdates,
    applyAllUpstreamUpdates,
    detectChannelUpstreamUpdates,
    detectAllUpstreamUpdates,
  };
};

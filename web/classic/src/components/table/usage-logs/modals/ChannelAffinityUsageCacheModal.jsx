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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Descriptions, Spin, Typography } from '@douyinfe/semi-ui';
import { API, showError, timestamp2string } from '../../../../helpers';

const { Text } = Typography;

function formatRate(hit, total) {
  if (!total || total <= 0) return '-';
  const r = (Number(hit || 0) / Number(total || 0)) * 100;
  if (!Number.isFinite(r)) return '-';
  return `${r.toFixed(2)}%`;
}

function formatTokenRate(n, d) {
  const nn = Number(n || 0);
  const dd = Number(d || 0);
  if (!dd || dd <= 0) return '-';
  const r = (nn / dd) * 100;
  if (!Number.isFinite(r)) return '-';
  return `${r.toFixed(2)}%`;
}

function formatCachedTokenRate(cachedTokens, promptTokens, mode) {
  if (mode === 'cached_over_prompt_plus_cached') {
    const denominator = Number(promptTokens || 0) + Number(cachedTokens || 0);
    return formatTokenRate(cachedTokens, denominator);
  }
  if (mode === 'cached_over_prompt') {
    return formatTokenRate(cachedTokens, promptTokens);
  }
  return '-';
}

function hasTextValue(value) {
  return typeof value === 'string' && value.trim() !== '';
}

const ChannelAffinityUsageCacheModal = ({
  t,
  showChannelAffinityUsageCacheModal,
  setShowChannelAffinityUsageCacheModal,
  channelAffinityUsageCacheTarget,
}) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const requestSeqRef = useRef(0);

  const params = useMemo(() => {
    const x = channelAffinityUsageCacheTarget || {};
    return {
      rule_name: (x.rule_name || '').trim(),
      using_group: (x.using_group || '').trim(),
      key_hint: (x.key_hint || '').trim(),
      key_fp: (x.key_fp || '').trim(),
    };
  }, [channelAffinityUsageCacheTarget]);

  useEffect(() => {
    if (!showChannelAffinityUsageCacheModal) {
      requestSeqRef.current += 1; // invalidate inflight request
      setLoading(false);
      setStats(null);
      return;
    }
    if (!params.rule_name || !params.key_fp) {
      setLoading(false);
      setStats(null);
      return;
    }

    const reqSeq = (requestSeqRef.current += 1);
    setStats(null);
    setLoading(true);
    (async () => {
      try {
        const res = await API.get('/api/log/channel_affinity_usage_cache', {
          params,
          disableDuplicate: true,
        });
        if (reqSeq !== requestSeqRef.current) return;
        const { success, message, data } = res.data || {};
        if (!success) {
          setStats(null);
          showError(t(message || ''));
          return;
        }
        setStats(data || {});
      } catch (e) {
        if (reqSeq !== requestSeqRef.current) return;
        setStats(null);
        showError(t(''));
      } finally {
        if (reqSeq !== requestSeqRef.current) return;
        setLoading(false);
      }
    })();
  }, [
    showChannelAffinityUsageCacheModal,
    params.rule_name,
    params.using_group,
    params.key_hint,
    params.key_fp,
    t,
  ]);

  const { rows, supportsTokenStats } = useMemo(() => {
    const s = stats || {};
    const hit = Number(s.hit || 0);
    const total = Number(s.total || 0);
    const windowSeconds = Number(s.window_seconds || 0);
    const lastSeenAt = Number(s.last_seen_at || 0);
    const promptTokens = Number(s.prompt_tokens || 0);
    const completionTokens = Number(s.completion_tokens || 0);
    const totalTokens = Number(s.total_tokens || 0);
    const cachedTokens = Number(s.cached_tokens || 0);
    const promptCacheHitTokens = Number(s.prompt_cache_hit_tokens || 0);
    const cachedTokenRateMode = String(s.cached_token_rate_mode || '').trim();
    const supportsTokenStats =
      cachedTokenRateMode === 'cached_over_prompt' ||
      cachedTokenRateMode === 'cached_over_prompt_plus_cached' ||
      cachedTokenRateMode === 'mixed';

    const data = [];
    const ruleName = String(s.rule_name || params.rule_name || '').trim();
    const usingGroup = String(s.using_group || params.using_group || '').trim();
    const keyHint = String(params.key_hint || '').trim();
    const keyFp = String(s.key_fp || params.key_fp || '').trim();

    if (hasTextValue(ruleName)) {
      data.push({ key: t(''), value: ruleName });
    }
    if (hasTextValue(usingGroup)) {
      data.push({ key: t(''), value: usingGroup });
    }
    if (hasTextValue(keyHint)) {
      data.push({ key: t('Key '), value: keyHint });
    }
    if (hasTextValue(keyFp)) {
      data.push({ key: t('Key '), value: keyFp });
    }
    if (windowSeconds > 0) {
      data.push({ key: t('TTL'), value: windowSeconds });
    }
    if (total > 0) {
      data.push({ key: t(''), value: `${hit}/${total} (${formatRate(hit, total)})` });
    }
    if (lastSeenAt > 0) {
      data.push({ key: t(''), value: timestamp2string(lastSeenAt) });
    }

    if (supportsTokenStats) {
      if (promptTokens > 0) {
        data.push({ key: t('Prompt tokens'), value: promptTokens });
      }
      if (promptTokens > 0 || cachedTokens > 0) {
        data.push({
          key: t('Cached tokens'),
          value: `${cachedTokens} (${formatCachedTokenRate(cachedTokens, promptTokens, cachedTokenRateMode)})`,
        });
      }
      if (promptCacheHitTokens > 0) {
        data.push({ key: t('Prompt cache hit tokens'), value: promptCacheHitTokens });
      }
      if (completionTokens > 0) {
        data.push({ key: t('Completion tokens'), value: completionTokens });
      }
      if (totalTokens > 0) {
        data.push({ key: t('Total tokens'), value: totalTokens });
      }
    }

    return { rows: data, supportsTokenStats };
  }, [stats, params, t]);

  return (
    <Modal
      title={t('')}
      visible={showChannelAffinityUsageCacheModal}
      onCancel={() => setShowChannelAffinityUsageCacheModal(false)}
      footer={null}
      centered
      closable
      maskClosable
      width={640}
    >
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Text type='tertiary' size='small'>
            {t(
              'usage  cached tokens cached_tokens/prompt_cache_hit_tokens',
            )}
            {' '}
            {t(
              'Cached tokens Claude  cached/(prompt+cached) cached/prompt',
            )}
            {' '}
            {t(' OpenAI / Claude  token  token ')}
            {stats && !supportsTokenStats ? (
              <>
                {' '}
                {t(' token ')}
              </>
            ) : null}
          </Text>
        </div>
        <Spin spinning={loading} tip={t('...')}>
          {stats && rows.length > 0 ? (
            <Descriptions data={rows} />
          ) : (
            <div style={{ padding: '24px 0' }}>
              <Text type='tertiary' size='small'>
                {loading ? t('...') : t('')}
              </Text>
            </div>
          )}
        </Spin>
      </div>
    </Modal>
  );
};

export default ChannelAffinityUsageCacheModal;

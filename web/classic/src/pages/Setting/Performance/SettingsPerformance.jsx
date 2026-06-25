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
  Col,
  Form,
  InputNumber,
  Row,
  Spin,
  Progress,
  Descriptions,
  Tag,
  Popconfirm,
  RadioGroup,
  Radio,
  Typography,
} from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

// 
function formatBytes(bytes, decimals = 2) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '0 Bytes';
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return '-' + formatBytes(-bytes, decimals);
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return bytes + ' Bytes';
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function SettingsPerformance(props) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [inputs, setInputs] = useState({
    'performance_setting.disk_cache_enabled': false,
    'performance_setting.disk_cache_threshold_mb': 10,
    'performance_setting.disk_cache_max_size_mb': 1024,
    'performance_setting.disk_cache_path': '',
    'performance_setting.monitor_enabled': false,
    'performance_setting.monitor_cpu_threshold': 90,
    'performance_setting.monitor_memory_threshold': 90,
    'performance_setting.monitor_disk_threshold': 95,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  const [logInfo, setLogInfo] = useState(null);
  const [logCleanupMode, setLogCleanupMode] = useState('by_count');
  const [logCleanupValue, setLogCleanupValue] = useState(10);
  const [logCleanupLoading, setLogCleanupLoading] = useState(false);

  function handleFieldChange(fieldName) {
    return (value) => {
      setInputs((inputs) => ({ ...inputs, [fieldName]: value }));
    };
  }

  function onSubmit() {
    const updateArray = compareObjects(inputs, inputsRow);
    if (!updateArray.length) return showWarning(t(''));
    const requestQueue = updateArray.map((item) => {
      let value = '';
      if (typeof inputs[item.key] === 'boolean') {
        value = String(inputs[item.key]);
      } else {
        value = String(inputs[item.key]);
      }
      return API.put('/api/option/', {
        key: item.key,
        value,
      });
    });
    setLoading(true);
    Promise.all(requestQueue)
      .then((res) => {
        if (requestQueue.length === 1) {
          if (res.includes(undefined)) return;
        } else if (requestQueue.length > 1) {
          if (res.includes(undefined))
            return showError(t(''));
        }
        showSuccess(t(''));
        props.refresh();
        fetchStats();
      })
      .catch(() => {
        showError(t(''));
      })
      .finally(() => {
        setLoading(false);
      });
  }

  async function fetchStats() {
    setStatsLoading(true);
    try {
      const res = await API.get('/api/performance/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch performance stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }

  async function clearDiskCache() {
    try {
      const res = await API.delete('/api/performance/disk_cache');
      if (res.data.success) {
        showSuccess(t(''));
        fetchStats();
      } else {
        showError(res.data.message || t(''));
      }
    } catch (error) {
      showError(t(''));
    }
  }

  async function resetStats() {
    try {
      const res = await API.post('/api/performance/reset_stats');
      if (res.data.success) {
        showSuccess(t(''));
        fetchStats();
      }
    } catch (error) {
      showError(t(''));
    }
  }

  async function forceGC() {
    try {
      const res = await API.post('/api/performance/gc');
      if (res.data.success) {
        showSuccess(t('GC '));
        fetchStats();
      }
    } catch (error) {
      showError(t('GC '));
    }
  }

  async function fetchLogInfo() {
    try {
      const res = await API.get('/api/performance/logs');
      if (res.data.success) {
        setLogInfo(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch log info:', error);
    }
  }

  async function cleanupLogFiles() {
    if (logCleanupValue == null || isNaN(logCleanupValue) || logCleanupValue < 1) {
      showError(t(''));
      return;
    }
    setLogCleanupLoading(true);
    try {
      const res = await API.delete(
        `/api/performance/logs?mode=${logCleanupMode}&value=${logCleanupValue}`,
      );
      if (res.data.success) {
        const { deleted_count, freed_bytes } = res.data.data;
        showSuccess(
          t(' {{count}}  {{size}}', {
            count: deleted_count,
            size: formatBytes(freed_bytes),
          }),
        );
      } else {
        showError(res.data.message || t(''));
      }
      fetchLogInfo();
    } catch (error) {
      showError(t(''));
    } finally {
      setLogCleanupLoading(false);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        if (typeof inputs[key] === 'boolean') {
          currentInputs[key] =
            props.options[key] === 'true' || props.options[key] === true;
        } else if (typeof inputs[key] === 'number') {
          currentInputs[key] = parseInt(props.options[key]) || inputs[key];
        } else {
          currentInputs[key] = props.options[key];
        }
      }
    }
    setInputs({ ...inputs, ...currentInputs });
    setInputsRow({ ...inputs, ...currentInputs });
    if (refForm.current) {
      refForm.current.setValues({ ...inputs, ...currentInputs });
    }
    fetchStats();
    fetchLogInfo();
  }, [props.options]);

  const diskCacheUsagePercent =
    stats?.cache_stats?.disk_cache_max_bytes > 0
      ? (
          (stats.cache_stats.current_disk_usage_bytes /
            stats.cache_stats.disk_cache_max_bytes) *
          100
        ).toFixed(1)
      : 0;

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('')}>
            <Banner
              type='info'
              description={t(
                '/ SSD ',
              )}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.Switch
                  field={'performance_setting.disk_cache_enabled'}
                  label={t('')}
                  extraText={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={handleFieldChange(
                    'performance_setting.disk_cache_enabled',
                  )}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  field={'performance_setting.disk_cache_threshold_mb'}
                  label={t(' (MB)')}
                  extraText={t('')}
                  min={1}
                  max={1024}
                  onChange={handleFieldChange(
                    'performance_setting.disk_cache_threshold_mb',
                  )}
                  disabled={!inputs['performance_setting.disk_cache_enabled']}
                />
              </Col>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  field={'performance_setting.disk_cache_max_size_mb'}
                  label={t(' (MB)')}
                  extraText={
                    stats?.disk_space_info?.total > 0
                      ? t(': {{free}} / : {{total}}', {
                          free: formatBytes(stats.disk_space_info.free),
                          total: formatBytes(stats.disk_space_info.total),
                        })
                      : t('')
                  }
                  min={100}
                  max={102400}
                  onChange={handleFieldChange(
                    'performance_setting.disk_cache_max_size_mb',
                  )}
                  disabled={!inputs['performance_setting.disk_cache_enabled']}
                />
              </Col>
              {/*  */}
              {!stats?.config?.is_running_in_container && (
                <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                  <Form.Input
                    field={'performance_setting.disk_cache_path'}
                    label={t('')}
                    extraText={t('')}
                    placeholder={t(' /var/cache/new-api')}
                    onChange={handleFieldChange(
                      'performance_setting.disk_cache_path',
                    )}
                    showClear
                    disabled={!inputs['performance_setting.disk_cache_enabled']}
                  />
                </Col>
              )}
            </Row>
          </Form.Section>

          <Form.Section text={t('')}>
            <Banner
              type='info'
              description={t(
                ' Relay  (/v1, /v1beta )',
              )}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.Switch
                  field={'performance_setting.monitor_enabled'}
                  label={t('')}
                  extraText={t('')}
                  size='default'
                  checkedText=''
                  uncheckedText=''
                  onChange={handleFieldChange(
                    'performance_setting.monitor_enabled',
                  )}
                />
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field={'performance_setting.monitor_cpu_threshold'}
                  label={t('CPU  (%)')}
                  extraText={t('CPU ')}
                  min={0}
                  onChange={handleFieldChange(
                    'performance_setting.monitor_cpu_threshold',
                  )}
                  disabled={!inputs['performance_setting.monitor_enabled']}
                />
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field={'performance_setting.monitor_memory_threshold'}
                  label={t('  (%)')}
                  extraText={t('')}
                  min={0}
                  max={100}
                  onChange={handleFieldChange(
                    'performance_setting.monitor_memory_threshold',
                  )}
                  disabled={!inputs['performance_setting.monitor_enabled']}
                />
              </Col>
              <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                <Form.InputNumber
                  field={'performance_setting.monitor_disk_threshold'}
                  label={t('  (%)')}
                  extraText={t('')}
                  min={0}
                  max={100}
                  onChange={handleFieldChange(
                    'performance_setting.monitor_disk_threshold',
                  )}
                  disabled={!inputs['performance_setting.monitor_enabled']}
                />
              </Col>
            </Row>
            <Row>
              <Button size='default' onClick={onSubmit}>
                {t('')}
              </Button>
            </Row>
          </Form.Section>
        </Form>
      </Spin>

      {/*  */}
      <Form.Section text={t('')}>
        <Banner
          type='info'
          description={t(
            '',
          )}
          style={{ marginBottom: 16 }}
        />
        {logInfo === null ? null : logInfo.enabled ? (
          <>
            <Descriptions
              data={[
                { key: t(''), value: logInfo.log_dir },
                {
                  key: t(''),
                  value: logInfo.file_count,
                },
                {
                  key: t(''),
                  value: formatBytes(logInfo.total_size),
                },
                ...(logInfo.oldest_time && logInfo.newest_time
                  ? [
                      {
                        key: t(''),
                        value: `${new Date(logInfo.oldest_time).toLocaleDateString()} ~ ${new Date(logInfo.newest_time).toLocaleDateString()}`,
                      },
                    ]
                  : []),
              ]}
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t('')}
                  </Text>
                  <RadioGroup
                    value={logCleanupMode}
                    onChange={(e) => setLogCleanupMode(e.target.value)}
                  >
                    <Radio value='by_count'>{t('N')}</Radio>
                    <Radio value='by_days'>{t('N')}</Radio>
                  </RadioGroup>
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {logCleanupMode === 'by_count'
                      ? t('')
                      : t('')}
                  </Text>
                  <InputNumber
                    value={logCleanupValue}
                    min={1}
                    max={logCleanupMode === 'by_count' ? 1000 : 3650}
                    onChange={(value) => setLogCleanupValue(value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <div style={{ marginBottom: 12 }}>
                  <Text
                    strong
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      visibility: 'hidden',
                    }}
                  >
                    &nbsp;
                  </Text>
                <Popconfirm
                  title={t('')}
                  content={
                    logCleanupMode === 'by_count'
                      ? t(
                          ' {{value}} ',
                          { value: logCleanupValue },
                        )
                      : t(' {{value}} ', {
                          value: logCleanupValue,
                        })
                  }
                  onConfirm={cleanupLogFiles}
                >
                  <Button type='danger' loading={logCleanupLoading}>
                    {t('')}
                  </Button>
                </Popconfirm>
                </div>
              </Col>
            </Row>
          </>
        ) : (
          <Banner
            type='warning'
            description={t('')}
          />
        )}
      </Form.Section>

      {/*  */}
      <Spin spinning={statsLoading}>
        <Form.Section text={t('')}>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button onClick={fetchStats}>{t('')}</Button>
                <Popconfirm
                  title={t('')}
                  content={t(' 10 ')}
                  onConfirm={clearDiskCache}
                >
                  <Button type='warning'>{t('')}</Button>
                </Popconfirm>
                <Button onClick={resetStats}>{t('')}</Button>
                <Button onClick={forceGC}>{t(' GC')}</Button>
              </div>
            </Col>
          </Row>

          {stats && (
            <>
              {/*  */}
              <Row
                gutter={16}
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'stretch',
                }}
              >
                <Col xs={24} md={12} style={{ display: 'flex' }}>
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--semi-color-fill-0)',
                      borderRadius: 8,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                      {t('')}
                    </Text>
                    <Progress
                      percent={parseFloat(diskCacheUsagePercent)}
                      showInfo
                      style={{ marginBottom: 8 }}
                      stroke={
                        parseFloat(diskCacheUsagePercent) > 80
                          ? 'var(--semi-color-danger)'
                          : 'var(--semi-color-primary)'
                      }
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text type='tertiary'>
                        {formatBytes(
                          stats.cache_stats.current_disk_usage_bytes,
                        )}{' '}
                        / {formatBytes(stats.cache_stats.disk_cache_max_bytes)}
                      </Text>
                      <Text type='tertiary'>
                        {t('')}: {stats.cache_stats.active_disk_files}
                      </Text>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <Tag color='blue'>
                        {t('')}: {stats.cache_stats.disk_cache_hits}
                      </Tag>
                    </div>
                  </div>
                </Col>
                <Col xs={24} md={12} style={{ display: 'flex' }}>
                  <div
                    style={{
                      padding: 16,
                      background: 'var(--semi-color-fill-0)',
                      borderRadius: 8,
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Text strong style={{ marginBottom: 8, display: 'block' }}>
                      {t('')}
                    </Text>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <Text>
                        {t('')}:{' '}
                        {formatBytes(
                          stats.cache_stats.current_memory_usage_bytes,
                        )}
                      </Text>
                      <Text>
                        {t('')}:{' '}
                        {stats.cache_stats.active_memory_buffers}
                      </Text>
                    </div>
                    <div style={{ marginTop: 'auto' }}>
                      <Tag color='green'>
                        {t('')}: {stats.cache_stats.memory_cache_hits}
                      </Tag>
                    </div>
                  </div>
                </Col>
              </Row>

              {/*  */}
              {stats.disk_space_info?.total > 0 && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={24}>
                    <div
                      style={{
                        padding: 16,
                        background: 'var(--semi-color-fill-0)',
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        strong
                        style={{ marginBottom: 8, display: 'block' }}
                      >
                        {t('')}
                      </Text>
                      <Progress
                        percent={parseFloat(
                          stats.disk_space_info.used_percent.toFixed(1),
                        )}
                        showInfo
                        style={{ marginBottom: 8 }}
                        stroke={
                          stats.disk_space_info.used_percent > 90
                            ? 'var(--semi-color-danger)'
                            : stats.disk_space_info.used_percent > 70
                              ? 'var(--semi-color-warning)'
                              : 'var(--semi-color-primary)'
                        }
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 8,
                        }}
                      >
                        <Text type='tertiary'>
                          {t('')}: {formatBytes(stats.disk_space_info.used)}
                        </Text>
                        <Text type='tertiary'>
                          {t('')}: {formatBytes(stats.disk_space_info.free)}
                        </Text>
                        <Text type='tertiary'>
                          {t('')}:{' '}
                          {formatBytes(stats.disk_space_info.total)}
                        </Text>
                      </div>
                      {stats.disk_space_info.free <
                        inputs['performance_setting.disk_cache_max_size_mb'] *
                          1024 *
                          1024 && (
                        <Banner
                          type='warning'
                          description={t('')}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>
                  </Col>
                </Row>
              )}

              {/*  */}
              <Row gutter={16}>
                <Col span={24}>
                  <Descriptions
                    data={[
                      {
                        key: t(''),
                        value: formatBytes(stats.memory_stats.alloc),
                      },
                      {
                        key: t(''),
                        value: formatBytes(stats.memory_stats.total_alloc),
                      },
                      {
                        key: t(''),
                        value: formatBytes(stats.memory_stats.sys),
                      },
                      { key: t('GC '), value: stats.memory_stats.num_gc },
                      {
                        key: t('Goroutine '),
                        value: stats.memory_stats.num_goroutine,
                      },
                      {
                        key: t(''),
                        value: stats.disk_cache_info.path,
                      },
                      {
                        key: t(''),
                        value: stats.disk_cache_info.file_count,
                      },
                      {
                        key: t(''),
                        value: formatBytes(stats.disk_cache_info.total_size),
                      },
                    ]}
                  />
                </Col>
              </Row>
            </>
          )}
        </Form.Section>
      </Spin>
    </>
  );
}

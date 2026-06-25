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

import React, { useCallback, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  Modal,
  Radio,
  RadioGroup,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconDelete,
  IconPlus,
  IconSave,
  IconSearch,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import {
  PAGE_SIZE,
  PRICE_SUFFIX,
  buildSummaryText,
  hasValue,
  useModelPricingEditorState,
} from '../hooks/useModelPricingEditorState';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import TieredPricingEditor from './TieredPricingEditor';

const { Text } = Typography;
const EMPTY_CANDIDATE_MODEL_NAMES = [];

const PriceInput = ({
  label,
  value,
  placeholder,
  onChange,
  suffix = PRICE_SUFFIX,
  disabled = false,
  extraText = '',
  headerAction = null,
  hidden = false,
}) => (
  <div style={{ marginBottom: 16 }}>
    <div className='mb-1 font-medium text-gray-700 flex items-center justify-between gap-3'>
      <span>{label}</span>
      {headerAction}
    </div>
    {!hidden ? (
      <Input
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        suffix={suffix}
        disabled={disabled}
      />
    ) : null}
    {extraText ? (
      <div className='mt-1 text-xs text-gray-500'>{extraText}</div>
    ) : null}
  </div>
);

export default function ModelPricingEditor({
  options,
  refresh,
  candidateModelNames = EMPTY_CANDIDATE_MODEL_NAMES,
  filterMode = 'all',
  allowAddModel = true,
  allowDeleteModel = true,
  showConflictFilter = true,
  listDescription = '',
  emptyTitle = '',
  emptyDescription = '',
}) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [addVisible, setAddVisible] = useState(false);
  const [batchVisible, setBatchVisible] = useState(false);
  const [newModelName, setNewModelName] = useState('');

  const {
    selectedModel,
    selectedModelName,
    selectedModelNames,
    setSelectedModelName,
    setSelectedModelNames,
    searchText,
    setSearchText,
    currentPage,
    setCurrentPage,
    loading,
    conflictOnly,
    setConflictOnly,
    filteredModels,
    pagedData,
    selectedWarnings,
    previewRows,
    isOptionalFieldEnabled,
    handleOptionalFieldToggle,
    handleNumericFieldChange,
    handleBillingModeChange,
    handleBillingExprChange,
    handleRequestRuleExprChange,
    handleSubmit,
    addModel,
    deleteModel,
    applySelectedModelPricing,
  } = useModelPricingEditorState({
    options,
    refresh,
    t,
    candidateModelNames,
    filterMode,
  });

  const getExprModeLabel = useCallback((model) => {
    if (model?.billingMode !== 'tiered_expr') {
      return '';
    }
    return (model.billingExpr || '').includes('tier(')
      ? t('')
      : t('');
  }, [t]);

  const columns = useMemo(
    () => [
      {
        title: t(''),
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
          <Space>
            <Button
              theme='borderless'
              type='tertiary'
              onClick={() => setSelectedModelName(record.name)}
              style={{
                padding: 0,
                color:
                  record.name === selectedModelName
                    ? 'var(--semi-color-primary)'
                    : undefined,
              }}
            >
              {text}
            </Button>
            {selectedModelNames.includes(record.name) ? (
              <Tag color='green' shape='circle'>
                {t('')}
              </Tag>
            ) : null}
            {record.hasConflict ? (
              <Tag color='red' shape='circle'>
                {t('')}
              </Tag>
            ) : null}
          </Space>
        ),
      },
      {
        title: t(''),
        dataIndex: 'billingMode',
        key: 'billingMode',
        render: (_, record) => (
          <Tag
            color={
              record.billingMode === 'per-request'
                ? 'teal'
                : record.billingMode === 'tiered_expr'
                  ? 'amber'
                  : 'violet'
            }
          >
            {record.billingMode === 'per-request'
              ? t('')
              : record.billingMode === 'tiered_expr'
                ? getExprModeLabel(record)
                : t('')}
          </Tag>
        ),
      },
      {
        title: t(''),
        dataIndex: 'summary',
        key: 'summary',
        render: (_, record) => buildSummaryText(record, t),
      },
      {
        title: t(''),
        key: 'action',
        render: (_, record) => (
          <Space>
            {allowDeleteModel ? (
              <Button
                size='small'
                type='danger'
                icon={<IconDelete />}
                onClick={() => deleteModel(record.name)}
              />
            ) : null}
          </Space>
        ),
      },
    ],
    [
      allowDeleteModel,
      deleteModel,
      getExprModeLabel,
      selectedModelName,
      selectedModelNames,
      setSelectedModelName,
      t,
    ],
  );

  const handleAddModel = () => {
    if (addModel(newModelName)) {
      setNewModelName('');
      setAddVisible(false);
    }
  };

  const rowSelection = {
    selectedRowKeys: selectedModelNames,
    onChange: (selectedRowKeys) => setSelectedModelNames(selectedRowKeys),
  };

  return (
    <>
      <Space vertical align='start' style={{ width: '100%' }}>
        <Space wrap className='mt-2'>
          {allowAddModel ? (
            <Button
              icon={<IconPlus />}
              onClick={() => setAddVisible(true)}
              style={isMobile ? { width: '100%' } : undefined}
            >
              {t('')}
            </Button>
          ) : null}
          <Button
            type='primary'
            icon={<IconSave />}
            loading={loading}
            onClick={handleSubmit}
            style={isMobile ? { width: '100%' } : undefined}
          >
            {t('')}
          </Button>
          <Button
            disabled={!selectedModel || selectedModelNames.length === 0}
            onClick={() => setBatchVisible(true)}
            style={isMobile ? { width: '100%' } : undefined}
          >
            {t('')}
            {selectedModelNames.length > 0 ? ` (${selectedModelNames.length})` : ''}
          </Button>
          <Input
            prefix={<IconSearch />}
            placeholder={t('')}
            value={searchText}
            onChange={(value) => setSearchText(value)}
            style={{ width: isMobile ? '100%' : 220 }}
            showClear
          />
          {showConflictFilter ? (
            <Checkbox
              checked={conflictOnly}
              onChange={(event) => setConflictOnly(event.target.checked)}
            >
              {t('')}
            </Checkbox>
          ) : null}
        </Space>

        {listDescription ? (
          <div className='text-sm text-gray-500'>{listDescription}</div>
        ) : null}
        {selectedModelNames.length > 0 ? (
          <div
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              background: 'var(--semi-color-primary-light-default)',
              border: '1px solid var(--semi-color-primary)',
              color: 'var(--semi-color-primary)',
              fontWeight: 600,
            }}
          >
            {t(' {{count}} ', { count: selectedModelNames.length })}
          </div>
        ) : null}

        <div
          style={{
            width: '100%',
            display: 'grid',
            gap: 16,
            gridTemplateColumns: isMobile
              ? 'minmax(0, 1fr)'
              : 'minmax(300px, 0.8fr) minmax(480px, 1.2fr)',
          }}
        >
          <Card
            bodyStyle={{ padding: 0 }}
            style={isMobile ? { order: 2 } : undefined}
          >
            <div style={{ overflowX: 'auto' }}>
              <Table
                columns={columns}
                dataSource={pagedData}
                rowKey='name'
                rowSelection={rowSelection}
                pagination={{
                  currentPage,
                  pageSize: PAGE_SIZE,
                  total: filteredModels.length,
                  onPageChange: (page) => setCurrentPage(page),
                  showTotal: true,
                  showSizeChanger: false,
                }}
                empty={
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    {emptyTitle || t('')}
                  </div>
                }
                onRow={(record) => ({
                  style: {
                    background: selectedModelNames.includes(record.name)
                      ? 'var(--semi-color-success-light-default)'
                      : record.name === selectedModelName
                        ? 'var(--semi-color-primary-light-default)'
                        : undefined,
                    boxShadow: selectedModelNames.includes(record.name)
                      ? 'inset 4px 0 0 var(--semi-color-success)'
                      : record.name === selectedModelName
                        ? 'inset 4px 0 0 var(--semi-color-primary)'
                        : undefined,
                    transition: 'background 0.2s ease, box-shadow 0.2s ease',
                  },
                  onClick: () => setSelectedModelName(record.name),
                })}
                scroll={isMobile ? { x: 720 } : undefined}
              />
            </div>
          </Card>

          <Card
            style={isMobile ? { order: 1 } : undefined}
            title={selectedModel ? selectedModel.name : t('')}
            headerExtraContent={
              selectedModel ? (
                <Tag
                  color={
                    selectedModel.billingMode === 'per-request'
                      ? 'teal'
                      : selectedModel.billingMode === 'tiered_expr'
                        ? 'amber'
                        : 'blue'
                  }
                >
                  {selectedModel.billingMode === 'per-request'
                    ? t('')
                    : selectedModel.billingMode === 'tiered_expr'
                      ? getExprModeLabel(selectedModel)
                      : t('')}
                </Tag>
              ) : null
            }
          >
            {!selectedModel ? (
              <Empty
                title={emptyTitle || t('')}
                description={
                  emptyDescription || t('')
                }
              />
            ) : (
              <div>
                <div className='mb-4'>
                  <div className='mb-2 font-medium text-gray-700'>
                    {t('')}
                  </div>
                  <RadioGroup
                    type='button'
                    value={selectedModel.billingMode}
                    onChange={(event) => handleBillingModeChange(event.target.value)}
                  >
                    <Radio value='per-token'>{t('')}</Radio>
                    <Radio value='per-request'>{t('')}</Radio>
                    <Radio value='tiered_expr'>{t('/')}</Radio>
                  </RadioGroup>
                  <div className='mt-2 text-xs text-gray-500'>
                    {t(
                      '//',
                    )}
                  </div>
                </div>

                {selectedWarnings.length > 0 ? (
                  <Card
                    bodyStyle={{ padding: 12 }}
                    style={{
                      marginBottom: 16,
                      background: 'var(--semi-color-warning-light-default)',
                    }}
                  >
                    <div className='font-medium mb-2'>{t('')}</div>
                    {selectedWarnings.map((warning) => (
                      <div key={warning} className='text-sm text-gray-700 mb-1'>
                        {warning}
                      </div>
                    ))}
                  </Card>
                ) : null}

                {selectedModel.billingMode === 'per-request' ? (
                  <PriceInput
                    label={t('')}
                    value={selectedModel.fixedPrice}
                    placeholder={t('')}
                    suffix={t('$/')}
                    onChange={(value) => handleNumericFieldChange('fixedPrice', value)}
                    extraText={t(' MJ / ')}
                  />
                ) : selectedModel.billingMode === 'tiered_expr' ? (
                  <TieredPricingEditor
                    model={selectedModel}
                    onExprChange={handleBillingExprChange}
                    requestRuleExpr={selectedModel.requestRuleExpr}
                    onRequestRuleExprChange={handleRequestRuleExprChange}
                    t={t}
                  />
                ) : (
                  <>
                    <Card
                      bodyStyle={{ padding: 16 }}
                      style={{
                        marginBottom: 16,
                        background: 'var(--semi-color-fill-0)',
                      }}
                    >
                      <div className='font-medium mb-3'>{t('')}</div>
                      <PriceInput
                        label={t('')}
                        value={selectedModel.inputPrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) => handleNumericFieldChange('inputPrice', value)}
                      />
                      {selectedModel.completionRatioLocked ? (
                        <Banner
                          type='warning'
                          bordered
                          fullMode={false}
                          closeIcon={null}
                          style={{ marginBottom: 12 }}
                          title={t('')}
                          description={t(
                            ' {{ratio}}',
                            {
                              ratio: selectedModel.lockedCompletionRatio || '-',
                            },
                          )}
                        />
                      ) : null}
                      <PriceInput
                        label={t('')}
                        value={selectedModel.completionPrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) =>
                          handleNumericFieldChange('completionPrice', value)
                        }
                        headerAction={
                          <Switch
                            size='small'
                            checked={isOptionalFieldEnabled(
                              selectedModel,
                              'completionPrice',
                            )}
                            disabled={selectedModel.completionRatioLocked}
                            onChange={(checked) =>
                              handleOptionalFieldToggle('completionPrice', checked)
                            }
                          />
                        }
                        hidden={
                          !isOptionalFieldEnabled(selectedModel, 'completionPrice')
                        }
                        disabled={
                          !hasValue(selectedModel.inputPrice) ||
                          selectedModel.completionRatioLocked
                        }
                        extraText={
                          selectedModel.completionRatioLocked
                            ? t(
                                '{{ratio}}',
                                {
                                  ratio: selectedModel.lockedCompletionRatio || '-',
                                },
                              )
                            : !isOptionalFieldEnabled(
                                  selectedModel,
                                  'completionPrice',
                                )
                              ? t('')
                              : ''
                        }
                      />
                      <PriceInput
                        label={t('')}
                        value={selectedModel.cachePrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) => handleNumericFieldChange('cachePrice', value)}
                        headerAction={
                          <Switch
                            size='small'
                            checked={isOptionalFieldEnabled(selectedModel, 'cachePrice')}
                            onChange={(checked) =>
                              handleOptionalFieldToggle('cachePrice', checked)
                            }
                          />
                        }
                        hidden={!isOptionalFieldEnabled(selectedModel, 'cachePrice')}
                        disabled={!hasValue(selectedModel.inputPrice)}
                        extraText={
                          !isOptionalFieldEnabled(selectedModel, 'cachePrice')
                            ? t('')
                            : ''
                        }
                      />
                      <PriceInput
                        label={t('')}
                        value={selectedModel.createCachePrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) =>
                          handleNumericFieldChange('createCachePrice', value)
                        }
                        headerAction={
                          <Switch
                            size='small'
                            checked={isOptionalFieldEnabled(
                              selectedModel,
                              'createCachePrice',
                            )}
                            onChange={(checked) =>
                              handleOptionalFieldToggle('createCachePrice', checked)
                            }
                          />
                        }
                        hidden={
                          !isOptionalFieldEnabled(selectedModel, 'createCachePrice')
                        }
                        disabled={!hasValue(selectedModel.inputPrice)}
                        extraText={
                          !isOptionalFieldEnabled(
                            selectedModel,
                            'createCachePrice',
                          )
                            ? t('')
                            : ''
                        }
                      />
                    </Card>

                    <Card
                      bodyStyle={{ padding: 16 }}
                      style={{
                        marginBottom: 16,
                        background: 'var(--semi-color-fill-0)',
                      }}
                    >
                      <div className='mb-3'>
                        <div className='font-medium'>{t('')}</div>
                        <div className='text-xs text-gray-500 mt-1'>
                          {t('')}
                        </div>
                      </div>
                      <PriceInput
                        label={t('')}
                        value={selectedModel.imagePrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) => handleNumericFieldChange('imagePrice', value)}
                        headerAction={
                          <Switch
                            size='small'
                            checked={isOptionalFieldEnabled(selectedModel, 'imagePrice')}
                            onChange={(checked) =>
                              handleOptionalFieldToggle('imagePrice', checked)
                            }
                          />
                        }
                        hidden={!isOptionalFieldEnabled(selectedModel, 'imagePrice')}
                        disabled={!hasValue(selectedModel.inputPrice)}
                        extraText={
                          !isOptionalFieldEnabled(selectedModel, 'imagePrice')
                            ? t('')
                            : ''
                        }
                      />
                      <PriceInput
                        label={t('')}
                        value={selectedModel.audioInputPrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) =>
                          handleNumericFieldChange('audioInputPrice', value)
                        }
                        headerAction={
                          <Switch
                            size='small'
                            checked={isOptionalFieldEnabled(
                              selectedModel,
                              'audioInputPrice',
                            )}
                            onChange={(checked) =>
                              handleOptionalFieldToggle('audioInputPrice', checked)
                            }
                          />
                        }
                        hidden={!isOptionalFieldEnabled(selectedModel, 'audioInputPrice')}
                        disabled={!hasValue(selectedModel.inputPrice)}
                        extraText={
                          !isOptionalFieldEnabled(
                            selectedModel,
                            'audioInputPrice',
                          )
                            ? t('')
                            : ''
                        }
                      />
                      <PriceInput
                        label={t('')}
                        value={selectedModel.audioOutputPrice}
                        placeholder={t(' $/1M tokens')}
                        onChange={(value) =>
                          handleNumericFieldChange('audioOutputPrice', value)
                        }
                        headerAction={
                          <Switch
                            size='small'
                            checked={isOptionalFieldEnabled(
                              selectedModel,
                              'audioOutputPrice',
                            )}
                            disabled={!isOptionalFieldEnabled(
                              selectedModel,
                              'audioInputPrice',
                            )}
                            onChange={(checked) =>
                              handleOptionalFieldToggle('audioOutputPrice', checked)
                            }
                          />
                        }
                        hidden={
                          !isOptionalFieldEnabled(selectedModel, 'audioOutputPrice')
                        }
                        disabled={!hasValue(selectedModel.audioInputPrice)}
                        extraText={
                          !isOptionalFieldEnabled(
                            selectedModel,
                            'audioInputPrice',
                          )
                            ? t('')
                            : !isOptionalFieldEnabled(
                                  selectedModel,
                                  'audioOutputPrice',
                                )
                              ? t('')
                              : ''
                        }
                      />
                    </Card>
                  </>
                )}

                <Card
                  bodyStyle={{ padding: 16 }}
                  style={{ background: 'var(--semi-color-fill-0)' }}
                >
                  <div className='font-medium mb-3'>{t('')}</div>
                  <div className='text-xs text-gray-500 mb-3'>
                    {t(
                      ' JSON ',
                    )}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(140px, 180px) 1fr',
                      gap: 8,
                    }}
                  >
                    {previewRows.map((row) => (
                      <React.Fragment key={row.key}>
                        <Text strong>{row.label}</Text>
                        <Text>{row.value}</Text>
                      </React.Fragment>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </Card>
        </div>
      </Space>

      {allowAddModel ? (
        <Modal
          title={t('')}
          visible={addVisible}
          onCancel={() => {
            setAddVisible(false);
            setNewModelName('');
          }}
          onOk={handleAddModel}
        >
          <Input
            value={newModelName}
            placeholder={t(' gpt-4.1')}
            onChange={(value) => setNewModelName(value)}
          />
        </Modal>
      ) : null}

      <Modal
        title={t('')}
        visible={batchVisible}
        onCancel={() => setBatchVisible(false)}
        onOk={() => {
          if (applySelectedModelPricing()) {
            setBatchVisible(false);
          }
        }}
      >
        <div className='text-sm text-gray-600'>
          {selectedModel
            ? t(
                ' {{name}}  {{count}} ',
                {
                  name: selectedModel.name,
                  count: selectedModelNames.length,
                },
              )
            : t('')}
        </div>
        {selectedModel ? (
          <div className='text-xs text-gray-500 mt-3'>
            {t(
              ' gpt-5.1  gpt-5.1-highgpt-5.1-low ',
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}

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

import React, { useState, useEffect, useMemo } from 'react';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';
import {
  Modal,
  Checkbox,
  Spin,
  Input,
  Typography,
  Empty,
  Tabs,
  Collapse,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { IconSearch, IconInfoCircle } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { getModelCategories } from '../../../../helpers/render';

const ModelSelectModal = ({
  visible,
  models = [],
  selected = [],
  redirectModels = [],
  redirectSourceModels = [],
  onConfirm,
  onCancel,
}) => {
  const { t } = useTranslation();

  const getModelName = (model) => {
    if (!model) return '';
    if (typeof model === 'string') return model;
    if (typeof model === 'object' && model.model_name) return model.model_name;
    return String(model ?? '');
  };
  const normalizeModelList = (modelList = []) =>
    Array.from(
      new Set(
        (modelList || [])
          .map((model) => getModelName(model).trim())
          .filter(Boolean),
      ),
    );

  const normalizedSelected = useMemo(
    () => (selected || []).map(getModelName),
    [selected],
  );

  const [checkedList, setCheckedList] = useState(normalizedSelected);
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState('new');

  const isMobile = useIsMobile();
  const normalizeModelName = (model) =>
    typeof model === 'string' ? model.trim() : '';
  const normalizedRedirectModels = useMemo(
    () =>
      Array.from(
        new Set(
          (redirectModels || [])
            .map((model) => normalizeModelName(model))
            .filter(Boolean),
        ),
      ),
    [redirectModels],
  );
  const normalizedRedirectSourceSet = useMemo(
    () => new Set(normalizeModelList(redirectSourceModels)),
    [redirectSourceModels],
  );
  const normalizedSelectedSet = useMemo(() => {
    const set = new Set();
    (selected || []).forEach((model) => {
      const normalized = normalizeModelName(model);
      if (normalized) {
        set.add(normalized);
      }
    });
    return set;
  }, [selected]);
  const classificationSet = useMemo(() => {
    const set = new Set(normalizedSelectedSet);
    normalizedRedirectModels.forEach((model) => set.add(model));
    return set;
  }, [normalizedSelectedSet, normalizedRedirectModels]);
  const redirectOnlySet = useMemo(() => {
    const set = new Set();
    normalizedRedirectModels.forEach((model) => {
      if (!normalizedSelectedSet.has(model)) {
        set.add(model);
      }
    });
    return set;
  }, [normalizedRedirectModels, normalizedSelectedSet]);

  const filteredModels = models.filter((m) =>
    String(m || '')
      .toLowerCase()
      .includes(keyword.toLowerCase()),
  );

  // 
  const isExistingModel = (model) =>
    classificationSet.has(normalizeModelName(model));
  const newModels = filteredModels.filter((model) => !isExistingModel(model));
  const existingModels = filteredModels.filter((model) =>
    isExistingModel(model),
  );
  const fetchedModelSet = useMemo(
    () => new Set(normalizeModelList(models)),
    [models],
  );
  const removedModels = normalizeModelList(selected).filter(
    (model) =>
      !fetchedModelSet.has(model) &&
      !normalizedRedirectSourceSet.has(model) &&
      model.toLowerCase().includes(keyword.toLowerCase()),
  );

  // 
  useEffect(() => {
    if (visible) {
      setCheckedList(normalizedSelected);
    }
  }, [visible, normalizedSelected]);

  // tab
  useEffect(() => {
    if (visible) {
      if (newModels.length > 0) {
        setActiveTab('new');
      } else if (removedModels.length > 0) {
        setActiveTab('removed');
      } else {
        setActiveTab('existing');
      }
    }
  }, [visible, newModels.length, removedModels.length, selected]);

  const handleOk = () => {
    onConfirm && onConfirm(checkedList);
  };

  // 
  const categorizeModels = (models) => {
    const categories = getModelCategories(t);
    const categorizedModels = {};
    const uncategorizedModels = [];

    models.forEach((model) => {
      let foundCategory = false;
      for (const [key, category] of Object.entries(categories)) {
        if (key !== 'all' && category.filter({ model_name: model })) {
          if (!categorizedModels[key]) {
            categorizedModels[key] = {
              label: category.label,
              icon: category.icon,
              models: [],
            };
          }
          categorizedModels[key].models.push(model);
          foundCategory = true;
          break;
        }
      }
      if (!foundCategory) {
        uncategorizedModels.push(model);
      }
    });

    // ""
    if (uncategorizedModels.length > 0) {
      categorizedModels['other'] = {
        label: t(''),
        icon: null,
        models: uncategorizedModels,
      };
    }

    return categorizedModels;
  };

  const newModelsByCategory = categorizeModels(newModels);
  const existingModelsByCategory = categorizeModels(existingModels);

  // Tab
  const tabList = [
    ...(newModels.length > 0
      ? [
          {
            tab: `${t('')} (${newModels.length})`,
            itemKey: 'new',
          },
        ]
      : []),
    ...(existingModels.length > 0
      ? [
          {
            tab: `${t('')} (${existingModels.length})`,
            itemKey: 'existing',
          },
        ]
      : []),
    ...(removedModels.length > 0
      ? [
          {
            tab: `${t('')} (${removedModels.length})`,
            itemKey: 'removed',
          },
        ]
      : []),
  ];

  // /
  const handleCategorySelectAll = (categoryModels, isChecked) => {
    let newCheckedList = [...checkedList];

    if (isChecked) {
      // 
      categoryModels.forEach((model) => {
        if (!newCheckedList.includes(model)) {
          newCheckedList.push(model);
        }
      });
    } else {
      // 
      newCheckedList = newCheckedList.filter(
        (model) => !categoryModels.includes(model),
      );
    }

    setCheckedList(newCheckedList);
  };

  // 
  const isCategoryAllSelected = (categoryModels) => {
    return (
      categoryModels.length > 0 &&
      categoryModels.every((model) => checkedList.includes(model))
    );
  };

  // 
  const isCategoryIndeterminate = (categoryModels) => {
    const selectedCount = categoryModels.filter((model) =>
      checkedList.includes(model),
    ).length;
    return selectedCount > 0 && selectedCount < categoryModels.length;
  };

  const renderModelsByCategory = (modelsByCategory, categoryKeyPrefix) => {
    const categoryEntries = Object.entries(modelsByCategory);
    if (categoryEntries.length === 0) return null;

    // key
    const allActiveKeys = categoryEntries.map(
      (_, index) => `${categoryKeyPrefix}_${index}`,
    );

    return (
      <Collapse
        key={`${categoryKeyPrefix}_${categoryEntries.length}`}
        defaultActiveKey={[]}
      >
        {categoryEntries.map(([key, categoryData], index) => (
          <Collapse.Panel
            key={`${categoryKeyPrefix}_${index}`}
            itemKey={`${categoryKeyPrefix}_${index}`}
            header={`${categoryData.label} (${categoryData.models.length})`}
            extra={
              <Checkbox
                checked={isCategoryAllSelected(categoryData.models)}
                indeterminate={isCategoryIndeterminate(categoryData.models)}
                onChange={(e) => {
                  e.stopPropagation(); // 
                  handleCategorySelectAll(
                    categoryData.models,
                    e.target.checked,
                  );
                }}
                onClick={(e) => e.stopPropagation()} // checkbox
              />
            }
          >
            <div className='flex items-center gap-2 mb-3'>
              {categoryData.icon}
              <Typography.Text type='secondary' size='small'>
                {t(' {{selected}} / {{total}}', {
                  selected: categoryData.models.filter((model) =>
                    checkedList.includes(model),
                  ).length,
                  total: categoryData.models.length,
                })}
              </Typography.Text>
            </div>
            <div className='grid grid-cols-2 gap-x-4'>
              {categoryData.models.map((model) => (
                <Checkbox key={model} value={model} className='my-1'>
                  <span className='flex items-center gap-2'>
                    <span>{model}</span>
                    {redirectOnlySet.has(normalizeModelName(model)) && (
                      <Tooltip
                        position='top'
                        content={t('')}
                      >
                        <IconInfoCircle
                          size='small'
                          className='text-amber-500 cursor-help'
                        />
                      </Tooltip>
                    )}
                  </span>
                </Checkbox>
              ))}
            </div>
          </Collapse.Panel>
        ))}
      </Collapse>
    );
  };

  return (
    <Modal
      header={
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-4'>
          <Typography.Title heading={5} className='m-0'>
            {t('')}
          </Typography.Title>
          <div className='flex-shrink-0'>
            <Tabs
              type='slash'
              size='small'
              tabList={tabList}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
            />
          </div>
        </div>
      }
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={t('')}
      cancelText={t('')}
      size={isMobile ? 'full-width' : 'large'}
      closeOnEsc
      maskClosable
      centered
    >
      <Input
        prefix={<IconSearch size={14} />}
        placeholder={t('')}
        value={keyword}
        onChange={(v) => setKeyword(v)}
        showClear
      />

      <Spin
        spinning={!models || (models.length === 0 && removedModels.length === 0)}
      >
        <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 8 }}>
          {filteredModels.length === 0 && removedModels.length === 0 ? (
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
          ) : (
            <Checkbox.Group
              value={checkedList}
              onChange={(vals) => setCheckedList(vals)}
            >
              {activeTab === 'new' && newModels.length > 0 && (
                <div>{renderModelsByCategory(newModelsByCategory, 'new')}</div>
              )}
              {activeTab === 'existing' && existingModels.length > 0 && (
                <div>
                  {renderModelsByCategory(existingModelsByCategory, 'existing')}
                </div>
              )}
              {activeTab === 'removed' && removedModels.length > 0 && (
                <div>
                  {renderModelsByCategory(
                    categorizeModels(removedModels),
                    'removed',
                  )}
                </div>
              )}
            </Checkbox.Group>
          )}
        </div>
      </Spin>

      <Typography.Text
        type='secondary'
        size='small'
        className='block text-right mt-4'
      >
        <div className='flex items-center justify-end gap-2'>
          {(() => {
            const currentModels =
              activeTab === 'new'
                ? newModels
                : activeTab === 'removed'
                  ? removedModels
                  : existingModels;
            const currentSelected = currentModels.filter((model) =>
              checkedList.includes(model),
            ).length;
            const isAllSelected =
              currentModels.length > 0 &&
              currentSelected === currentModels.length;
            const isIndeterminate =
              currentSelected > 0 && currentSelected < currentModels.length;

            return (
              <>
                <span>
                  {t(' {{selected}} / {{total}}', {
                    selected: currentSelected,
                    total: currentModels.length,
                  })}
                </span>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isIndeterminate}
                  onChange={(e) => {
                    handleCategorySelectAll(currentModels, e.target.checked);
                  }}
                />
              </>
            );
          })()}
        </div>
      </Typography.Text>
    </Modal>
  );
};

export default ModelSelectModal;

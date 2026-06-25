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

import React from 'react';
import {
  Button,
  Dropdown,
  Modal,
  Switch,
  Typography,
  Select,
} from '@douyinfe/semi-ui';
import CompactModeToggle from '../../common/ui/CompactModeToggle';

const ChannelsActions = ({
  enableBatchDelete,
  batchDeleteChannels,
  setShowBatchSetTag,
  testAllChannels,
  fixChannelsAbilities,
  updateAllChannelsBalance,
  deleteAllDisabledChannels,
  applyAllUpstreamUpdates,
  detectAllUpstreamUpdates,
  detectAllUpstreamUpdatesLoading,
  applyAllUpstreamUpdatesLoading,
  compactMode,
  setCompactMode,
  idSort,
  setIdSort,
  setEnableBatchDelete,
  enableTagMode,
  setEnableTagMode,
  statusFilter,
  setStatusFilter,
  getFormValues,
  loadChannels,
  searchChannels,
  activeTypeKey,
  activePage,
  pageSize,
  setActivePage,
  t,
}) => {
  return (
    <div className='flex flex-col gap-2'>
      {/*  +  */}
      <div className='flex flex-col md:flex-row justify-between gap-2'>
        {/*  */}
        <div className='flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto order-2 md:order-1'>
          <Button
            size='small'
            disabled={!enableBatchDelete}
            type='danger'
            className='w-full md:w-auto'
            onClick={() => {
              Modal.confirm({
                title: t(''),
                content: t(''),
                onOk: () => batchDeleteChannels(),
              });
            }}
          >
            {t('')}
          </Button>

          <Button
            size='small'
            disabled={!enableBatchDelete}
            type='tertiary'
            onClick={() => setShowBatchSetTag(true)}
            className='w-full md:w-auto'
          >
            {t('')}
          </Button>

          <Dropdown
            size='small'
            trigger='click'
            render={
              <Dropdown.Menu>
                <Dropdown.Item>
                  <Button
                    size='small'
                    type='tertiary'
                    className='w-full'
                    loading={detectAllUpstreamUpdatesLoading}
                    disabled={detectAllUpstreamUpdatesLoading}
                    onClick={() => {
                      Modal.confirm({
                        title: t(''),
                        content: t(''),
                        onOk: () => testAllChannels(),
                        size: 'small',
                        centered: true,
                      });
                    }}
                  >
                    {t('')}
                  </Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Button
                    size='small'
                    className='w-full'
                    onClick={() => {
                      Modal.confirm({
                        title: t(''),
                        content: t(
                          '',
                        ),
                        onOk: () => fixChannelsAbilities(),
                        size: 'sm',
                        centered: true,
                      });
                    }}
                  >
                    {t('')}
                  </Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Button
                    size='small'
                    type='secondary'
                    className='w-full'
                    onClick={() => {
                      Modal.confirm({
                        title: t(''),
                        content: t(''),
                        onOk: () => updateAllChannelsBalance(),
                        size: 'sm',
                        centered: true,
                      });
                    }}
                  >
                    {t('')}
                  </Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Button
                    size='small'
                    type='tertiary'
                    className='w-full'
                    onClick={() => {
                      Modal.confirm({
                        title: t(''),
                        content: t(
                          '/',
                        ),
                        onOk: () => detectAllUpstreamUpdates(),
                        size: 'sm',
                        centered: true,
                      });
                    }}
                  >
                    {t('')}
                  </Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Button
                    size='small'
                    type='primary'
                    className='w-full'
                    loading={applyAllUpstreamUpdatesLoading}
                    disabled={applyAllUpstreamUpdatesLoading}
                    onClick={() => {
                      Modal.confirm({
                        title: t(''),
                        content: t(''),
                        onOk: () => applyAllUpstreamUpdates(),
                        size: 'sm',
                        centered: true,
                      });
                    }}
                  >
                    {t('')}
                  </Button>
                </Dropdown.Item>
                <Dropdown.Item>
                  <Button
                    size='small'
                    type='danger'
                    className='w-full'
                    onClick={() => {
                      Modal.confirm({
                        title: t(''),
                        content: t(''),
                        onOk: () => deleteAllDisabledChannels(),
                        size: 'sm',
                        centered: true,
                      });
                    }}
                  >
                    {t('')}
                  </Button>
                </Dropdown.Item>
              </Dropdown.Menu>
            }
          >
            <Button
              size='small'
              theme='light'
              type='tertiary'
              className='w-full md:w-auto'
            >
              {t('')}
            </Button>
          </Dropdown>

          <CompactModeToggle
            compactMode={compactMode}
            setCompactMode={setCompactMode}
            t={t}
          />
        </div>

        {/*  */}
        <div className='flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto order-1 md:order-2'>
          <div className='flex items-center justify-between w-full md:w-auto'>
            <Typography.Text strong className='mr-2'>
              {t('ID')}
            </Typography.Text>
            <Switch
              size='small'
              checked={idSort}
              onChange={(v) => {
                localStorage.setItem('id-sort', v + '');
                setIdSort(v);
                const { searchKeyword, searchGroup, searchModel } =
                  getFormValues();
                if (
                  searchKeyword === '' &&
                  searchGroup === '' &&
                  searchModel === ''
                ) {
                  loadChannels(activePage, pageSize, v, enableTagMode);
                } else {
                  searchChannels(
                    enableTagMode,
                    activeTypeKey,
                    statusFilter,
                    activePage,
                    pageSize,
                    v,
                  );
                }
              }}
            />
          </div>

          <div className='flex items-center justify-between w-full md:w-auto'>
            <Typography.Text strong className='mr-2'>
              {t('')}
            </Typography.Text>
            <Switch
              size='small'
              checked={enableBatchDelete}
              onChange={(v) => {
                localStorage.setItem('enable-batch-delete', v + '');
                setEnableBatchDelete(v);
              }}
            />
          </div>

          <div className='flex items-center justify-between w-full md:w-auto'>
            <Typography.Text strong className='mr-2'>
              {t('')}
            </Typography.Text>
            <Switch
              size='small'
              checked={enableTagMode}
              onChange={(v) => {
                localStorage.setItem('enable-tag-mode', v + '');
                setEnableTagMode(v);
                setActivePage(1);
                loadChannels(1, pageSize, idSort, v);
              }}
            />
          </div>

          <div className='flex items-center justify-between w-full md:w-auto'>
            <Typography.Text strong className='mr-2'>
              {t('')}
            </Typography.Text>
            <Select
              size='small'
              value={statusFilter}
              onChange={(v) => {
                localStorage.setItem('channel-status-filter', v);
                setStatusFilter(v);
                setActivePage(1);
                loadChannels(
                  1,
                  pageSize,
                  idSort,
                  enableTagMode,
                  activeTypeKey,
                  v,
                );
              }}
            >
              <Select.Option value='all'>{t('')}</Select.Option>
              <Select.Option value='enabled'>{t('')}</Select.Option>
              <Select.Option value='disabled'>{t('')}</Select.Option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChannelsActions;

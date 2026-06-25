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
import { Button, Form } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { DATE_RANGE_PRESETS } from '../../../constants/console.constants';

const LogsFilters = ({
  formInitValues,
  setFormApi,
  refresh,
  setShowColumnSelector,
  formApi,
  setLogType,
  loading,
  isAdminUser,
  t,
}) => {
  return (
    <Form
      initValues={formInitValues}
      getFormApi={(api) => setFormApi(api)}
      onSubmit={refresh}
      allowEmpty={true}
      autoComplete='off'
      layout='vertical'
      trigger='change'
      stopValidateWithError={false}
    >
      <div className='flex flex-col gap-2'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2'>
          {/*  */}
          <div className='col-span-1 lg:col-span-2'>
            <Form.DatePicker
              field='dateRange'
              className='w-full'
              type='dateTimeRange'
              placeholder={[t(''), t('')]}
              showClear
              pure
              size='small'
              presets={DATE_RANGE_PRESETS.map((preset) => ({
                text: t(preset.text),
                start: preset.start(),
                end: preset.end(),
              }))}
            />
          </div>

          {/*  */}
          <Form.Input
            field='token_name'
            prefix={<IconSearch />}
            placeholder={t('')}
            showClear
            pure
            size='small'
          />

          <Form.Input
            field='model_name'
            prefix={<IconSearch />}
            placeholder={t('')}
            showClear
            pure
            size='small'
          />

          <Form.Input
            field='group'
            prefix={<IconSearch />}
            placeholder={t('')}
            showClear
            pure
            size='small'
          />

          <Form.Input
            field='request_id'
            prefix={<IconSearch />}
            placeholder={t('Request ID')}
            showClear
            pure
            size='small'
          />

          {isAdminUser && (
            <>
              <Form.Input
                field='channel'
                prefix={<IconSearch />}
                placeholder={t(' ID')}
                showClear
                pure
                size='small'
              />
              <Form.Input
                field='username'
                prefix={<IconSearch />}
                placeholder={t('')}
                showClear
                pure
                size='small'
              />
            </>
          )}
        </div>

        {/*  */}
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
          {/*  */}
          <div className='w-full sm:w-auto'>
            <Form.Select
              field='logType'
              placeholder={t('')}
              className='w-full sm:w-auto min-w-[120px]'
              showClear
              pure
              onChange={() => {
                // 
                setTimeout(() => {
                  refresh();
                }, 0);
              }}
              size='small'
            >
              <Form.Select.Option value='0'>{t('')}</Form.Select.Option>
              <Form.Select.Option value='1'>{t('')}</Form.Select.Option>
              <Form.Select.Option value='2'>{t('')}</Form.Select.Option>
              <Form.Select.Option value='3'>{t('')}</Form.Select.Option>
              <Form.Select.Option value='4'>{t('')}</Form.Select.Option>
              <Form.Select.Option value='5'>{t('')}</Form.Select.Option>
              <Form.Select.Option value='6'>{t('')}</Form.Select.Option>
            </Form.Select>
          </div>

          <div className='flex gap-2 w-full sm:w-auto justify-end'>
            <Button
              type='tertiary'
              htmlType='submit'
              loading={loading}
              size='small'
            >
              {t('')}
            </Button>
            <Button
              type='tertiary'
              onClick={() => {
                if (formApi) {
                  formApi.reset();
                  setLogType(0);
                  setTimeout(() => {
                    refresh();
                  }, 100);
                }
              }}
              size='small'
            >
              {t('')}
            </Button>
            <Button
              type='tertiary'
              onClick={() => setShowColumnSelector(true)}
              size='small'
            >
              {t('')}
            </Button>
          </div>
        </div>
      </div>
    </Form>
  );
};

export default LogsFilters;

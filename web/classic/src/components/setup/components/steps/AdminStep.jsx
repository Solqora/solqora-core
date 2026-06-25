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
import { Banner, Form } from '@douyinfe/semi-ui';
import { IconUser, IconLock } from '@douyinfe/semi-icons';

/**
 * 
 * 
 */
const AdminStep = ({
  setupStatus,
  formData,
  setFormData,
  formRef,
  renderNavigationButtons,
  t,
}) => {
  return (
    <>
      {setupStatus.root_init ? (
        <Banner
          type='info'
          closeIcon={null}
          description={
            <div className='flex items-center'>
              <span>{t('')}</span>
            </div>
          }
          className='!rounded-lg'
        />
      ) : (
        <>
          <Form.Input
            field='username'
            label={t('')}
            placeholder={t('')}
            prefix={<IconUser />}
            showClear
            noLabel={false}
            validateStatus='default'
            rules={[{ required: true, message: t('') }]}
            initValue={formData.username || ''}
            onChange={(value) => {
              setFormData({ ...formData, username: value });
            }}
          />
          <Form.Input
            field='password'
            label={t('')}
            placeholder={t('')}
            type='password'
            prefix={<IconLock />}
            showClear
            noLabel={false}
            mode='password'
            validateStatus='default'
            rules={[
              { required: true, message: t('') },
              { min: 8, message: t('8') },
            ]}
            initValue={formData.password || ''}
            onChange={(value) => {
              setFormData({ ...formData, password: value });
            }}
          />
          <Form.Input
            field='confirmPassword'
            label={t('')}
            placeholder={t('')}
            type='password'
            prefix={<IconLock />}
            showClear
            noLabel={false}
            mode='password'
            validateStatus='default'
            rules={[
              { required: true, message: t('') },
              {
                validator: (rule, value) => {
                  if (value && formRef.current) {
                    const password = formRef.current.getValue('password');
                    if (value !== password) {
                      return Promise.reject(t(''));
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
            initValue={formData.confirmPassword || ''}
            onChange={(value) => {
              setFormData({ ...formData, confirmPassword: value });
            }}
          />
        </>
      )}
      {renderNavigationButtons && renderNavigationButtons()}
    </>
  );
};

export default AdminStep;

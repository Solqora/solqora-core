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
import { Avatar, Typography, Descriptions } from '@douyinfe/semi-ui';
import { CheckCircle } from 'lucide-react';

const { Text, Title } = Typography;

/**
 * 
 * 
 */
const CompleteStep = ({
  setupStatus,
  formData,
  renderNavigationButtons,
  t,
}) => {
  return (
    <div className='text-center'>
      <Avatar color='green' className='mx-auto mb-4 shadow-lg'>
        <CheckCircle size={24} />
      </Avatar>
      <Title heading={3} className='mb-2'>
        {t('')}
      </Title>
      <Text type='secondary' className='mb-6 block'>
        {t('""')}
      </Text>

      <Descriptions>
        <Descriptions.Item itemKey={t('')}>
          {setupStatus.database_type === 'sqlite'
            ? 'SQLite'
            : setupStatus.database_type === 'mysql'
              ? 'MySQL'
              : 'PostgreSQL'}
        </Descriptions.Item>
        <Descriptions.Item itemKey={t('')}>
          {setupStatus.root_init
            ? t('')
            : formData.username || t('')}
        </Descriptions.Item>
        <Descriptions.Item itemKey={t('')}>
          {formData.usageMode === 'external'
            ? t('')
            : formData.usageMode === 'self'
              ? t('')
              : t('')}
        </Descriptions.Item>
      </Descriptions>

      {renderNavigationButtons && renderNavigationButtons()}
    </div>
  );
};

export default CompleteStep;

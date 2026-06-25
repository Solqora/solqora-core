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

import React, { useEffect } from 'react';
import { Notification, Button, Space, Typography } from '@douyinfe/semi-ui';

//  ID
const NOTICE_ID = 'models-batch-actions';

/**
 * SelectionNotification 
 * 1.  selectedKeys.length > 0  id /
 * 2.  selectedKeys 
 */
const SelectionNotification = ({
  selectedKeys = [],
  t,
  onDelete,
  onAddPrefill,
  onClear,
  onCopy,
}) => {
  // /
  useEffect(() => {
    const selectedCount = selectedKeys.length;

    if (selectedCount > 0) {
      const titleNode = (
        <Space wrap>
          <span>{t('')}</span>
          <Typography.Text type='tertiary' size='small'>
            {t(' {{count}} ', { count: selectedCount })}
          </Typography.Text>
        </Space>
      );

      const content = (
        <Space wrap>
          <Button size='small' type='tertiary' theme='solid' onClick={onClear}>
            {t('')}
          </Button>
          <Button
            size='small'
            type='primary'
            theme='solid'
            onClick={onAddPrefill}
          >
            {t('')}
          </Button>
          <Button size='small' type='secondary' theme='solid' onClick={onCopy}>
            {t('')}
          </Button>
          <Button size='small' type='danger' theme='solid' onClick={onDelete}>
            {t('')}
          </Button>
        </Space>
      );

      //  id 
      Notification.info({
        id: NOTICE_ID,
        title: titleNode,
        content,
        duration: 0, // 
        position: 'bottom',
        showClose: false,
      });
    } else {
      // 
      Notification.close(NOTICE_ID);
    }
  }, [selectedKeys, t, onDelete, onAddPrefill, onClear, onCopy]);

  // 
  useEffect(() => {
    return () => {
      Notification.close(NOTICE_ID);
    };
  }, []);

  return null; // 
};

export default SelectionNotification;

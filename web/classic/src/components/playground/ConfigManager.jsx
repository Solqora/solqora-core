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

import React, { useRef } from 'react';
import { Button, Typography, Toast, Modal, Dropdown } from '@douyinfe/semi-ui';
import { Download, Upload, RotateCcw, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  exportConfig,
  importConfig,
  clearConfig,
  hasStoredConfig,
  getConfigTimestamp,
} from './configStorage';

const ConfigManager = ({
  currentConfig,
  onConfigImport,
  onConfigReset,
  styleState,
  messages,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      // 
      const configWithTimestamp = {
        ...currentConfig,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(
        'playground_config',
        JSON.stringify(configWithTimestamp),
      );

      exportConfig(currentConfig, messages);
      Toast.success({
        content: t(''),
        duration: 3,
      });
    } catch (error) {
      Toast.error({
        content: t(': ') + error.message,
        duration: 3,
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const importedConfig = await importConfig(file);

      Modal.confirm({
        title: t(''),
        content: t(''),
        okText: t(''),
        cancelText: t(''),
        onOk: () => {
          onConfigImport(importedConfig);
          Toast.success({
            content: t(''),
            duration: 3,
          });
        },
      });
    } catch (error) {
      Toast.error({
        content: t(': ') + error.message,
        duration: 3,
      });
    } finally {
      // 
      event.target.value = '';
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: t(''),
      content: t(
        '',
      ),
      okText: t(''),
      cancelText: t(''),
      okButtonProps: {
        type: 'danger',
      },
      onOk: () => {
        // 
        Modal.confirm({
          title: t(''),
          content: t(
            '""""',
          ),
          okText: t(''),
          cancelText: t(''),
          okButtonProps: {
            type: 'danger',
          },
          onOk: () => {
            clearConfig();
            onConfigReset({ resetMessages: true });
            Toast.success({
              content: t(''),
              duration: 3,
            });
          },
          onCancel: () => {
            clearConfig();
            onConfigReset({ resetMessages: false });
            Toast.success({
              content: t(''),
              duration: 3,
            });
          },
        });
      },
    });
  };

  const getConfigStatus = () => {
    if (hasStoredConfig()) {
      const timestamp = getConfigTimestamp();
      if (timestamp) {
        const date = new Date(timestamp);
        return t(': ') + date.toLocaleString();
      }
      return t('');
    }
    return t('');
  };

  const dropdownItems = [
    {
      node: 'item',
      name: 'export',
      onClick: handleExport,
      children: (
        <div className='flex items-center gap-2'>
          <Download size={14} />
          {t('')}
        </div>
      ),
    },
    {
      node: 'item',
      name: 'import',
      onClick: handleImportClick,
      children: (
        <div className='flex items-center gap-2'>
          <Upload size={14} />
          {t('')}
        </div>
      ),
    },
    {
      node: 'divider',
    },
    {
      node: 'item',
      name: 'reset',
      onClick: handleReset,
      children: (
        <div className='flex items-center gap-2 text-red-600'>
          <RotateCcw size={14} />
          {t('')}
        </div>
      ),
    },
  ];

  if (styleState.isMobile) {
    // 
    return (
      <>
        <Dropdown
          trigger='click'
          position='bottomLeft'
          showTick
          menu={dropdownItems}
        >
          <Button
            icon={<Settings2 size={14} />}
            theme='borderless'
            type='tertiary'
            size='small'
            className='!rounded-lg !text-gray-600 hover:!text-blue-600 hover:!bg-blue-50'
          />
        </Dropdown>

        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </>
    );
  }

  // 
  return (
    <div className='space-y-3'>
      {/*  */}
      <div className='flex items-center justify-between'>
        <Typography.Text className='text-xs text-gray-500'>
          {getConfigStatus()}
        </Typography.Text>
        <Button
          icon={<RotateCcw size={12} />}
          size='small'
          theme='borderless'
          type='danger'
          onClick={handleReset}
          className='!rounded-full !text-xs !px-2'
        />
      </div>

      {/*  */}
      <div className='flex gap-2'>
        <Button
          icon={<Download size={12} />}
          size='small'
          theme='solid'
          type='primary'
          onClick={handleExport}
          className='!rounded-lg flex-1 !text-xs !h-7'
        >
          {t('')}
        </Button>

        <Button
          icon={<Upload size={12} />}
          size='small'
          theme='outline'
          type='primary'
          onClick={handleImportClick}
          className='!rounded-lg flex-1 !text-xs !h-7'
        >
          {t('')}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='.json'
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ConfigManager;

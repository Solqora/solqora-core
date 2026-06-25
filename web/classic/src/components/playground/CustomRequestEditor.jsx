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

import React, { useState, useEffect } from 'react';
import {
  TextArea,
  Typography,
  Button,
  Switch,
  Banner,
} from '@douyinfe/semi-ui';
import { Code, Edit, Check, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CustomRequestEditor = ({
  customRequestMode,
  customRequestBody,
  onCustomRequestModeChange,
  onCustomRequestBodyChange,
  defaultPayload,
}) => {
  const { t } = useTranslation();
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [localValue, setLocalValue] = useState(customRequestBody || '');

  // payload
  useEffect(() => {
    if (
      customRequestMode &&
      (!customRequestBody || customRequestBody.trim() === '')
    ) {
      const defaultJson = defaultPayload
        ? JSON.stringify(defaultPayload, null, 2)
        : '';
      setLocalValue(defaultJson);
      onCustomRequestBodyChange(defaultJson);
    }
  }, [
    customRequestMode,
    defaultPayload,
    customRequestBody,
    onCustomRequestBodyChange,
  ]);

  // customRequestBody
  useEffect(() => {
    if (customRequestBody !== localValue) {
      setLocalValue(customRequestBody || '');
      validateJson(customRequestBody || '');
    }
  }, [customRequestBody]);

  // JSON
  const validateJson = (value) => {
    if (!value.trim()) {
      setIsValid(true);
      setErrorMessage('');
      return true;
    }

    try {
      JSON.parse(value);
      setIsValid(true);
      setErrorMessage('');
      return true;
    } catch (error) {
      setIsValid(false);
      setErrorMessage(`${t('JSON')}: ${error.message}`);
      return false;
    }
  };

  const handleValueChange = (value) => {
    setLocalValue(value);
    validateJson(value);
    // JSON
    onCustomRequestBodyChange(value);
  };

  const handleModeToggle = (enabled) => {
    onCustomRequestModeChange(enabled);
    if (enabled && defaultPayload) {
      const defaultJson = JSON.stringify(defaultPayload, null, 2);
      setLocalValue(defaultJson);
      onCustomRequestBodyChange(defaultJson);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(localValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalValue(formatted);
      onCustomRequestBodyChange(formatted);
      setIsValid(true);
      setErrorMessage('');
    } catch (error) {
      // 
    }
  };

  return (
    <div className='space-y-4'>
      {/*  */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Code size={16} className='text-gray-500' />
          <Typography.Text strong className='text-sm'>
            {t('')}
          </Typography.Text>
        </div>
        <Switch
          checked={customRequestMode}
          onChange={handleModeToggle}
          checkedText={t('')}
          uncheckedText={t('')}
          size='small'
        />
      </div>

      {customRequestMode && (
        <>
          {/*  */}
          <Banner
            type='warning'
            description={t(
              'API',
            )}
            icon={<AlertTriangle size={16} />}
            className='!rounded-lg'
            closeIcon={null}
          />

          {/* JSON */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <Typography.Text strong className='text-sm'>
                {t(' JSON')}
              </Typography.Text>
              <div className='flex items-center gap-2'>
                {isValid ? (
                  <div className='flex items-center gap-1 text-green-600'>
                    <Check size={14} />
                    <Typography.Text className='text-xs'>
                      {t('')}
                    </Typography.Text>
                  </div>
                ) : (
                  <div className='flex items-center gap-1 text-red-600'>
                    <X size={14} />
                    <Typography.Text className='text-xs'>
                      {t('')}
                    </Typography.Text>
                  </div>
                )}
                <Button
                  theme='borderless'
                  type='tertiary'
                  size='small'
                  icon={<Edit size={14} />}
                  onClick={formatJson}
                  disabled={!isValid}
                  className='!rounded-lg'
                >
                  {t('')}
                </Button>
              </div>
            </div>

            <TextArea
              value={localValue}
              onChange={handleValueChange}
              placeholder='{"model": "gpt-4o", "messages": [...], ...}'
              autosize={{ minRows: 8, maxRows: 20 }}
              className={`custom-request-textarea !rounded-lg font-mono text-sm ${!isValid ? '!border-red-500' : ''}`}
              style={{
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                lineHeight: '1.5',
              }}
            />

            {!isValid && errorMessage && (
              <Typography.Text type='danger' className='text-xs mt-1 block'>
                {errorMessage}
              </Typography.Text>
            )}

            <Typography.Text className='text-xs text-gray-500 mt-2 block'>
              {t(
                'JSON',
              )}
            </Typography.Text>
          </div>
        </>
      )}
    </div>
  );
};

export default CustomRequestEditor;

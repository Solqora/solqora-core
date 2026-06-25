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

import React, { useEffect, useState } from 'react';
import { Modal, RadioGroup, Radio, Steps, Button } from '@douyinfe/semi-ui';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';

const SyncWizardModal = ({ visible, onClose, onConfirm, loading, t }) => {
  const [step, setStep] = useState(0);
  const [option, setOption] = useState('official');
  const [locale, setLocale] = useState('zh-CN');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (visible) {
      setStep(0);
      setOption('official');
      setLocale('zh-CN');
    }
  }, [visible]);

  return (
    <Modal
      title={t('')}
      visible={visible}
      onCancel={onClose}
      footer={
        <div className='flex justify-end'>
          {step === 1 && (
            <Button onClick={() => setStep(0)}>{t('')}</Button>
          )}
          <Button onClick={onClose}>{t('')}</Button>
          {step === 0 && (
            <Button
              type='primary'
              onClick={() => setStep(1)}
              disabled={option !== 'official'}
            >
              {t('')}
            </Button>
          )}
          {step === 1 && (
            <Button
              type='primary'
              theme='solid'
              loading={loading}
              onClick={async () => {
                await onConfirm?.({ option, locale });
              }}
            >
              {t('')}
            </Button>
          )}
        </div>
      }
      width={isMobile ? '100%' : 'small'}
    >
      <div className='mb-3'>
        <Steps type='basic' current={step} size='small'>
          <Steps.Step title={t('')} description={t('')} />
          <Steps.Step title={t('')} description={t('')} />
        </Steps>
      </div>

      {step === 0 && (
        <div className='mt-2 flex justify-center'>
          <RadioGroup
            value={option}
            onChange={(e) => setOption(e?.target?.value ?? e)}
            type='card'
            direction='horizontal'
            aria-label=''
            name='sync-mode-selection'
          >
            <Radio value='official' extra={t('')}>
              {t('')}
            </Radio>
            <Radio value='config' extra={t('')} disabled>
              {t('')}
            </Radio>
          </RadioGroup>
        </div>
      )}

      {step === 1 && (
        <div className='mt-2'>
          <div className='mb-2 text-[var(--semi-color-text-2)]'>
            {t('')}
          </div>
          <div className='flex justify-center'>
            <RadioGroup
              value={locale}
              onChange={(e) => setLocale(e?.target?.value ?? e)}
              type='card'
              direction='horizontal'
              aria-label=''
              name='sync-locale-selection'
            >
              <Radio value='en' extra='English'>
                en
              </Radio>
              <Radio value='zh-CN' extra=''>
                zh-CN
              </Radio>
              <Radio value='zh-TW' extra=''>
                zh-TW
              </Radio>
              <Radio value='ja' extra=''>
                ja
              </Radio>
            </RadioGroup>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default SyncWizardModal;

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
import { Button } from '@douyinfe/semi-ui';
import { IconCheckCircleStroked } from '@douyinfe/semi-icons';

/**
 * 
 * 
 */
const StepNavigation = ({
  currentStep,
  steps,
  prev,
  next,
  onSubmit,
  loading,
  t,
}) => {
  return (
    <div className='flex justify-between items-center pt-4'>
      {/*  */}
      {currentStep > 0 && (
        <Button onClick={prev} className='!rounded-lg'>
          {t('')}
        </Button>
      )}

      <div className='flex-1'></div>

      {/*  */}
      {currentStep < steps.length - 1 && (
        <Button type='primary' onClick={next} className='!rounded-lg'>
          {t('')}
        </Button>
      )}

      {/*  */}
      {currentStep === steps.length - 1 && (
        <Button
          type='primary'
          onClick={onSubmit}
          loading={loading}
          className='!rounded-lg'
          icon={<IconCheckCircleStroked />}
        >
          {t('')}
        </Button>
      )}
    </div>
  );
};

export default StepNavigation;

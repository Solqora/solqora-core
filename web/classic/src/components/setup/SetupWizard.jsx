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

import React, { useEffect, useState, useRef } from 'react';
import { Card, Divider, Steps, Form } from '@douyinfe/semi-ui';
import { API, showError, showNotice } from '../../helpers';
import { useTranslation } from 'react-i18next';

import StepNavigation from './components/StepNavigation';
import DatabaseStep from './components/steps/DatabaseStep';
import AdminStep from './components/steps/AdminStep';
import UsageModeStep from './components/steps/UsageModeStep';
import CompleteStep from './components/steps/CompleteStep';

const SetupWizard = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState({
    status: false,
    root_init: false,
    database_type: '',
  });
  const [currentStep, setCurrentStep] = useState(0);
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    usageMode: 'external',
  });

  // “”
  useEffect(() => {
    if (formRef.current) {
      formRef.current.setValue('usageMode', 'external');
    }
  }, []);

  // 
  const steps = [
    {
      title: t(''),
      description: t(''),
    },
    {
      title: t(''),
      description: t(''),
    },
    {
      title: t(''),
      description: t(''),
    },
    {
      title: t(''),
      description: t(''),
    },
  ];

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  const fetchSetupStatus = async () => {
    try {
      const res = await API.get('/api/setup');
      const { success, data } = res.data;
      if (success) {
        setSetupStatus(data);

        // If setup is already completed, redirect to home
        if (data.status) {
          window.location.href = '/';
          return;
        }

        //  - 
        setCurrentStep(0);
      } else {
        showError(t(''));
      }
    } catch (error) {
      console.error('Failed to fetch setup status:', error);
      showError(t(''));
    }
  };

  const handleUsageModeChange = (e) => {
    const nextMode = e?.target?.value ?? e;
    setFormData((prev) => ({ ...prev, usageMode: nextMode }));
    //  getValues()  usageMode
    if (formRef.current) {
      formRef.current.setValue('usageMode', nextMode);
    }
  };

  const next = () => {
    // 
    if (!canProceedToNext()) {
      return;
    }

    const current = currentStep + 1;
    setCurrentStep(current);
  };

  // 
  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // 
        return true; // 
      case 1: // 
        if (setupStatus.root_init) {
          return true; // 
        }
        // 
        if (
          !formData.username ||
          !formData.password ||
          !formData.confirmPassword
        ) {
          showError(t(''));
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          showError(t(''));
          return false;
        }
        if (formData.password.length < 8) {
          showError(t('8'));
          return false;
        }
        return true;
      case 2: // 
        if (!formData.usageMode) {
          showError(t(''));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const prev = () => {
    const current = currentStep - 1;
    setCurrentStep(current);
  };

  const onSubmit = () => {
    if (!formRef.current) {
      console.error('Form reference is null');
      showError(t(''));
      return;
    }

    const values = formRef.current.getValues();

    // For root_init=false, validate admin username and password
    if (!setupStatus.root_init) {
      if (!values.username || !values.username.trim()) {
        showError(t(''));
        return;
      }

      if (!values.password || values.password.length < 8) {
        showError(t('8'));
        return;
      }

      if (values.password !== values.confirmPassword) {
        showError(t(''));
        return;
      }
    }

    // Prepare submission data
    const formValues = { ...values };
    const usageMode = values.usageMode;
    formValues.SelfUseModeEnabled = usageMode === 'self';
    formValues.DemoSiteEnabled = usageMode === 'demo';

    // Remove usageMode as it's not needed by the backend
    delete formValues.usageMode;

    // 
    setLoading(true);

    // Submit to backend
    API.post('/api/setup', formValues)
      .then((res) => {
        const { success, message } = res.data;

        if (success) {
          showNotice(t('...'));
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          showError(message || t(''));
        }
      })
      .catch((error) => {
        console.error('API error:', error);
        showError(t(''));
        setLoading(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // 
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <DatabaseStep setupStatus={setupStatus} t={t} />;
      case 1:
        return (
          <AdminStep
            setupStatus={setupStatus}
            formData={formData}
            setFormData={setFormData}
            formRef={formRef}
            t={t}
          />
        );
      case 2:
        return (
          <UsageModeStep
            formData={formData}
            handleUsageModeChange={handleUsageModeChange}
            t={t}
          />
        );
      case 3:
        return (
          <CompleteStep setupStatus={setupStatus} formData={formData} t={t} />
        );
      default:
        return null;
    }
  };

  const stepNavigationProps = {
    currentStep,
    steps,
    prev,
    next,
    onSubmit,
    loading,
    t,
  };

  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-4xl'>
        <Card className='!rounded-2xl shadow-sm border-0'>
          <div className='mb-4'>
            <div className='text-xl font-semibold'>{t('')}</div>
            <div className='text-xs text-gray-600'>
              {t('')}
            </div>
          </div>

          <div className='px-2 py-2'>
            <Steps type='basic' current={currentStep}>
              {steps.map((item, index) => (
                <Steps.Step
                  key={item.title}
                  title={
                    <span className={currentStep === index ? 'shine-text' : ''}>
                      {item.title}
                    </span>
                  }
                  description={item.description}
                />
              ))}
            </Steps>
          </div>

          <Divider margin='12px' />

          {/*  */}
          <Form
            getFormApi={(formApi) => {
              formRef.current = formApi;
            }}
            initValues={formData}
          >
            {/*  */}
            <div className='steps-content'>
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  style={{ display: currentStep === idx ? 'block' : 'none' }}
                >
                  {React.cloneElement(getStepContent(idx), {
                    ...stepNavigationProps,
                    renderNavigationButtons: () => (
                      <StepNavigation {...stepNavigationProps} />
                    ),
                  })}
                </div>
              ))}
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default SetupWizard;

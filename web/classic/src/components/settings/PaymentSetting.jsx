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
import { Banner, Button, Card, Spin, Tabs } from '@douyinfe/semi-ui';
import SettingsGeneralPayment from '../../pages/Setting/Payment/SettingsGeneralPayment';
import SettingsPaymentGateway from '../../pages/Setting/Payment/SettingsPaymentGateway';
import SettingsPaymentGatewayStripe from '../../pages/Setting/Payment/SettingsPaymentGatewayStripe';
import SettingsPaymentGatewayCreem from '../../pages/Setting/Payment/SettingsPaymentGatewayCreem';
import SettingsPaymentGatewayWaffo from '../../pages/Setting/Payment/SettingsPaymentGatewayWaffo';
import { API, showError, showSuccess, toBoolean } from '../../helpers';
import { useTranslation } from 'react-i18next';
import RiskAcknowledgementModal from '../common/modals/RiskAcknowledgementModal';

const CURRENT_COMPLIANCE_TERMS_VERSION = 'v1';

const PaymentSetting = () => {
  const { t } = useTranslation();
  let [inputs, setInputs] = useState({
    ServerAddress: '',
    PayAddress: '',
    EpayId: '',
    EpayKey: '',
    Price: 7.3,
    MinTopUp: 1,
    TopupGroupRatio: '',
    CustomCallbackAddress: '',
    PayMethods: '',
    AmountOptions: '',
    AmountDiscount: '',

    StripeApiSecret: '',
    StripeWebhookSecret: '',
    StripePriceId: '',
    StripeUnitPrice: 8.0,
    StripeMinTopUp: 1,
    StripePromotionCodesEnabled: false,

    'payment_setting.compliance_confirmed': false,
    'payment_setting.compliance_terms_version': '',
    'payment_setting.compliance_confirmed_at': 0,
    'payment_setting.compliance_confirmed_by': 0,
  });

  let [loading, setLoading] = useState(false);
  const [complianceVisible, setComplianceVisible] = useState(false);

  const complianceStatements = [
    t(' API'),
    t(
      ' API',
    ),
    t(
      '',
    ),
    t(
      '',
    ),
    t(''),
    t(
      '',
    ),
  ];
  const requiredComplianceText = t(
    '',
  );
  const requiredComplianceTextParts = [
    {
      type: 'input',
      text: t(''),
    },
    { type: 'static', text: t('') },
    {
      type: 'input',
      text: t(''),
    },
    { type: 'static', text: t('') },
    {
      type: 'input',
      text: t(''),
    },
    { type: 'static', text: t('') },
    {
      type: 'input',
      text: t(''),
    },
  ];
  const complianceConfirmed =
    inputs['payment_setting.compliance_confirmed'] &&
    inputs['payment_setting.compliance_terms_version'] ===
      CURRENT_COMPLIANCE_TERMS_VERSION;

  const getOptions = async () => {
    const res = await API.get('/api/option/');
    const { success, message, data } = res.data;
    if (success) {
      let newInputs = {};
      data.forEach((item) => {
        switch (item.key) {
          case 'TopupGroupRatio':
            try {
              newInputs[item.key] = JSON.stringify(
                JSON.parse(item.value),
                null,
                2,
              );
            } catch (error) {
              newInputs[item.key] = item.value;
            }
            break;
          case 'payment_setting.amount_options':
            try {
              newInputs['AmountOptions'] = JSON.stringify(
                JSON.parse(item.value),
                null,
                2,
              );
            } catch (error) {
              newInputs['AmountOptions'] = item.value;
            }
            break;
          case 'payment_setting.amount_discount':
            try {
              newInputs['AmountDiscount'] = JSON.stringify(
                JSON.parse(item.value),
                null,
                2,
              );
            } catch (error) {
              newInputs['AmountDiscount'] = item.value;
            }
            break;
          case 'payment_setting.compliance_confirmed':
            newInputs[item.key] = toBoolean(item.value);
            break;
          case 'payment_setting.compliance_confirmed_at':
          case 'payment_setting.compliance_confirmed_by':
            newInputs[item.key] = parseInt(item.value) || 0;
            break;
          case 'payment_setting.compliance_terms_version':
            newInputs[item.key] = item.value;
            break;
          case 'Price':
          case 'MinTopUp':
          case 'StripeUnitPrice':
          case 'StripeMinTopUp':
            newInputs[item.key] = parseFloat(item.value);
            break;
          default:
            if (item.key.endsWith('Enabled')) {
              newInputs[item.key] = toBoolean(item.value);
            } else {
              newInputs[item.key] = item.value;
            }
            break;
        }
      });

      setInputs((prev) => ({ ...prev, ...newInputs }));
    } else {
      showError(t(message));
    }
  };

  async function onRefresh() {
    try {
      setLoading(true);
      await getOptions();
    } catch (error) {
      showError(t(''));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    onRefresh();
  }, []);

  const confirmCompliance = async () => {
    try {
      const res = await API.post('/api/option/payment_compliance', {
        confirmed: true,
      });
      if (res.data.success) {
        showSuccess(t(''));
        setComplianceVisible(false);
        await onRefresh();
      } else {
        showError(res.data.message || t(''));
      }
    } catch (error) {
      showError(t(''));
    }
  };

  return (
    <>
      <Spin spinning={loading} size='large'>
        <Card style={{ marginTop: '10px' }}>
          {!complianceConfirmed ? (
            <Banner
              type='warning'
              title={t('')}
              description={
                <div className='flex flex-col gap-2'>
                  <span>
                    {t(
                      '',
                    )}
                  </span>
                  <Button
                    type='warning'
                    theme='solid'
                    onClick={() => setComplianceVisible(true)}
                  >
                    {t('')}
                  </Button>
                </div>
              }
              closeIcon={null}
              style={{ marginBottom: 16 }}
              fullMode={false}
            />
          ) : (
            <Banner
              type='success'
              title={t('')}
              description={t('{{time}}#{{userId}}', {
                time: inputs['payment_setting.compliance_confirmed_at']
                  ? new Date(
                      inputs['payment_setting.compliance_confirmed_at'] * 1000,
                    ).toLocaleString()
                  : '-',
                userId:
                  inputs['payment_setting.compliance_confirmed_by'] || '-',
              })}
              closeIcon={null}
              style={{ marginBottom: 16 }}
              fullMode={false}
            />
          )}
          <div
            style={
              complianceConfirmed
                ? undefined
                : { opacity: 0.4, pointerEvents: 'none' }
            }
          >
            <Tabs
              type='card'
              defaultActiveKey='general'
              contentStyle={{ paddingTop: 24 }}
            >
              <Tabs.TabPane tab={t('')} itemKey='general'>
                <SettingsGeneralPayment
                  options={inputs}
                  refresh={onRefresh}
                  hideSectionTitle
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={t('')} itemKey='epay'>
                <SettingsPaymentGateway
                  options={inputs}
                  refresh={onRefresh}
                  hideSectionTitle
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={t('Stripe ')} itemKey='stripe'>
                <SettingsPaymentGatewayStripe
                  options={inputs}
                  refresh={onRefresh}
                  hideSectionTitle
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={t('Creem ')} itemKey='creem'>
                <SettingsPaymentGatewayCreem
                  options={inputs}
                  refresh={onRefresh}
                  hideSectionTitle
                />
              </Tabs.TabPane>
              <Tabs.TabPane tab={t('Waffo ')} itemKey='waffo'>
                <SettingsPaymentGatewayWaffo
                  options={inputs}
                  refresh={onRefresh}
                  hideSectionTitle
                />
              </Tabs.TabPane>
            </Tabs>
          </div>
        </Card>
        <RiskAcknowledgementModal
          visible={complianceVisible}
          title={t('')}
          markdownContent={t(
            '',
          )}
          checklist={complianceStatements}
          inputPrompt={t(':')}
          requiredText={requiredComplianceText}
          requiredTextParts={requiredComplianceTextParts}
          inputPlaceholder={t('')}
          mismatchText={t('')}
          cancelText={t('')}
          confirmText={t('')}
          onCancel={() => setComplianceVisible(false)}
          onConfirm={confirmCompliance}
        />
      </Spin>
    </>
  );
};

export default PaymentSetting;

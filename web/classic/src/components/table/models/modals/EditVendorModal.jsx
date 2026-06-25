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

import React, { useState, useRef, useEffect } from 'react';
import { Modal, Form, Col, Row } from '@douyinfe/semi-ui';
import { API, showError, showSuccess } from '../../../../helpers';
import { Typography } from '@douyinfe/semi-ui';
import { IconLink } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../../../hooks/common/useIsMobile';

const EditVendorModal = ({ visible, handleClose, refresh, editingVendor }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const formApiRef = useRef(null);

  const isMobile = useIsMobile();
  const isEdit = editingVendor && editingVendor.id !== undefined;

  const getInitValues = () => ({
    name: '',
    description: '',
    icon: '',
    status: true,
  });

  const handleCancel = () => {
    handleClose();
    formApiRef.current?.reset();
  };

  const loadVendor = async () => {
    if (!isEdit || !editingVendor.id) return;

    setLoading(true);
    try {
      const res = await API.get(`/api/vendors/${editingVendor.id}`);
      const { success, message, data } = res.data;
      if (success) {
        // 
        data.status = data.status === 1;
        if (formApiRef.current) {
          formApiRef.current.setValues({ ...getInitValues(), ...data });
        }
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t(''));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      if (isEdit) {
        loadVendor();
      } else {
        formApiRef.current?.setValues(getInitValues());
      }
    } else {
      formApiRef.current?.reset();
    }
  }, [visible, editingVendor?.id]);

  const submit = async (values) => {
    setLoading(true);
    try {
      //  status 
      const submitData = {
        ...values,
        status: values.status ? 1 : 0,
      };

      if (isEdit) {
        submitData.id = editingVendor.id;
        const res = await API.put('/api/vendors/', submitData);
        const { success, message } = res.data;
        if (success) {
          showSuccess(t(''));
          refresh();
          handleClose();
        } else {
          showError(t(message));
        }
      } else {
        const res = await API.post('/api/vendors/', submitData);
        const { success, message } = res.data;
        if (success) {
          showSuccess(t(''));
          refresh();
          handleClose();
        } else {
          showError(t(message));
        }
      }
    } catch (error) {
      showError(error.response?.data?.message || t(''));
    }
    setLoading(false);
  };

  return (
    <Modal
      title={isEdit ? t('') : t('')}
      visible={visible}
      onOk={() => formApiRef.current?.submitForm()}
      onCancel={handleCancel}
      confirmLoading={loading}
      size={isMobile ? 'full-width' : 'small'}
    >
      <Form
        initValues={getInitValues()}
        getFormApi={(api) => (formApiRef.current = api)}
        onSubmit={submit}
      >
        <Row gutter={12}>
          <Col span={24}>
            <Form.Input
              field='name'
              label={t('')}
              placeholder={t('OpenAI')}
              rules={[{ required: true, message: t('') }]}
              showClear
            />
          </Col>
          <Col span={24}>
            <Form.TextArea
              field='description'
              label={t('')}
              placeholder={t('')}
              rows={3}
              showClear
            />
          </Col>
          <Col span={24}>
            <Form.Input
              field='icon'
              label={t('')}
              placeholder={t('')}
              extraText={
                <span>
                  {t(
                    "@lobehub/iconsOpenAIClaude.ColorOpenAI.Avatar.type={'platform'}OpenRouter.Avatar.shape={'square'} ",
                  )}
                  <Typography.Text
                    link={{
                      href: 'https://icons.lobehub.com/components/lobe-hub',
                      target: '_blank',
                    }}
                    icon={<IconLink />}
                    underline
                  >
                    {t('')}
                  </Typography.Text>
                </span>
              }
              showClear
            />
          </Col>
          <Col span={24}>
            <Form.Switch field='status' label={t('')} initValue={true} />
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditVendorModal;

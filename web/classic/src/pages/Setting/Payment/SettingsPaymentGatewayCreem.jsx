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
import {
  Banner,
  Button,
  Form,
  Row,
  Col,
  Typography,
  Spin,
  Table,
  Modal,
  Input,
  InputNumber,
  Select,
} from '@douyinfe/semi-ui';
const { Text } = Typography;
import { API, showError, showSuccess } from '../../../helpers';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus, Trash2 } from 'lucide-react';

export default function SettingsPaymentGatewayCreem(props) {
  const { t } = useTranslation();
  const sectionTitle = props.hideSectionTitle ? undefined : t('Creem ');
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    CreemApiKey: '',
    CreemWebhookSecret: '',
    CreemProducts: '[]',
    CreemTestMode: false,
  });
  const [originInputs, setOriginInputs] = useState({});
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    productId: '',
    price: 0,
    quota: 0,
    currency: 'USD',
  });
  const formApiRef = useRef(null);

  useEffect(() => {
    if (props.options && formApiRef.current) {
      const currentInputs = {
        CreemApiKey: props.options.CreemApiKey || '',
        CreemWebhookSecret: props.options.CreemWebhookSecret || '',
        CreemProducts: props.options.CreemProducts || '[]',
        CreemTestMode: props.options.CreemTestMode === 'true',
      };
      setInputs(currentInputs);
      setOriginInputs({ ...currentInputs });
      formApiRef.current.setValues(currentInputs);

      // Parse products
      try {
        const parsedProducts = JSON.parse(currentInputs.CreemProducts);
        setProducts(parsedProducts);
      } catch (e) {
        setProducts([]);
      }
    }
  }, [props.options]);

  const handleFormChange = (values) => {
    setInputs(values);
  };

  const submitCreemSetting = async () => {
    setLoading(true);
    try {
      const options = [];

      if (inputs.CreemApiKey && inputs.CreemApiKey !== '') {
        options.push({ key: 'CreemApiKey', value: inputs.CreemApiKey });
      }

      if (inputs.CreemWebhookSecret && inputs.CreemWebhookSecret !== '') {
        options.push({
          key: 'CreemWebhookSecret',
          value: inputs.CreemWebhookSecret,
        });
      }

      // Save test mode setting
      options.push({
        key: 'CreemTestMode',
        value: inputs.CreemTestMode ? 'true' : 'false',
      });

      // Save products as JSON string
      options.push({ key: 'CreemProducts', value: JSON.stringify(products) });

      // 
      const requestQueue = options.map((opt) =>
        API.put('/api/option/', {
          key: opt.key,
          value: opt.value,
        }),
      );

      const results = await Promise.all(requestQueue);

      // 
      const errorResults = results.filter((res) => !res.data.success);
      if (errorResults.length > 0) {
        errorResults.forEach((res) => {
          showError(res.data.message);
        });
      } else {
        showSuccess(t(''));
        // 
        setOriginInputs({ ...inputs });
        props.refresh?.();
      }
    } catch (error) {
      showError(t(''));
    }
    setLoading(false);
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ ...product });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        productId: '',
        price: 0,
        quota: 0,
        currency: 'USD',
      });
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm({
      name: '',
      productId: '',
      price: 0,
      quota: 0,
      currency: 'USD',
    });
  };

  const saveProduct = () => {
    if (
      !productForm.name ||
      !productForm.productId ||
      productForm.price <= 0 ||
      productForm.quota <= 0 ||
      !productForm.currency
    ) {
      showError(t(''));
      return;
    }

    let newProducts = [...products];
    if (editingProduct) {
      // 
      const index = newProducts.findIndex(
        (p) => p.productId === editingProduct.productId,
      );
      if (index !== -1) {
        newProducts[index] = { ...productForm };
      }
    } else {
      // 
      if (newProducts.find((p) => p.productId === productForm.productId)) {
        showError(t('ID'));
        return;
      }
      newProducts.push({ ...productForm });
    }

    setProducts(newProducts);
    closeProductModal();
  };

  const deleteProduct = (productId) => {
    const newProducts = products.filter((p) => p.productId !== productId);
    setProducts(newProducts);
  };

  const columns = [
    {
      title: t(''),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('ID'),
      dataIndex: 'productId',
      key: 'productId',
    },
    {
      title: t(''),
      dataIndex: 'price',
      key: 'price',
      render: (price, record) =>
        `${record.currency === 'EUR' ? '€' : '$'}${price}`,
    },
    {
      title: t(''),
      dataIndex: 'quota',
      key: 'quota',
    },
    {
      title: t(''),
      key: 'action',
      render: (_, record) => (
        <div className='flex gap-2'>
          <Button
            type='tertiary'
            size='small'
            onClick={() => openProductModal(record)}
          >
            {t('')}
          </Button>
          <Button
            type='danger'
            theme='borderless'
            size='small'
            icon={<Trash2 size={14} />}
            onClick={() => deleteProduct(record.productId)}
          />
        </div>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Form
        initValues={inputs}
        onValueChange={handleFormChange}
        getFormApi={(api) => (formApiRef.current = api)}
      >
        <Form.Section text={sectionTitle}>
          <Banner
            type='info'
            icon={<BookOpen size={16} />}
            description={
              <>
                {t('Creem ')}
                <a href='https://creem.io' target='_blank' rel='noreferrer'>
                  Creem Official Site
                </a>
                <br />
                {t('Creem Setting Tips')}
              </>
            }
            style={{ marginBottom: 16 }}
          />

          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 24, xl: 24, xxl: 24 }}>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CreemApiKey'
                label={t('API ')}
                placeholder={t('Creem API ')}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Input
                field='CreemWebhookSecret'
                label={t('Webhook ')}
                placeholder={t(
                  ' new-api  webhook ',
                )}
                type='password'
              />
            </Col>
            <Col xs={24} sm={24} md={8} lg={8} xl={8}>
              <Form.Switch
                field='CreemTestMode'
                label={t('')}
                extraText={t(' Creem Test Mode')}
              />
            </Col>
          </Row>

          <div style={{ marginTop: 24 }}>
            <div className='flex justify-between items-center mb-4'>
              <Text strong>{t('')}</Text>
              <Button
                type='primary'
                icon={<Plus size={16} />}
                onClick={() => openProductModal()}
              >
                {t('')}
              </Button>
            </div>

            <Table
              columns={columns}
              dataSource={products}
              pagination={false}
              empty={
                <div className='text-center py-8'>
                  <Text type='tertiary'>{t('')}</Text>
                </div>
              }
            />
          </div>

          <Button onClick={submitCreemSetting} style={{ marginTop: 16 }}>
            {t(' Creem ')}
          </Button>
        </Form.Section>
      </Form>

      {/*  */}
      <Modal
        title={editingProduct ? t('') : t('')}
        visible={showProductModal}
        onOk={saveProduct}
        onCancel={closeProductModal}
        maskClosable={false}
        size='small'
        centered
      >
        <div className='space-y-4'>
          <div>
            <Text strong className='block mb-2'>
              {t('')}
            </Text>
            <Input
              value={productForm.name}
              onChange={(value) =>
                setProductForm({ ...productForm, name: value })
              }
              placeholder={t('')}
              size='large'
            />
          </div>
          <div>
            <Text strong className='block mb-2'>
              {t('ID')}
            </Text>
            <Input
              value={productForm.productId}
              onChange={(value) =>
                setProductForm({ ...productForm, productId: value })
              }
              placeholder={t('prod_6I8rBerHpPxyoiU9WK4kot')}
              size='large'
              disabled={!!editingProduct}
            />
          </div>
          <div>
            <Text strong className='block mb-2'>
              {t('')}
            </Text>
            <Select
              value={productForm.currency}
              onChange={(value) =>
                setProductForm({ ...productForm, currency: value })
              }
              size='large'
              className='w-full'
            >
              <Select.Option value='USD'>{t('USD ()')}</Select.Option>
              <Select.Option value='EUR'>{t('EUR ()')}</Select.Option>
            </Select>
          </div>
          <div>
            <Text strong className='block mb-2'>
              {t('')} (
              {productForm.currency === 'EUR' ? t('') : t('')})
            </Text>
            <InputNumber
              value={productForm.price}
              onChange={(value) =>
                setProductForm({ ...productForm, price: value })
              }
              placeholder={t('4.99')}
              min={0.01}
              precision={2}
              size='large'
              className='w-full'
              defaultValue={4.49}
            />
          </div>
          <div>
            <Text strong className='block mb-2'>
              {t('')}
            </Text>
            <InputNumber
              value={productForm.quota}
              onChange={(value) =>
                setProductForm({ ...productForm, quota: value })
              }
              placeholder={t('100000')}
              min={1}
              precision={0}
              size='large'
              className='w-full'
            />
          </div>
        </div>
      </Modal>
    </Spin>
  );
}

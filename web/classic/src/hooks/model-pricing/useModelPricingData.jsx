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

import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { API, copy, showError, showInfo, showSuccess } from '../../helpers';
import { Modal } from '@douyinfe/semi-ui';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';

export const useModelPricingData = () => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const compositionRef = useRef({ isComposition: false });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalImageUrl, setModalImageUrl] = useState('');
  const [isModalOpenurl, setIsModalOpenurl] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showModelDetail, setShowModelDetail] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [filterGroup, setFilterGroup] = useState('all'); //  Table "all" 
  const [filterQuotaType, setFilterQuotaType] = useState('all'); // : 'all' | 0 | 1
  const [filterEndpointType, setFilterEndpointType] = useState('all'); // : 'all' | string
  const [filterVendor, setFilterVendor] = useState('all'); // : 'all' | 'unknown' | string
  const [filterTag, setFilterTag] = useState('all'); // : 'all' | string
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [currency, setCurrency] = useState('USD');
  const [showWithRecharge, setShowWithRecharge] = useState(false);
  const [tokenUnit, setTokenUnit] = useState('M');
  const [models, setModels] = useState([]);
  const [vendorsMap, setVendorsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [groupRatio, setGroupRatio] = useState({});
  const [usableGroup, setUsableGroup] = useState({});
  const [endpointMap, setEndpointMap] = useState({});
  const [autoGroups, setAutoGroups] = useState([]);

  const [statusState] = useContext(StatusContext);
  const [userState] = useContext(UserContext);

  // priceusd_exchange_rate
  const priceRate = useMemo(
    () => statusState?.status?.price ?? 1,
    [statusState],
  );
  const usdExchangeRate = useMemo(
    () => statusState?.status?.usd_exchange_rate ?? priceRate,
    [statusState, priceRate],
  );
  const customExchangeRate = useMemo(
    () => statusState?.status?.custom_currency_exchange_rate ?? 1,
    [statusState],
  );
  const customCurrencySymbol = useMemo(
    () => statusState?.status?.custom_currency_symbol ?? '¤',
    [statusState],
  );

  // TOKENS 
  const siteDisplayType = useMemo(
    () => statusState?.status?.quota_display_type || 'USD',
    [statusState],
  );
  useEffect(() => {
    if (
      siteDisplayType === 'USD' ||
      siteDisplayType === 'CNY' ||
      siteDisplayType === 'CUSTOM'
    ) {
      setCurrency(siteDisplayType);
    }
  }, [siteDisplayType]);

  useEffect(() => {
    if (siteDisplayType === 'TOKENS') {
      setShowWithRecharge(false);
      setCurrency('USD');
    }
  }, [siteDisplayType]);

  const filteredModels = useMemo(() => {
    let result = models;

    // 
    if (filterGroup !== 'all') {
      result = result.filter((model) =>
        model.enable_groups.includes(filterGroup),
      );
    }

    // 
    if (filterQuotaType !== 'all') {
      result = result.filter((model) => model.quota_type === filterQuotaType);
    }

    // 
    if (filterEndpointType !== 'all') {
      result = result.filter(
        (model) =>
          model.supported_endpoint_types &&
          model.supported_endpoint_types.includes(filterEndpointType),
      );
    }

    // 
    if (filterVendor !== 'all') {
      if (filterVendor === 'unknown') {
        result = result.filter((model) => !model.vendor_name);
      } else {
        result = result.filter((model) => model.vendor_name === filterVendor);
      }
    }

    // 
    if (filterTag !== 'all') {
      const tagLower = filterTag.toLowerCase();
      result = result.filter((model) => {
        if (!model.tags) return false;
        const tagsArr = model.tags
          .toLowerCase()
          .split(/[,;|]+/)
          .map((tag) => tag.trim())
          .filter(Boolean);
        return tagsArr.includes(tagLower);
      });
    }

    // 
    if (searchValue.length > 0) {
      const searchTerm = searchValue.toLowerCase();
      result = result.filter(
        (model) =>
          (model.model_name &&
            model.model_name.toLowerCase().includes(searchTerm)) ||
          (model.description &&
            model.description.toLowerCase().includes(searchTerm)) ||
          (model.tags && model.tags.toLowerCase().includes(searchTerm)) ||
          (model.vendor_name &&
            model.vendor_name.toLowerCase().includes(searchTerm)),
      );
    }

    return result;
  }, [
    models,
    searchValue,
    filterGroup,
    filterQuotaType,
    filterEndpointType,
    filterVendor,
    filterTag,
  ]);

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys,
      onChange: (keys) => {
        setSelectedRowKeys(keys);
      },
    }),
    [selectedRowKeys],
  );

  const displayPrice = (usdPrice) => {
    let priceInUSD = usdPrice;
    if (showWithRecharge) {
      priceInUSD = (usdPrice * priceRate) / usdExchangeRate;
    }

    if (currency === 'CNY') {
      return `¥${(priceInUSD * usdExchangeRate).toFixed(3)}`;
    } else if (currency === 'CUSTOM') {
      return `${customCurrencySymbol}${(priceInUSD * customExchangeRate).toFixed(3)}`;
    }
    return `$${priceInUSD.toFixed(3)}`;
  };

  const setModelsFormat = (models, groupRatio, vendorMap) => {
    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      m.key = m.model_name;
      m.group_ratio = groupRatio[m.model_name];

      if (m.vendor_id && vendorMap[m.vendor_id]) {
        const vendor = vendorMap[m.vendor_id];
        m.vendor_name = vendor.name;
        m.vendor_icon = vendor.icon;
        m.vendor_description = vendor.description;
      }
    }
    models.sort((a, b) => {
      return a.quota_type - b.quota_type;
    });

    models.sort((a, b) => {
      if (a.model_name.startsWith('gpt') && !b.model_name.startsWith('gpt')) {
        return -1;
      } else if (
        !a.model_name.startsWith('gpt') &&
        b.model_name.startsWith('gpt')
      ) {
        return 1;
      } else {
        return a.model_name.localeCompare(b.model_name);
      }
    });

    setModels(models);
  };

  const loadPricing = async () => {
    setLoading(true);
    let url = '/api/pricing';
    const res = await API.get(url);
    const {
      success,
      message,
      data,
      vendors,
      group_ratio,
      usable_group,
      supported_endpoint,
      auto_groups,
    } = res.data;
    if (success) {
      setGroupRatio(group_ratio);
      setUsableGroup(usable_group);
      setSelectedGroup('all');
      //  Map 
      const vendorMap = {};
      if (Array.isArray(vendors)) {
        vendors.forEach((v) => {
          vendorMap[v.id] = v;
        });
      }
      setVendorsMap(vendorMap);
      setEndpointMap(supported_endpoint || {});
      setAutoGroups(auto_groups || []);
      setModelsFormat(data, group_ratio, vendorMap);
    } else {
      showError(message);
    }
    setLoading(false);
  };

  const refresh = async () => {
    await loadPricing();
  };

  const copyText = async (text) => {
    if (await copy(text)) {
      showSuccess(t('') + text);
    } else {
      Modal.error({ title: t(''), content: text });
    }
  };

  const handleChange = (value) => {
    const newSearchValue = value ? value : '';
    setSearchValue(newSearchValue);
  };

  const handleCompositionStart = () => {
    compositionRef.current.isComposition = true;
  };

  const handleCompositionEnd = (event) => {
    compositionRef.current.isComposition = false;
    const value = event.target.value;
    const newSearchValue = value ? value : '';
    setSearchValue(newSearchValue);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setFilterGroup(group);
    if (group === 'all') {
      showInfo(t(''));
    } else {
      showInfo(
        t('{{group}}{{ratio}}', {
          group: group,
          ratio: groupRatio[group] ?? 1,
        }),
      );
    }
  };

  const openModelDetail = (model) => {
    setSelectedModel(model);
    setShowModelDetail(true);
  };

  const closeModelDetail = () => {
    setShowModelDetail(false);
    setTimeout(() => {
      setSelectedModel(null);
    }, 300);
  };

  useEffect(() => {
    refresh().then();
  }, []);

  // 
  useEffect(() => {
    setCurrentPage(1);
  }, [
    filterGroup,
    filterQuotaType,
    filterEndpointType,
    filterVendor,
    filterTag,
    searchValue,
  ]);

  return {
    // 
    searchValue,
    setSearchValue,
    selectedRowKeys,
    setSelectedRowKeys,
    modalImageUrl,
    setModalImageUrl,
    isModalOpenurl,
    setIsModalOpenurl,
    selectedGroup,
    setSelectedGroup,
    showModelDetail,
    setShowModelDetail,
    selectedModel,
    setSelectedModel,
    filterGroup,
    setFilterGroup,
    filterQuotaType,
    setFilterQuotaType,
    filterEndpointType,
    setFilterEndpointType,
    filterVendor,
    setFilterVendor,
    filterTag,
    setFilterTag,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    currency,
    setCurrency,
    siteDisplayType,
    showWithRecharge,
    setShowWithRecharge,
    tokenUnit,
    setTokenUnit,
    models,
    loading,
    groupRatio,
    usableGroup,
    endpointMap,
    autoGroups,

    // 
    priceRate,
    usdExchangeRate,
    filteredModels,
    rowSelection,

    // 
    vendorsMap,

    // 
    userState,
    statusState,

    // 
    displayPrice,
    refresh,
    copyText,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleGroupClick,
    openModelDetail,
    closeModelDetail,

    // 
    compositionRef,

    // 
    t,
  };
};

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
import SelectableButtonGroup from '../../../common/ui/SelectableButtonGroup';

/**
 * 
 * @param {string|'all'|0|1} filterQuotaType 
 * @param {Function} setFilterQuotaType setter
 * @param {Array} models 
 * @param {boolean} loading 
 * @param {Function} t i18n
 */
const PricingQuotaTypes = ({
  filterQuotaType,
  setFilterQuotaType,
  models = [],
  loading = false,
  t,
}) => {
  const qtyCount = (type) =>
    models.filter((m) => (type === 'all' ? true : m.quota_type === type))
      .length;

  const items = [
    { value: 'all', label: t(''), tagCount: qtyCount('all') },
    { value: 0, label: t(''), tagCount: qtyCount(0) },
    { value: 1, label: t(''), tagCount: qtyCount(1) },
  ];

  return (
    <SelectableButtonGroup
      title={t('')}
      items={items}
      activeValue={filterQuotaType}
      onChange={setFilterQuotaType}
      loading={loading}
      variant='amber'
      t={t}
    />
  );
};

export default PricingQuotaTypes;

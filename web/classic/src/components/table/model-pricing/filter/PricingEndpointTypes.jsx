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
 * @param {string|'all'} filterEndpointType 
 * @param {Function} setFilterEndpointType setter
 * @param {Array} models 
 * @param {boolean} loading 
 * @param {Function} t i18n
 */
const PricingEndpointTypes = ({
  filterEndpointType,
  setFilterEndpointType,
  models = [],
  allModels = [],
  loading = false,
  t,
}) => {
  //  allModels models
  const getAllEndpointTypes = () => {
    const endpointTypes = new Set();
    (allModels.length > 0 ? allModels : models).forEach((model) => {
      if (
        model.supported_endpoint_types &&
        Array.isArray(model.supported_endpoint_types)
      ) {
        model.supported_endpoint_types.forEach((endpoint) => {
          endpointTypes.add(endpoint);
        });
      }
    });
    return Array.from(endpointTypes).sort();
  };

  // 
  const getEndpointTypeCount = (endpointType) => {
    if (endpointType === 'all') {
      return models.length;
    }
    return models.filter(
      (model) =>
        model.supported_endpoint_types &&
        model.supported_endpoint_types.includes(endpointType),
    ).length;
  };

  // 
  const getEndpointTypeLabel = (endpointType) => {
    return endpointType;
  };

  const availableEndpointTypes = getAllEndpointTypes();

  const items = [
    {
      value: 'all',
      label: t(''),
      tagCount: getEndpointTypeCount('all'),
    },
    ...availableEndpointTypes.map((endpointType) => {
      const count = getEndpointTypeCount(endpointType);
      return {
        value: endpointType,
        label: getEndpointTypeLabel(endpointType),
        tagCount: count,
      };
    }),
  ];

  return (
    <SelectableButtonGroup
      title={t('')}
      items={items}
      activeValue={filterEndpointType}
      onChange={setFilterEndpointType}
      loading={loading}
      variant='green'
      t={t}
    />
  );
};

export default PricingEndpointTypes;

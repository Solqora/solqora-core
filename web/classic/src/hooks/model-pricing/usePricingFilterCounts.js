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

import { useMemo } from 'react';

//  tags 
const normalizeTags = (tags = '') =>
  tags
    .toLowerCase()
    .split(/[,;|]+/)
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * 
 */
export const usePricingFilterCounts = ({
  models = [],
  filterGroup = 'all',
  filterQuotaType = 'all',
  filterEndpointType = 'all',
  filterVendor = 'all',
  filterTag = 'all',
  searchValue = '',
}) => {
  // 
  const allModels = models;

  /**
   * 
   * @param {Object} model
   * @param {Array<string>} ignore  key
   * @returns {boolean}
   */
  const matchesFilters = (model, ignore = []) => {
    // 
    if (!ignore.includes('group') && filterGroup !== 'all') {
      if (!model.enable_groups || !model.enable_groups.includes(filterGroup))
        return false;
    }

    // 
    if (!ignore.includes('quota') && filterQuotaType !== 'all') {
      if (model.quota_type !== filterQuotaType) return false;
    }

    // 
    if (!ignore.includes('endpoint') && filterEndpointType !== 'all') {
      if (
        !model.supported_endpoint_types ||
        !model.supported_endpoint_types.includes(filterEndpointType)
      )
        return false;
    }

    // 
    if (!ignore.includes('vendor') && filterVendor !== 'all') {
      if (filterVendor === 'unknown') {
        if (model.vendor_name) return false;
      } else if (model.vendor_name !== filterVendor) {
        return false;
      }
    }

    // 
    if (!ignore.includes('tag') && filterTag !== 'all') {
      const tagsArr = normalizeTags(model.tags);
      if (!tagsArr.includes(filterTag.toLowerCase())) return false;
    }

    // 
    if (!ignore.includes('search') && searchValue) {
      const term = searchValue.toLowerCase();
      const tags = model.tags ? model.tags.toLowerCase() : '';
      if (
        !(
          model.model_name.toLowerCase().includes(term) ||
          (model.description &&
            model.description.toLowerCase().includes(term)) ||
          tags.includes(term) ||
          (model.vendor_name && model.vendor_name.toLowerCase().includes(term))
        )
      )
        return false;
    }

    return true;
  };

  // 
  const quotaTypeModels = useMemo(
    () => allModels.filter((m) => matchesFilters(m, ['quota'])),
    [
      allModels,
      filterGroup,
      filterEndpointType,
      filterVendor,
      filterTag,
      searchValue,
    ],
  );

  const endpointTypeModels = useMemo(
    () => allModels.filter((m) => matchesFilters(m, ['endpoint'])),
    [
      allModels,
      filterGroup,
      filterQuotaType,
      filterVendor,
      filterTag,
      searchValue,
    ],
  );

  const vendorModels = useMemo(
    () => allModels.filter((m) => matchesFilters(m, ['vendor'])),
    [
      allModels,
      filterGroup,
      filterQuotaType,
      filterEndpointType,
      filterTag,
      searchValue,
    ],
  );

  const tagModels = useMemo(
    () => allModels.filter((m) => matchesFilters(m, ['tag'])),
    [
      allModels,
      filterGroup,
      filterQuotaType,
      filterEndpointType,
      filterVendor,
      searchValue,
    ],
  );

  const groupCountModels = useMemo(
    () => allModels.filter((m) => matchesFilters(m, ['group'])),
    [
      allModels,
      filterQuotaType,
      filterEndpointType,
      filterVendor,
      filterTag,
      searchValue,
    ],
  );

  return {
    quotaTypeModels,
    endpointTypeModels,
    vendorModels,
    groupCountModels,
    tagModels,
  };
};

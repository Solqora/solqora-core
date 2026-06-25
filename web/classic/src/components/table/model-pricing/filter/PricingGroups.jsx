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
 * @param {string} filterGroup 'all' 
 * @param {Function} setFilterGroup 
 * @param {Record<string, any>} usableGroup 
 * @param {Record<string, number>} groupRatio 
 * @param {Array} models 
 * @param {boolean} loading 
 * @param {Function} t i18n
 */
const PricingGroups = ({
  filterGroup,
  setFilterGroup,
  usableGroup = {},
  groupRatio = {},
  models = [],
  loading = false,
  t,
}) => {
  const groups = [
    'all',
    ...Object.keys(usableGroup).filter((key) => key !== ''),
  ];

  const items = groups.map((g) => {
    const modelCount =
      g === 'all'
        ? models.length
        : models.filter((m) => m.enable_groups && m.enable_groups.includes(g))
            .length;
    let ratioDisplay = '';
    if (g === 'all') {
      // ratioDisplay = t('');
    } else {
      const ratio = groupRatio[g];
      if (ratio !== undefined && ratio !== null) {
        ratioDisplay = `${ratio}x`;
      } else {
        ratioDisplay = '1x';
      }
    }
    return {
      value: g,
      label: g === 'all' ? t('') : g,
      tagCount: ratioDisplay,
    };
  });

  return (
    <SelectableButtonGroup
      title={t('')}
      items={items}
      activeValue={filterGroup}
      onChange={setFilterGroup}
      loading={loading}
      variant='teal'
      t={t}
    />
  );
};

export default PricingGroups;

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

import { useState, useEffect, useCallback } from 'react';
import { getTableCompactMode, setTableCompactMode } from '../../helpers';
import { TABLE_COMPACT_MODES_KEY } from '../../constants';

/**
 *  Hook/
 *  [compactMode, setCompactMode]
 *  localStorage  storage 
 */
export function useTableCompactMode(tableKey = 'global') {
  const [compactMode, setCompactModeState] = useState(() =>
    getTableCompactMode(tableKey),
  );

  const setCompactMode = useCallback(
    (value) => {
      setCompactModeState(value);
      setTableCompactMode(value, tableKey);
    },
    [tableKey],
  );

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === TABLE_COMPACT_MODES_KEY) {
        try {
          const modes = JSON.parse(e.newValue || '{}');
          setCompactModeState(!!modes[tableKey]);
        } catch {
          // ignore parse error
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [tableKey]);

  return [compactMode, setCompactMode];
}

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
import { useState, useEffect } from 'react';
import { API } from '../../helpers';

/**
 *  - 
 * 
 */
export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 
  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/api/user/self');
      if (res.data.success) {
        const userPermissions = res.data.data.permissions;
        setPermissions(userPermissions);
        console.log(':', userPermissions);
      } else {
        setError(res.data.message || '');
        console.error(':', res.data.message);
      }
    } catch (error) {
      setError('');
      console.error(':', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // 
  const hasSidebarSettingsPermission = () => {
    return permissions?.sidebar_settings === true;
  };

  // 
  const isSidebarSectionAllowed = (sectionKey) => {
    if (!permissions?.sidebar_modules) return true;
    const sectionPerms = permissions.sidebar_modules[sectionKey];
    return sectionPerms !== false;
  };

  // 
  const isSidebarModuleAllowed = (sectionKey, moduleKey) => {
    if (!permissions?.sidebar_modules) return true;
    const sectionPerms = permissions.sidebar_modules[sectionKey];

    // 
    if (sectionPerms === false) return false;

    // 
    if (sectionPerms && sectionPerms[moduleKey] === false) return false;

    return true;
  };

  // 
  const getAllowedSidebarSections = () => {
    if (!permissions?.sidebar_modules) return [];

    return Object.keys(permissions.sidebar_modules).filter((sectionKey) =>
      isSidebarSectionAllowed(sectionKey),
    );
  };

  // 
  const getAllowedSidebarModules = (sectionKey) => {
    if (!permissions?.sidebar_modules) return [];
    const sectionPerms = permissions.sidebar_modules[sectionKey];

    if (sectionPerms === false) return [];
    if (!sectionPerms || typeof sectionPerms !== 'object') return [];

    return Object.keys(sectionPerms).filter(
      (moduleKey) =>
        moduleKey !== 'enabled' && sectionPerms[moduleKey] === true,
    );
  };

  return {
    permissions,
    loading,
    error,
    loadPermissions,
    hasSidebarSettingsPermission,
    isSidebarSectionAllowed,
    isSidebarModuleAllowed,
    getAllowedSidebarSections,
    getAllowedSidebarModules,
  };
};

export default useUserPermissions;

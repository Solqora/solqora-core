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

import { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { StatusContext } from '../../context/Status';
import { API } from '../../helpers';

// useSidebar
const sidebarEventTarget = new EventTarget();
const SIDEBAR_REFRESH_EVENT = 'sidebar-refresh';

export const DEFAULT_ADMIN_CONFIG = {
  chat: {
    enabled: true,
    playground: true,
    chat: true,
  },
  console: {
    enabled: true,
    detail: true,
    token: true,
    log: true,
    midjourney: true,
    task: true,
  },
  personal: {
    enabled: true,
    topup: true,
    personal: true,
  },
  admin: {
    enabled: true,
    channel: true,
    models: true,
    deployment: true,
    redemption: true,
    user: true,
    subscription: true,
    setting: true,
  },
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export const mergeAdminConfig = (savedConfig) => {
  const merged = deepClone(DEFAULT_ADMIN_CONFIG);
  if (!savedConfig || typeof savedConfig !== 'object') return merged;

  for (const [sectionKey, sectionConfig] of Object.entries(savedConfig)) {
    if (!sectionConfig || typeof sectionConfig !== 'object') continue;

    if (!merged[sectionKey]) {
      merged[sectionKey] = { ...sectionConfig };
      continue;
    }

    merged[sectionKey] = { ...merged[sectionKey], ...sectionConfig };
  }

  return merged;
};

export const useSidebar = () => {
  const [statusState] = useContext(StatusContext);
  const [userConfig, setUserConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const instanceIdRef = useRef(null);
  const hasLoadedOnceRef = useRef(false);

  if (!instanceIdRef.current) {
    const randomPart = Math.random().toString(16).slice(2);
    instanceIdRef.current = `sidebar-${Date.now()}-${randomPart}`;
  }

  // 
  const adminConfig = useMemo(() => {
    if (statusState?.status?.SidebarModulesAdmin) {
      try {
        const config = JSON.parse(statusState.status.SidebarModulesAdmin);
        return mergeAdminConfig(config);
      } catch (error) {
        return mergeAdminConfig(null);
      }
    }
    return mergeAdminConfig(null);
  }, [statusState?.status?.SidebarModulesAdmin]);

  // 
  const loadUserConfig = async ({ withLoading } = {}) => {
    const shouldShowLoader =
      typeof withLoading === 'boolean'
        ? withLoading
        : !hasLoadedOnceRef.current;

    try {
      if (shouldShowLoader) {
        setLoading(true);
      }

      const res = await API.get('/api/user/self');
      if (res.data.success && res.data.data.sidebar_modules) {
        let config;
        // sidebar_modules
        if (typeof res.data.data.sidebar_modules === 'string') {
          config = JSON.parse(res.data.data.sidebar_modules);
        } else {
          config = res.data.data.sidebar_modules;
        }
        setUserConfig(config);
      } else {
        // 
        // 
        const defaultUserConfig = {};
        Object.keys(adminConfig).forEach((sectionKey) => {
          if (adminConfig[sectionKey]?.enabled) {
            defaultUserConfig[sectionKey] = { enabled: true };
            // true
            Object.keys(adminConfig[sectionKey]).forEach((moduleKey) => {
              if (
                moduleKey !== 'enabled' &&
                adminConfig[sectionKey][moduleKey]
              ) {
                defaultUserConfig[sectionKey][moduleKey] = true;
              }
            });
          }
        });
        setUserConfig(defaultUserConfig);
      }
    } catch (error) {
      // 
      const defaultUserConfig = {};
      Object.keys(adminConfig).forEach((sectionKey) => {
        if (adminConfig[sectionKey]?.enabled) {
          defaultUserConfig[sectionKey] = { enabled: true };
          Object.keys(adminConfig[sectionKey]).forEach((moduleKey) => {
            if (moduleKey !== 'enabled' && adminConfig[sectionKey][moduleKey]) {
              defaultUserConfig[sectionKey][moduleKey] = true;
            }
          });
        }
      });
      setUserConfig(defaultUserConfig);
    } finally {
      if (shouldShowLoader) {
        setLoading(false);
      }
      hasLoadedOnceRef.current = true;
    }
  };

  // 
  const refreshUserConfig = async () => {
    if (Object.keys(adminConfig).length > 0) {
      await loadUserConfig({ withLoading: false });
    }

    // useSidebar
    sidebarEventTarget.dispatchEvent(
      new CustomEvent(SIDEBAR_REFRESH_EVENT, {
        detail: { sourceId: instanceIdRef.current, skipLoader: true },
      }),
    );
  };

  // 
  useEffect(() => {
    // 
    if (Object.keys(adminConfig).length > 0) {
      loadUserConfig();
    }
  }, [adminConfig]);

  // 
  useEffect(() => {
    const handleRefresh = (event) => {
      if (event?.detail?.sourceId === instanceIdRef.current) {
        return;
      }

      if (Object.keys(adminConfig).length > 0) {
        loadUserConfig({
          withLoading: event?.detail?.skipLoader ? false : undefined,
        });
      }
    };

    sidebarEventTarget.addEventListener(SIDEBAR_REFRESH_EVENT, handleRefresh);

    return () => {
      sidebarEventTarget.removeEventListener(
        SIDEBAR_REFRESH_EVENT,
        handleRefresh,
      );
    };
  }, [adminConfig]);

  // 
  const finalConfig = useMemo(() => {
    const result = {};

    // adminConfig
    if (!adminConfig || Object.keys(adminConfig).length === 0) {
      return result;
    }

    // userConfig
    if (!userConfig) {
      return result;
    }

    // 
    Object.keys(adminConfig).forEach((sectionKey) => {
      const adminSection = adminConfig[sectionKey];
      const userSection = userConfig[sectionKey];

      // 
      if (!adminSection?.enabled) {
        result[sectionKey] = { enabled: false };
        return;
      }

      // 
      // userSectionenabledtrue
      const sectionEnabled = userSection ? userSection.enabled !== false : true;
      result[sectionKey] = { enabled: sectionEnabled };

      // 
      Object.keys(adminSection).forEach((moduleKey) => {
        if (moduleKey === 'enabled') return;

        const adminAllowed = adminSection[moduleKey];
        // userSectiontrue
        const userAllowed = userSection
          ? userSection[moduleKey] !== false
          : true;

        result[sectionKey][moduleKey] =
          adminAllowed && userAllowed && sectionEnabled;
      });
    });

    return result;
  }, [adminConfig, userConfig]);

  // 
  const isModuleVisible = (sectionKey, moduleKey = null) => {
    if (moduleKey) {
      return finalConfig[sectionKey]?.[moduleKey] === true;
    } else {
      return finalConfig[sectionKey]?.enabled === true;
    }
  };

  // 
  const hasSectionVisibleModules = (sectionKey) => {
    const section = finalConfig[sectionKey];
    if (!section?.enabled) return false;

    return Object.keys(section).some(
      (key) => key !== 'enabled' && section[key] === true,
    );
  };

  // 
  const getVisibleModules = (sectionKey) => {
    const section = finalConfig[sectionKey];
    if (!section?.enabled) return [];

    return Object.keys(section).filter(
      (key) => key !== 'enabled' && section[key] === true,
    );
  };

  return {
    loading,
    adminConfig,
    userConfig,
    finalConfig,
    isModuleVisible,
    hasSectionVisibleModules,
    getVisibleModules,
    refreshUserConfig,
  };
};

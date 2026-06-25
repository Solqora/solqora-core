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

import React, { useContext, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  API,
  showError,
  showSuccess,
  updateAPI,
  setUserData,
} from '../../helpers';
import { UserContext } from '../../context/User';
import Loading from '../common/ui/Loading';

const OAuth2Callback = (props) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [, userDispatch] = useContext(UserContext);
  const navigate = useNavigate();
  
  //  React 18 Strict Mode 
  const hasExecuted = useRef(false);

  // 
  const MAX_RETRIES = 3;

  const sendCode = async (code, state, retry = 0) => {
    try {
      const { data: resData } = await API.get(
        `/api/oauth/${props.type}?code=${code}&state=${state}`,
      );

      const { success, message, data } = resData;

      if (!success) {
        // 
        showError(message || t(''));
        return;
      }

      if (data?.action === 'bind') {
        showSuccess(t(''));
        navigate('/console/personal');
      } else {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        updateAPI();
        showSuccess(t(''));
        navigate('/console/token');
      }
    } catch (error) {
      // 
      if (retry < MAX_RETRIES) {
        // 
        await new Promise((resolve) => setTimeout(resolve, (retry + 1) * 2000));
        return sendCode(code, state, retry + 1);
      }

      // 
      showError(error.message || t(''));
      navigate('/console/personal');
    }
  };

  useEffect(() => {
    //  React 18 Strict Mode 
    if (hasExecuted.current) {
      return;
    }
    hasExecuted.current = true;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // 
    if (!code) {
      showError(t(''));
      navigate('/console/personal');
      return;
    }

    sendCode(code, state);
  }, []);

  return <Loading />;
};

export default OAuth2Callback;

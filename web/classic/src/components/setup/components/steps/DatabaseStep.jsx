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
import { Banner } from '@douyinfe/semi-ui';

/**
 * 
 * 
 */
const DatabaseStep = ({ setupStatus, renderNavigationButtons, t }) => {
  //  Electron 
  const isElectron =
    typeof window !== 'undefined' && window.electron?.isElectron;

  return (
    <>
      {/*  */}
      {setupStatus.database_type === 'sqlite' && (
        <Banner
          type={isElectron ? 'info' : 'warning'}
          closeIcon={null}
          title={isElectron ? t('') : t('')}
          description={
            isElectron ? (
              <div>
                <p>
                  {t(
                    '',
                  )}
                </p>
                {window.electron?.dataDir && (
                  <p className='mt-2 text-sm opacity-80'>
                    <strong>{t('')}</strong>
                    <br />
                    <code className='bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded'>
                      {window.electron.dataDir}
                    </code>
                  </p>
                )}
                <p className='mt-2 text-sm opacity-70'>
                  💡 {t('')}
                </p>
              </div>
            ) : (
              <div>
                <p>
                  {t(
                    ' SQLite ',
                  )}
                </p>
                <p className='mt-1'>
                  <strong>
                    {t(
                      ' MySQL  PostgreSQL  SQLite ',
                    )}
                  </strong>
                </p>
              </div>
            )
          }
          className='!rounded-lg'
          fullMode={false}
          bordered
        />
      )}

      {/* MySQL */}
      {setupStatus.database_type === 'mysql' && (
        <Banner
          type='success'
          closeIcon={null}
          title={t('')}
          description={
            <div>
              <p>
                {t(
                  ' MySQL MySQL ',
                )}
              </p>
            </div>
          }
          className='!rounded-lg'
          fullMode={false}
          bordered
        />
      )}

      {/* PostgreSQL */}
      {setupStatus.database_type === 'postgres' && (
        <Banner
          type='success'
          closeIcon={null}
          title={t('')}
          description={
            <div>
              <p>
                {t(
                  ' PostgreSQL PostgreSQL ',
                )}
              </p>
            </div>
          }
          className='!rounded-lg'
          fullMode={false}
          bordered
        />
      )}
      {renderNavigationButtons && renderNavigationButtons()}
    </>
  );
};

export default DatabaseStep;

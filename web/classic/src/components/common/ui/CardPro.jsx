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

import React, { useState } from 'react';
import { Card, Divider, Typography, Button } from '@douyinfe/semi-ui';
import PropTypes from 'prop-types';
import { useIsMobile } from '../../../hooks/common/useIsMobile';
import { IconEyeOpened, IconEyeClosed } from '@douyinfe/semi-icons';

const { Text } = Typography;

/**
 * CardPro 
 *
 * 6
 * 1.  (statsArea)
 * 2.  (descriptionArea)
 * 3. / (tabsArea)
 * 4.  (actionsArea)
 * 5.  (searchArea)
 * 6.  (paginationArea) - 
 *
 * 
 * - type1:  (TokensTable) -  +  + 
 * - type2:  (LogsTable) -  + 
 * - type3:  (ChannelsTable) -  +  +  + 
 */
const CardPro = ({
  type = 'type1',
  className = '',
  children,
  // 
  statsArea,
  descriptionArea,
  tabsArea,
  actionsArea,
  searchArea,
  paginationArea, // 
  // 
  shadows = '',
  bordered = true,
  // 
  style,
  // 
  t = (key) => key,
  ...props
}) => {
  const isMobile = useIsMobile();
  const [showMobileActions, setShowMobileActions] = useState(false);

  const toggleMobileActions = () => {
    setShowMobileActions(!showMobileActions);
  };

  const hasMobileHideableContent = actionsArea || searchArea;

  const renderHeader = () => {
    const hasContent =
      statsArea || descriptionArea || tabsArea || actionsArea || searchArea;
    if (!hasContent) return null;

    return (
      <div className='flex flex-col w-full'>
        {/*  - type2 */}
        {type === 'type2' && statsArea && <>{statsArea}</>}

        {/*  - type1type3 */}
        {(type === 'type1' || type === 'type3') && descriptionArea && (
          <>{descriptionArea}</>
        )}

        {/*  -  */}
        {((type === 'type1' || type === 'type3') && descriptionArea) ||
        (type === 'type2' && statsArea) ? (
          <Divider margin='12px' />
        ) : null}

        {/* / - type3 */}
        {type === 'type3' && tabsArea && <>{tabsArea}</>}

        {/*  */}
        {isMobile && hasMobileHideableContent && (
          <>
            <div className='w-full mb-2'>
              <Button
                onClick={toggleMobileActions}
                icon={showMobileActions ? <IconEyeClosed /> : <IconEyeOpened />}
                type='tertiary'
                size='small'
                theme='outline'
                block
              >
                {showMobileActions ? t('') : t('')}
              </Button>
            </div>
          </>
        )}

        {/*  */}
        <div
          className={`flex flex-col gap-2 ${isMobile && !showMobileActions ? 'hidden' : ''}`}
        >
          {/*  - type1type3 */}
          {(type === 'type1' || type === 'type3') &&
            actionsArea &&
            (Array.isArray(actionsArea) ? (
              actionsArea.map((area, idx) => (
                <React.Fragment key={idx}>
                  {idx !== 0 && <Divider />}
                  <div className='w-full'>{area}</div>
                </React.Fragment>
              ))
            ) : (
              <div className='w-full'>{actionsArea}</div>
            ))}

          {/*  */}
          {actionsArea && searchArea && <Divider />}

          {/*  -  */}
          {searchArea && <div className='w-full'>{searchArea}</div>}
        </div>
      </div>
    );
  };

  const headerContent = renderHeader();

  // 
  const renderFooter = () => {
    if (!paginationArea) return null;

    return (
      <div
        className={`flex w-full pt-4 border-t ${isMobile ? 'justify-center' : 'justify-between items-center'}`}
        style={{ borderColor: 'var(--semi-color-border)' }}
      >
        {paginationArea}
      </div>
    );
  };

  const footerContent = renderFooter();

  return (
    <Card
      className={`table-scroll-card !rounded-2xl ${className}`}
      title={headerContent}
      footer={footerContent}
      shadows={shadows}
      bordered={bordered}
      style={style}
      {...props}
    >
      {children}
    </Card>
  );
};

CardPro.propTypes = {
  // 
  type: PropTypes.oneOf(['type1', 'type2', 'type3']),
  // 
  className: PropTypes.string,
  style: PropTypes.object,
  shadows: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  bordered: PropTypes.bool,
  // 
  statsArea: PropTypes.node,
  descriptionArea: PropTypes.node,
  tabsArea: PropTypes.node,
  actionsArea: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  searchArea: PropTypes.node,
  paginationArea: PropTypes.node,
  // 
  children: PropTypes.node,
  // 
  t: PropTypes.func,
};

export default CardPro;

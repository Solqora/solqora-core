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

import React, { useMemo } from 'react';
import {
  Modal,
  Button,
  Empty,
  Divider,
  Typography,
} from '@douyinfe/semi-ui';
import { IconCopy } from '@douyinfe/semi-icons';
import { copy, showError, showSuccess } from '../../../../helpers';

const { Text } = Typography;

const parseAuditLine = (line) => {
  if (typeof line !== 'string') {
    return null;
  }
  const firstSpaceIndex = line.indexOf(' ');
  if (firstSpaceIndex <= 0) {
    return { action: line, content: line };
  }
  return {
    action: line.slice(0, firstSpaceIndex),
    content: line.slice(firstSpaceIndex + 1),
  };
};

const getActionLabel = (action, t) => {
  switch ((action || '').toLowerCase()) {
    case 'set':
      return t('');
    case 'delete':
      return t('');
    case 'copy':
      return t('');
    case 'move':
      return t('');
    case 'append':
      return t('');
    case 'prepend':
      return t('');
    case 'trim_prefix':
      return t('');
    case 'trim_suffix':
      return t('');
    case 'ensure_prefix':
      return t('');
    case 'ensure_suffix':
      return t('');
    case 'trim_space':
      return t('');
    case 'to_lower':
      return t('');
    case 'to_upper':
      return t('');
    case 'replace':
      return t('');
    case 'regex_replace':
      return t('');
    case 'set_header':
      return t('');
    case 'delete_header':
      return t('');
    case 'copy_header':
      return t('');
    case 'move_header':
      return t('');
    case 'pass_headers':
      return t('');
    case 'sync_fields':
      return t('');
    case 'return_error':
      return t('');
    default:
      return action;
  }
};

const ParamOverrideModal = ({
  showParamOverrideModal,
  setShowParamOverrideModal,
  paramOverrideTarget,
  t,
}) => {
  const lines = Array.isArray(paramOverrideTarget?.lines)
    ? paramOverrideTarget.lines
    : [];

  const parsedLines = useMemo(() => {
    return lines.map(parseAuditLine);
  }, [lines]);

  const copyAll = async () => {
    const content = lines.join('\n');
    if (!content) {
      return;
    }
    if (await copy(content)) {
      showSuccess(t(''));
      return;
    }
    showError(t(''));
  };

  return (
    <Modal
      title={t('')}
      visible={showParamOverrideModal}
      onCancel={() => setShowParamOverrideModal(false)}
      footer={null}
      centered
      closable
      maskClosable
      width={640}
    >
      <div style={{ padding: '8px 20px 20px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 600 }}>
                {t('{{count}} ', { count: lines.length })}
              </Text>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                fontSize: 12,
                color: 'var(--semi-color-text-2)',
              }}
            >
              {paramOverrideTarget?.modelName ? (
                <Text type='tertiary' size='small'>
                  {paramOverrideTarget.modelName}
                </Text>
              ) : null}
              {paramOverrideTarget?.requestId ? (
                <Text type='tertiary' size='small'>
                  {t('Request ID')}: {paramOverrideTarget.requestId}
                </Text>
              ) : null}
              {paramOverrideTarget?.requestPath ? (
                <Text type='tertiary' size='small'>
                  {t('')}: {paramOverrideTarget.requestPath}
                </Text>
              ) : null}
            </div>
          </div>

          <Button
            icon={<IconCopy />}
            theme='borderless'
            type='tertiary'
            size='small'
            onClick={copyAll}
            disabled={lines.length === 0}
          >
            {t('')}
          </Button>
        </div>

        <Divider margin='12px' />

        {lines.length === 0 ? (
          <Empty
            description={t('')}
            style={{ padding: '24px 0 8px' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: '56vh',
              overflowY: 'auto',
              paddingRight: 2,
            }}
          >
            {parsedLines.map((item, index) => {
              if (!item) {
                return null;
              }

              return (
                <div
                  key={`${item.action}-${index}`}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid var(--semi-color-border)',
                    background: 'var(--semi-color-fill-0)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      flex: '0 0 auto',
                      minWidth: 74,
                    }}
                  >
                    <Text
                      style={{
                        display: 'inline-block',
                        fontSize: 11,
                        fontWeight: 700,
                        lineHeight: '20px',
                        padding: '0 8px',
                        borderRadius: 999,
                        background: 'rgba(var(--semi-blue-5), 0.12)',
                        color: 'var(--semi-color-primary)',
                      }}
                    >
                      {getActionLabel(item.action, t)}
                    </Text>
                  </div>
                  <Text
                    style={{
                      flex: 1,
                      minWidth: 0,
                      fontFamily:
                        'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
                      fontSize: 12,
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'var(--semi-color-text-0)',
                    }}
                  >
                    {item.content}
                  </Text>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ParamOverrideModal;

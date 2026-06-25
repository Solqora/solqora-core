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

import { Toast, Pagination } from '@douyinfe/semi-ui';
import { toastConstants, BILLING_PRICING_VARS, BILLING_VAR_REGEX } from '../constants';
import React from 'react';
import { toast } from 'react-toastify';
import {
  THINK_TAG_REGEX,
  MESSAGE_ROLES,
} from '../constants/playground.constants';
import { TABLE_COMPACT_MODES_KEY } from '../constants';
import { MOBILE_BREAKPOINT } from '../hooks/common/useIsMobile';

const HTMLToastContent = ({ htmlContent }) => {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};
export default HTMLToastContent;
export function isAdmin() {
  let user = localStorage.getItem('user');
  if (!user) return false;
  user = JSON.parse(user);
  return user.role >= 10;
}

export function isRoot() {
  let user = localStorage.getItem('user');
  if (!user) return false;
  user = JSON.parse(user);
  return user.role >= 100;
}

export function getSystemName() {
  let system_name = localStorage.getItem('system_name');
  if (!system_name) return 'Solqora';
  return system_name;
}

export function getLogo() {
  let logo = localStorage.getItem('logo');
  if (!logo) return '/logo.png';
  return logo;
}

export function getUserIdFromLocalStorage() {
  let user = localStorage.getItem('user');
  if (!user) return -1;
  user = JSON.parse(user);
  return user.id;
}

export function getFooterHTML() {
  return localStorage.getItem('footer_html');
}

export async function copy(text) {
  let okay = true;
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    try {
      //  textarea 
      const textarea = window.document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      window.document.body.appendChild(textarea);
      textarea.select();
      window.document.execCommand('copy');
      window.document.body.removeChild(textarea);
    } catch (e) {
      okay = false;
      console.error(e);
    }
  }
  return okay;
}

// isMobile  useIsMobile Hook

let showErrorOptions = { autoClose: toastConstants.ERROR_TIMEOUT };
let showWarningOptions = { autoClose: toastConstants.WARNING_TIMEOUT };
let showSuccessOptions = { autoClose: toastConstants.SUCCESS_TIMEOUT };
let showInfoOptions = { autoClose: toastConstants.INFO_TIMEOUT };
let showNoticeOptions = { autoClose: false };

const isMobileScreen = window.matchMedia(
  `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
).matches;
if (isMobileScreen) {
  showErrorOptions.position = 'top-center';
  // showErrorOptions.transition = 'flip';

  showSuccessOptions.position = 'top-center';
  // showSuccessOptions.transition = 'flip';

  showInfoOptions.position = 'top-center';
  // showInfoOptions.transition = 'flip';

  showNoticeOptions.position = 'top-center';
  // showNoticeOptions.transition = 'flip';
}

export function showError(error) {
  console.error(error);
  if (error.message) {
    if (error.name === 'AxiosError') {
      switch (error.response?.status) {
        case 401:
          // 
          localStorage.removeItem('user');
          // toast.error('', showErrorOptions);
          window.location.href = '/login?expired=true';
          break;
        case 429:
          Toast.error('');
          break;
        case 500:
          Toast.error('');
          break;
        case 405:
          Toast.info('');
          break;
        default:
          Toast.error('' + error.message);
      }
      return;
    }
    Toast.error('' + error.message);
  } else {
    Toast.error('' + error);
  }
}

export function showWarning(message) {
  Toast.warning(message);
}

export function showSuccess(message) {
  Toast.success(message);
}

export function showInfo(message) {
  Toast.info(message);
}

export function showNotice(message, isHTML = false) {
  if (isHTML) {
    toast(<HTMLToastContent htmlContent={message} />, showNoticeOptions);
  } else {
    Toast.info(message);
  }
}

export function openPage(url) {
  window.open(url);
}

export function removeTrailingSlash(url) {
  if (!url) return '';
  if (url.endsWith('/')) {
    return url.slice(0, -1);
  } else {
    return url;
  }
}

export function getTodayStartTimestamp() {
  var now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor(now.getTime() / 1000);
}

export function timestamp2string(timestamp) {
  let date = new Date(timestamp * 1000);
  let year = date.getFullYear().toString();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  let hour = date.getHours().toString();
  let minute = date.getMinutes().toString();
  let second = date.getSeconds().toString();
  if (month.length === 1) {
    month = '0' + month;
  }
  if (day.length === 1) {
    day = '0' + day;
  }
  if (hour.length === 1) {
    hour = '0' + hour;
  }
  if (minute.length === 1) {
    minute = '0' + minute;
  }
  if (second.length === 1) {
    second = '0' + second;
  }
  return (
    year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
  );
}

export function timestamp2string1(
  timestamp,
  dataExportDefaultTime = 'hour',
  showYear = false,
) {
  let date = new Date(timestamp * 1000);
  let year = date.getFullYear();
  let month = (date.getMonth() + 1).toString();
  let day = date.getDate().toString();
  let hour = date.getHours().toString();
  if (month.length === 1) {
    month = '0' + month;
  }
  if (day.length === 1) {
    day = '0' + day;
  }
  if (hour.length === 1) {
    hour = '0' + hour;
  }
  // 
  let str = showYear ? year + '-' + month + '-' + day : month + '-' + day;
  if (dataExportDefaultTime === 'hour') {
    str += ' ' + hour + ':00';
  } else if (dataExportDefaultTime === 'week') {
    let nextWeek = new Date(timestamp * 1000 + 6 * 24 * 60 * 60 * 1000);
    let nextWeekYear = nextWeek.getFullYear();
    let nextMonth = (nextWeek.getMonth() + 1).toString();
    let nextDay = nextWeek.getDate().toString();
    if (nextMonth.length === 1) {
      nextMonth = '0' + nextMonth;
    }
    if (nextDay.length === 1) {
      nextDay = '0' + nextDay;
    }
    // 
    let nextStr = showYear
      ? nextWeekYear + '-' + nextMonth + '-' + nextDay
      : nextMonth + '-' + nextDay;
    str += ' - ' + nextStr;
  }
  return str;
}

// 
export function isDataCrossYear(timestamps) {
  if (!timestamps || timestamps.length === 0) return false;
  const years = new Set(
    timestamps.map((ts) => new Date(ts * 1000).getFullYear()),
  );
  return years.size > 1;
}

export function downloadTextAsFile(text, filename) {
  let blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

export const verifyJSON = (str) => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

export function verifyJSONPromise(value) {
  try {
    JSON.parse(value);
    return Promise.resolve();
  } catch (e) {
    return Promise.reject(' JSON ');
  }
}

export function shouldShowPrompt(id) {
  let prompt = localStorage.getItem(`prompt-${id}`);
  return !prompt;
}

export function setPromptShown(id) {
  localStorage.setItem(`prompt-${id}`, 'true');
}

/**
 * 
 * @param {Object} oldObject - 
 * @param {Object} newObject - 
 * @return {Array}  key, oldValue  newValue
 */
export function compareObjects(oldObject, newObject) {
  const changedProperties = [];

  // 
  for (const key in oldObject) {
    if (oldObject.hasOwnProperty(key) && newObject.hasOwnProperty(key)) {
      if (oldObject[key] !== newObject[key]) {
        changedProperties.push({
          key: key,
          oldValue: oldObject[key],
          newValue: newObject[key],
        });
      }
    }
  }

  return changedProperties;
}

// playground message

// ID
let messageId = 4;
export const generateMessageId = () => `${messageId++}`;

// 
export const getTextContent = (message) => {
  if (!message || !message.content) return '';

  if (Array.isArray(message.content)) {
    const textContent = message.content.find((item) => item.type === 'text');
    return textContent?.text || '';
  }
  return typeof message.content === 'string' ? message.content : '';
};

//  think 
export const processThinkTags = (content, reasoningContent = '') => {
  if (!content || !content.includes('<think>')) {
    return { content, reasoningContent };
  }

  const thoughts = [];
  const replyParts = [];
  let lastIndex = 0;
  let match;

  THINK_TAG_REGEX.lastIndex = 0;
  while ((match = THINK_TAG_REGEX.exec(content)) !== null) {
    replyParts.push(content.substring(lastIndex, match.index));
    thoughts.push(match[1]);
    lastIndex = match.index + match[0].length;
  }
  replyParts.push(content.substring(lastIndex));

  const processedContent = replyParts
    .join('')
    .replace(/<\/?think>/g, '')
    .trim();
  const thoughtsStr = thoughts.join('\n\n---\n\n');
  const processedReasoningContent =
    reasoningContent && thoughtsStr
      ? `${reasoningContent}\n\n---\n\n${thoughtsStr}`
      : reasoningContent || thoughtsStr;

  return {
    content: processedContent,
    reasoningContent: processedReasoningContent,
  };
};

//  think 
export const processIncompleteThinkTags = (content, reasoningContent = '') => {
  if (!content) return { content: '', reasoningContent };

  const lastOpenThinkIndex = content.lastIndexOf('<think>');
  if (lastOpenThinkIndex === -1) {
    return processThinkTags(content, reasoningContent);
  }

  const fragmentAfterLastOpen = content.substring(lastOpenThinkIndex);
  if (!fragmentAfterLastOpen.includes('</think>')) {
    const unclosedThought = fragmentAfterLastOpen
      .substring('<think>'.length)
      .trim();
    const cleanContent = content.substring(0, lastOpenThinkIndex);
    const processedReasoningContent = unclosedThought
      ? reasoningContent
        ? `${reasoningContent}\n\n---\n\n${unclosedThought}`
        : unclosedThought
      : reasoningContent;

    return processThinkTags(cleanContent, processedReasoningContent);
  }

  return processThinkTags(content, reasoningContent);
};

// 
export const buildMessageContent = (
  textContent,
  imageUrls = [],
  imageEnabled = false,
) => {
  if (!textContent && (!imageUrls || imageUrls.length === 0)) {
    return '';
  }

  const validImageUrls = imageUrls.filter((url) => url && url.trim() !== '');

  if (imageEnabled && validImageUrls.length > 0) {
    return [
      { type: 'text', text: textContent || '' },
      ...validImageUrls.map((url) => ({
        type: 'image_url',
        image_url: { url: url.trim() },
      })),
    ];
  }

  return textContent || '';
};

// 
export const createMessage = (role, content, options = {}) => ({
  role,
  content,
  createAt: Date.now(),
  id: generateMessageId(),
  ...options,
});

// 
export const createLoadingAssistantMessage = () =>
  createMessage(MESSAGE_ROLES.ASSISTANT, '', {
    reasoningContent: '',
    isReasoningExpanded: true,
    isThinkingComplete: false,
    hasAutoCollapsed: false,
    status: 'loading',
  });

// 
export const hasImageContent = (message) => {
  return (
    message &&
    Array.isArray(message.content) &&
    message.content.some((item) => item.type === 'image_url')
  );
};

// API
export const formatMessageForAPI = (message) => {
  if (!message) return null;

  return {
    role: message.role,
    content: message.content,
  };
};

// 
export const isValidMessage = (message) => {
  return message && message.role && (message.content || message.content === '');
};

// 
export const getLastUserMessage = (messages) => {
  if (!Array.isArray(messages)) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === MESSAGE_ROLES.USER) {
      return messages[i];
    }
  }
  return null;
};

// 
export const getLastAssistantMessage = (messages) => {
  if (!Array.isArray(messages)) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === MESSAGE_ROLES.ASSISTANT) {
      return messages[i];
    }
  }
  return null;
};

// 
export const getRelativeTime = (publishDate) => {
  if (!publishDate) return '';

  const now = new Date();
  const pubDate = new Date(publishDate);

  // 
  if (isNaN(pubDate.getTime())) return publishDate;

  const diffMs = now.getTime() - pubDate.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  // 
  if (diffMs < 0) {
    return formatDateString(pubDate);
  }

  // 
  if (diffSeconds < 60) {
    return '';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} `;
  } else if (diffHours < 24) {
    return `${diffHours} `;
  } else if (diffDays < 7) {
    return `${diffDays} `;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} `;
  } else if (diffMonths < 12) {
    return `${diffMonths} `;
  } else if (diffYears < 2) {
    return '1 ';
  } else {
    // 2
    return formatDateString(pubDate);
  }
};

// 
export const formatDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 
export const formatDateTimeString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

function readTableCompactModes() {
  try {
    const json = localStorage.getItem(TABLE_COMPACT_MODES_KEY);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

function writeTableCompactModes(modes) {
  try {
    localStorage.setItem(TABLE_COMPACT_MODES_KEY, JSON.stringify(modes));
  } catch {
    // ignore
  }
}

export function getTableCompactMode(tableKey = 'global') {
  const modes = readTableCompactModes();
  return !!modes[tableKey];
}

export function setTableCompactMode(compact, tableKey = 'global') {
  const modes = readTableCompactModes();
  modes[tableKey] = compact;
  writeTableCompactModes(modes);
}

// -------------------------------
// Select 
//  <Select filter={selectFilter} ... />
//  Select  --  option.value  option.label
export const selectFilter = (input, option) => {
  if (!input) return true;

  const keyword = input.trim().toLowerCase();
  const valueText = (option?.value ?? '').toString().toLowerCase();
  const labelText = (option?.label ?? '').toString().toLowerCase();

  return valueText.includes(keyword) || labelText.includes(keyword);
};

// -------------------------------
// 
export const calculateModelPrice = ({
  record,
  selectedGroup,
  groupRatio,
  tokenUnit,
  displayPrice,
  currency,
  quotaDisplayType = 'USD',
  precision = 4,
}) => {
  // 1. 
  let usedGroup = selectedGroup;
  let usedGroupRatio = groupRatio[selectedGroup];

  if (selectedGroup === 'all' || usedGroupRatio === undefined) {
    //  1
    let minRatio = Number.POSITIVE_INFINITY;
    if (
      Array.isArray(record.enable_groups) &&
      record.enable_groups.length > 0
    ) {
      record.enable_groups.forEach((g) => {
        const r = groupRatio[g];
        if (r !== undefined && r < minRatio) {
          minRatio = r;
          usedGroup = g;
          usedGroupRatio = r;
        }
      });
    }

    //  1
    if (usedGroupRatio === undefined) {
      usedGroupRatio = 1;
    }
  }

  // 2. tiered_expr
  if (record.billing_mode === 'tiered_expr' && record.billing_expr) {
    return {
      isDynamicPricing: true,
      billingExpr: record.billing_expr,
      usedGroup,
      usedGroupRatio,
    };
  }

  // 3. 
  if (record.quota_type === 0) {
    // 
    const isTokensDisplay = quotaDisplayType === 'TOKENS';
    const inputRatioPriceUSD = record.model_ratio * 2 * usedGroupRatio;
    const unitDivisor = tokenUnit === 'K' ? 1000 : 1;
    const unitLabel = tokenUnit === 'K' ? 'K' : 'M';
    const hasRatioValue = (value) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      Number.isFinite(Number(value));

    const formatRatio = (value) =>
      hasRatioValue(value) ? Number(Number(value).toFixed(6)) : null;

    if (isTokensDisplay) {
      return {
        inputRatio: formatRatio(record.model_ratio),
        completionRatio: formatRatio(record.completion_ratio),
        cacheRatio: formatRatio(record.cache_ratio),
        createCacheRatio: formatRatio(record.create_cache_ratio),
        imageRatio: formatRatio(record.image_ratio),
        audioInputRatio: formatRatio(record.audio_ratio),
        audioOutputRatio: formatRatio(record.audio_completion_ratio),
        isPerToken: true,
        isTokensDisplay: true,
        usedGroup,
        usedGroupRatio,
      };
    }

    let symbol = '$';
    if (currency === 'CNY') {
      symbol = '¥';
    } else if (currency === 'CUSTOM') {
      try {
        const statusStr = localStorage.getItem('status');
        if (statusStr) {
          const s = JSON.parse(statusStr);
          symbol = s?.custom_currency_symbol || '¤';
        } else {
          symbol = '¤';
        }
      } catch (e) {
        symbol = '¤';
      }
    }

    const formatTokenPrice = (priceUSD) => {
      const rawDisplayPrice = displayPrice(priceUSD);
      const numericPrice =
        parseFloat(rawDisplayPrice.replace(/[^0-9.]/g, '')) / unitDivisor;
      return `${symbol}${numericPrice.toFixed(precision)}`;
    };

    const inputPrice = formatTokenPrice(inputRatioPriceUSD);
    const audioInputPrice = hasRatioValue(record.audio_ratio)
      ? formatTokenPrice(inputRatioPriceUSD * Number(record.audio_ratio))
      : null;

    return {
      inputPrice,
      completionPrice: formatTokenPrice(
        inputRatioPriceUSD * Number(record.completion_ratio),
      ),
      cachePrice: hasRatioValue(record.cache_ratio)
        ? formatTokenPrice(inputRatioPriceUSD * Number(record.cache_ratio))
        : null,
      createCachePrice: hasRatioValue(record.create_cache_ratio)
        ? formatTokenPrice(inputRatioPriceUSD * Number(record.create_cache_ratio))
        : null,
      imagePrice: hasRatioValue(record.image_ratio)
        ? formatTokenPrice(inputRatioPriceUSD * Number(record.image_ratio))
        : null,
      audioInputPrice,
      audioOutputPrice:
        audioInputPrice && hasRatioValue(record.audio_completion_ratio)
          ? formatTokenPrice(
              inputRatioPriceUSD *
                Number(record.audio_ratio) *
                Number(record.audio_completion_ratio),
            )
          : null,
      unitLabel,
      isPerToken: true,
      isTokensDisplay: false,
      usedGroup,
      usedGroupRatio,
    };
  }

  if (record.quota_type === 1) {
    // 
    const priceUSD = parseFloat(record.model_price) * usedGroupRatio;
    const displayVal = displayPrice(priceUSD);

    return {
      price: displayVal,
      isPerToken: false,
      isTokensDisplay: false,
      usedGroup,
      usedGroupRatio,
    };
  }

  // 
  return {
    price: '-',
    isPerToken: false,
    isTokensDisplay: false,
    usedGroup,
    usedGroupRatio,
  };
};

export const getModelPriceItems = (
  priceData,
  t,
  quotaDisplayType = 'USD',
) => {
  if (priceData.isDynamicPricing) {
    return [
      {
        key: 'dynamic',
        label: t(''),
        value: '',
        suffix: '',
        isDynamic: true,
      },
    ];
  }

  if (priceData.isPerToken) {
    if (quotaDisplayType === 'TOKENS' || priceData.isTokensDisplay) {
      return [
        {
          key: 'input-ratio',
          label: t(''),
          value: priceData.inputRatio,
          suffix: 'x',
        },
        {
          key: 'completion-ratio',
          label: t(''),
          value: priceData.completionRatio,
          suffix: 'x',
        },
        {
          key: 'cache-ratio',
          label: t(''),
          value: priceData.cacheRatio,
          suffix: 'x',
        },
        {
          key: 'create-cache-ratio',
          label: t(''),
          value: priceData.createCacheRatio,
          suffix: 'x',
        },
        {
          key: 'image-ratio',
          label: t(''),
          value: priceData.imageRatio,
          suffix: 'x',
        },
        {
          key: 'audio-input-ratio',
          label: t(''),
          value: priceData.audioInputRatio,
          suffix: 'x',
        },
        {
          key: 'audio-output-ratio',
          label: t(''),
          value: priceData.audioOutputRatio,
          suffix: 'x',
        },
      ].filter(
        (item) =>
          item.value !== null && item.value !== undefined && item.value !== '',
      );
    }

    const unitSuffix = ` / 1${priceData.unitLabel} Tokens`;
    return [
      {
        key: 'input',
        label: t(''),
        value: priceData.inputPrice,
        suffix: unitSuffix,
      },
      {
        key: 'completion',
        label: t(''),
        value: priceData.completionPrice,
        suffix: unitSuffix,
      },
      {
        key: 'cache',
        label: t(''),
        value: priceData.cachePrice,
        suffix: unitSuffix,
      },
      {
        key: 'create-cache',
        label: t(''),
        value: priceData.createCachePrice,
        suffix: unitSuffix,
      },
      {
        key: 'image',
        label: t(''),
        value: priceData.imagePrice,
        suffix: unitSuffix,
      },
      {
        key: 'audio-input',
        label: t(''),
        value: priceData.audioInputPrice,
        suffix: unitSuffix,
      },
      {
        key: 'audio-output',
        label: t(''),
        value: priceData.audioOutputPrice,
        suffix: unitSuffix,
      },
    ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
  }

  return [
    {
      key: 'fixed',
      label: t(''),
      value: priceData.price,
      suffix: ` / ${t('')}`,
    },
  ].filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
};

//  formatPriceInfo 
export const formatDynamicPriceSummary = (billingExpr, t, groupRatio = 1) => {
  if (!billingExpr) return <span style={{ color: 'var(--semi-color-text-1)' }}>{t('')}</span>;

  const quotaDisplayType = localStorage.getItem('quota_display_type') || 'USD';
  let symbol = '$';
  let rate = 1;
  try {
    const s = JSON.parse(localStorage.getItem('status') || '{}');
    if (quotaDisplayType === 'CNY') {
      symbol = '¥';
      rate = s?.usd_exchange_rate || 7;
    } else if (quotaDisplayType === 'CUSTOM') {
      symbol = s?.custom_currency_symbol || '¤';
      rate = s?.custom_currency_exchange_rate || 1;
    }
  } catch (e) {}

  const gr = groupRatio || 1;
  const exprBody = billingExpr.replace(/^v\d+:/, '');
  const tierMatches = exprBody.match(/tier\(/g) || [];
  const tierCount = tierMatches.length;

  const varCoeffs = {};
  const varRe = new RegExp(BILLING_VAR_REGEX.source, 'g');
  let vm;
  while ((vm = varRe.exec(exprBody)) !== null) {
    if (!(vm[1] in varCoeffs)) varCoeffs[vm[1]] = Number(vm[2]);
  }
  const hasCoeffs = 'p' in varCoeffs || 'c' in varCoeffs;

  const varLabels = BILLING_PRICING_VARS.map((v) => [v.key, v.label]);

  const hasTimeCondition = /\b(?:hour|minute|weekday|month|day)\(/.test(exprBody);
  const hasRequestCondition = /\b(?:param|header)\(/.test(exprBody);

  const tags = [];
  if (tierCount > 1) tags.push(`${tierCount}${t('')}`);
  if (hasTimeCondition) tags.push(t(''));
  if (hasRequestCondition) tags.push(t(''));

  const unitSuffix = ' / 1M Tokens';
  const lineStyle = { color: 'var(--semi-color-text-1)' };

  return (
    <>
      {hasCoeffs && (
        <>
          {varLabels.map(([key, label]) =>
            key in varCoeffs ? (
              <span key={key} style={lineStyle}>
                {`${t(label)} ${symbol}${(varCoeffs[key] * gr * rate).toFixed(4)}${unitSuffix}`}
              </span>
            ) : null,
          )}
        </>
      )}
      {(tierCount > 1 || hasTimeCondition || hasRequestCondition) && (
      <span style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: 11,
            background: 'var(--semi-color-warning-light-default)',
            color: 'var(--semi-color-warning)',
          }}
        >
          {t('')}
        </span>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-block',
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: 11,
              background: 'var(--semi-color-fill-1)',
              color: 'var(--semi-color-text-2)',
            }}
          >
            {tag}
          </span>
        ))}
      </span>
      )}
    </>
  );
};

// 
export const formatPriceInfo = (priceData, t, quotaDisplayType = 'USD') => {
  const items = getModelPriceItems(priceData, t, quotaDisplayType);
  return (
    <>
      {items.map((item) => (
        <span key={item.key} style={{ color: 'var(--semi-color-text-1)' }}>
          {item.label} {item.value}
          {item.suffix}
        </span>
      ))}
    </>
  );
};

// -------------------------------
// CardPro 
//  CardPro  paginationArea 
export const createCardProPagination = ({
  currentPage,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  isMobile = false,
  pageSizeOpts = [10, 20, 50, 100],
  showSizeChanger = true,
  t = (key) => key,
}) => {
  if (!total || total <= 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const totalText = `${t('')} ${start} ${t(' - ')} ${end} ${t('')} ${total} ${t('')}`;

  return (
    <>
      {/*  */}
      {!isMobile && (
        <span
          className='text-sm select-none'
          style={{ color: 'var(--semi-color-text-2)' }}
        >
          {totalText}
        </span>
      )}

      {/*  */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        pageSizeOpts={pageSizeOpts}
        showSizeChanger={showSizeChanger}
        onPageSizeChange={onPageSizeChange}
        onPageChange={onPageChange}
        size={isMobile ? 'small' : 'default'}
        showQuickJumper={isMobile}
        showTotal
      />
    </>
  );
};

// 
const DEFAULT_PRICING_FILTERS = {
  search: '',
  showWithRecharge: false,
  currency: 'USD',
  showRatio: false,
  viewMode: 'card',
  tokenUnit: 'M',
  filterGroup: 'all',
  filterQuotaType: 'all',
  filterEndpointType: 'all',
  filterVendor: 'all',
  filterTag: 'all',
  currentPage: 1,
};

// 
export const resetPricingFilters = ({
  handleChange,
  setShowWithRecharge,
  setCurrency,
  setShowRatio,
  setViewMode,
  setFilterGroup,
  setFilterQuotaType,
  setFilterEndpointType,
  setFilterVendor,
  setFilterTag,
  setCurrentPage,
  setTokenUnit,
}) => {
  handleChange?.(DEFAULT_PRICING_FILTERS.search);
  setShowWithRecharge?.(DEFAULT_PRICING_FILTERS.showWithRecharge);
  setCurrency?.(DEFAULT_PRICING_FILTERS.currency);
  setShowRatio?.(DEFAULT_PRICING_FILTERS.showRatio);
  setViewMode?.(DEFAULT_PRICING_FILTERS.viewMode);
  setTokenUnit?.(DEFAULT_PRICING_FILTERS.tokenUnit);
  setFilterGroup?.(DEFAULT_PRICING_FILTERS.filterGroup);
  setFilterQuotaType?.(DEFAULT_PRICING_FILTERS.filterQuotaType);
  setFilterEndpointType?.(DEFAULT_PRICING_FILTERS.filterEndpointType);
  setFilterVendor?.(DEFAULT_PRICING_FILTERS.filterVendor);
  setFilterTag?.(DEFAULT_PRICING_FILTERS.filterTag);
  setCurrentPage?.(DEFAULT_PRICING_FILTERS.currentPage);
};

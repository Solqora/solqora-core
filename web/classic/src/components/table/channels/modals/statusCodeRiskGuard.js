const NON_REDIRECTABLE_STATUS_CODES = new Set([504, 524]);

export const STATUS_CODE_RISK_I18N_KEYS = {
  title: '',
  detailTitle: '',
  inputPrompt: '',
  confirmButton: '',
  markdown: 'Markdown',
  confirmText: '',
  inputPlaceholder: '',
  mismatchText: '',
};

export const STATUS_CODE_RISK_CHECKLIST_KEYS = [
  '1',
  '2',
  '3',
  '4',
];

function parseStatusCodeKey(rawKey) {
  if (typeof rawKey !== 'string') {
    return null;
  }
  const normalized = rawKey.trim();
  if (!/^[1-5]\d{2}$/.test(normalized)) {
    return null;
  }
  return Number.parseInt(normalized, 10);
}

function parseStatusCodeMappingTarget(rawValue) {
  if (typeof rawValue === 'number' && Number.isInteger(rawValue)) {
    return rawValue >= 100 && rawValue <= 599 ? rawValue : null;
  }
  if (typeof rawValue === 'string') {
    const normalized = rawValue.trim();
    if (!/^[1-5]\d{2}$/.test(normalized)) {
      return null;
    }
    const code = Number.parseInt(normalized, 10);
    return code >= 100 && code <= 599 ? code : null;
  }
  return null;
}

export function collectInvalidStatusCodeEntries(statusCodeMappingStr) {
  if (
    typeof statusCodeMappingStr !== 'string' ||
    statusCodeMappingStr.trim() === ''
  ) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(statusCodeMappingStr);
  } catch {
    return [];
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }

  const invalid = [];
  for (const [rawKey, rawValue] of Object.entries(parsed)) {
    const fromCode = parseStatusCodeKey(rawKey);
    const toCode = parseStatusCodeMappingTarget(rawValue);
    if (fromCode === null || toCode === null) {
      invalid.push(`${rawKey} → ${rawValue}`);
    }
  }

  return invalid;
}

export function collectDisallowedStatusCodeRedirects(statusCodeMappingStr) {
  if (
    typeof statusCodeMappingStr !== 'string' ||
    statusCodeMappingStr.trim() === ''
  ) {
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(statusCodeMappingStr);
  } catch (error) {
    return [];
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return [];
  }

  const riskyMappings = [];
  Object.entries(parsed).forEach(([rawFrom, rawTo]) => {
    const fromCode = parseStatusCodeKey(rawFrom);
    const toCode = parseStatusCodeMappingTarget(rawTo);
    if (fromCode === null || toCode === null) {
      return;
    }
    if (!NON_REDIRECTABLE_STATUS_CODES.has(fromCode)) {
      return;
    }
    if (fromCode === toCode) {
      return;
    }
    riskyMappings.push(`${fromCode} -> ${toCode}`);
  });

  return Array.from(new Set(riskyMappings)).sort();
}

export function collectNewDisallowedStatusCodeRedirects(
  originalStatusCodeMappingStr,
  currentStatusCodeMappingStr,
) {
  const currentRisky = collectDisallowedStatusCodeRedirects(
    currentStatusCodeMappingStr,
  );
  if (currentRisky.length === 0) {
    return [];
  }

  const originalRiskySet = new Set(
    collectDisallowedStatusCodeRedirects(originalStatusCodeMappingStr),
  );

  return currentRisky.filter((mapping) => !originalRiskySet.has(mapping));
}

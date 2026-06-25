export function formatSubscriptionDuration(plan, t) {
  const unit = plan?.duration_unit || 'month';
  const value = plan?.duration_value || 1;
  const unitLabels = {
    year: t(''),
    month: t(''),
    day: t(''),
    hour: t(''),
    custom: t(''),
  };
  if (unit === 'custom') {
    const seconds = plan?.custom_seconds || 0;
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} ${t('')}`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} ${t('')}`;
    return `${seconds} ${t('')}`;
  }
  return `${value} ${unitLabels[unit] || unit}`;
}

export function formatSubscriptionResetPeriod(plan, t) {
  const period = plan?.quota_reset_period || 'never';
  if (period === 'never') return t('');
  if (period === 'daily') return t('');
  if (period === 'weekly') return t('');
  if (period === 'monthly') return t('');
  if (period === 'custom') {
    const seconds = Number(plan?.quota_reset_custom_seconds || 0);
    if (seconds >= 86400) return `${Math.floor(seconds / 86400)} ${t('')}`;
    if (seconds >= 3600) return `${Math.floor(seconds / 3600)} ${t('')}`;
    if (seconds >= 60) return `${Math.floor(seconds / 60)} ${t('')}`;
    return `${seconds} ${t('')}`;
  }
  return t('');
}

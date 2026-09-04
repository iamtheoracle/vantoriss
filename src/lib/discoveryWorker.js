import { base44 } from '@/api/base44Client';

export async function refreshDiscoveryNews() {
  const response = await base44.functions.invoke('refreshDiscoveryNews', {});
  return response?.data || response || {};
}

export async function loadDiscoveryRunHistory(limit = 12) {
  return base44.entities.DiscoveryRun.filter(
    { run_type: 'news_monitoring' },
    '-started_at',
    limit
  ).catch(() => []);
}

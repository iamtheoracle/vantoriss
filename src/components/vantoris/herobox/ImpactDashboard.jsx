import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, Mail, Heart, Wifi, Clock, Building2, Award, TrendingUp, DollarSign, Globe, Target } from 'lucide-react';
import ImpactKpiCard from './ImpactKpiCard';
import CommunityGrowthChart from './CommunityGrowthChart';
import FundsDistributedChart from './FundsDistributedChart';
import SupportTrendsChart from './SupportTrendsChart';
import SponsorshipIntelligence from './SponsorshipIntelligence';

function getMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isThisMonth(date) {
  const d = new Date(date);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isLastMonth(date) {
  const d = new Date(date);
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
}

function computeChange(thisMonthCount, lastMonthCount) {
  if (lastMonthCount === 0) return thisMonthCount > 0 ? 100 : 0;
  return Math.round(((thisMonthCount - lastMonthCount) / lastMonthCount) * 100);
}

function getTrend(change) {
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'flat';
}

export default function ImpactDashboard({ profile, activities = [] }) {
  const { kpis, growthData, fundsData, trendsData, sponsorStats, sponsorActivity } = useMemo(() => {
    // Month-over-month activity counts
    const thisMonth = activities.filter(a => isThisMonth(a.created_date));
    const lastMonth = activities.filter(a => isLastMonth(a.created_date));

    const thisMonthByType = {};
    const lastMonthByType = {};
    thisMonth.forEach(a => { thisMonthByType[a.activity_type] = (thisMonthByType[a.activity_type] || 0) + 1; });
    lastMonth.forEach(a => { lastMonthByType[a.activity_type] = (lastMonthByType[a.activity_type] || 0) + 1; });

    const totalContribution = profile?.total_contribution || 0;
    const thisMonthContribution = thisMonth.reduce((s, a) => s + (a.amount || 0), 0);
    const lastMonthContribution = lastMonth.reduce((s, a) => s + (a.amount || 0), 0);

    const kpiCards = [
      {
        icon: DollarSign, label: 'Total Community Support', value: `$${(totalContribution / 1000).toFixed(1)}k`,
        change: computeChange(thisMonthContribution, lastMonthContribution), trend: getTrend(computeChange(thisMonthContribution, lastMonthContribution)),
        color: 'text-brass', bg: 'bg-brass/12',
      },
      {
        icon: Package, label: 'Packages Delivered', value: profile?.packages_delivered || 0,
        change: computeChange(thisMonthByType.package_delivered || 0, lastMonthByType.package_delivered || 0),
        trend: getTrend(computeChange(thisMonthByType.package_delivered || 0, lastMonthByType.package_delivered || 0)),
        color: 'text-mint', bg: 'bg-mint/12',
      },
      {
        icon: Users, label: 'Heroes Supported', value: profile?.heroes_supported || 0,
        change: computeChange(thisMonth.length, lastMonth.length), trend: getTrend(computeChange(thisMonth.length, lastMonth.length)),
        color: 'text-champagne', bg: 'bg-champagne/12',
      },
      {
        icon: Heart, label: 'Families Supported', value: profile?.families_assisted || 0,
        change: computeChange(thisMonthByType.sponsored || 0, lastMonthByType.sponsored || 0),
        trend: getTrend(computeChange(thisMonthByType.sponsored || 0, lastMonthByType.sponsored || 0)),
        color: 'text-crimson', bg: 'bg-crimson/10',
      },
      {
        icon: Mail, label: 'Letters Sent', value: profile?.letters_sent || 0,
        change: computeChange(thisMonthByType.letter_received || 0, lastMonthByType.letter_received || 0),
        trend: getTrend(computeChange(thisMonthByType.letter_received || 0, lastMonthByType.letter_received || 0)),
        color: 'text-champagne', bg: 'bg-champagne/12',
      },
      {
        icon: Wifi, label: 'Internet Sponsorships', value: profile?.internet_sponsorships || 0,
        change: computeChange(thisMonthByType.internet_sponsored || 0, lastMonthByType.internet_sponsored || 0),
        trend: getTrend(computeChange(thisMonthByType.internet_sponsored || 0, lastMonthByType.internet_sponsored || 0)),
        color: 'text-champagne', bg: 'bg-champagne/12',
      },
      {
        icon: Clock, label: 'Volunteer Hours', value: profile?.volunteer_hours || 0,
        change: computeChange(thisMonthByType.volunteer_hours || 0, lastMonthByType.volunteer_hours || 0),
        trend: getTrend(computeChange(thisMonthByType.volunteer_hours || 0, lastMonthByType.volunteer_hours || 0)),
        color: 'text-gray', bg: 'bg-slate-100',
      },
      {
        icon: Building2, label: 'Organizations', value: profile?.organizations_supported || 0,
        change: 0, trend: 'flat', color: 'text-navy', bg: 'bg-navy/8',
      },
      {
        icon: Award, label: 'Impact Score', value: Math.round((profile?.total_contribution || 0) / 100 + (profile?.packages_delivered || 0) * 5 + (profile?.volunteer_hours || 0) * 2),
        change: computeChange(thisMonth.length, lastMonth.length), trend: getTrend(computeChange(thisMonth.length, lastMonth.length)),
        color: 'text-brass', bg: 'bg-brass/12',
      },
    ];

    // Build 6-month growth data from activities
    const monthlyMap = {};
    activities.forEach(a => {
      const mk = getMonthKey(a.created_date);
      if (!monthlyMap[mk]) monthlyMap[mk] = { label: mk, cumulative: 0, weekly: 0, sponsors: 0, average: 0, count: 0 };
      monthlyMap[mk].count++;
      monthlyMap[mk].cumulative += 1;
      if (a.activity_type === 'sponsored') monthlyMap[mk].sponsors += 1;
      if (a.amount) monthlyMap[mk].weekly += a.amount;
    });
    const growthArr = Object.values(monthlyMap).sort((a, b) => a.label.localeCompare(b.label)).slice(-6);
    let cumul = 0;
    growthArr.forEach((d, i) => {
      cumul += d.count;
      d.cumulative = cumul;
      d.weekly = d.count;
      d.sponsors = d.sponsors;
      d.average = i > 0 ? Math.round(growthArr.slice(0, i + 1).reduce((s, x) => s + x.count, 0) / (i + 1)) : d.count;
      const [y, m] = d.label.split('-');
      d.label = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    });

    // Funds distributed data
    const fundsArr = growthArr.map((d, i) => ({
      label: d.label,
      Mission: Math.round(d.weekly * 0.4),
      Community: Math.round(d.weekly * 0.3),
      Campaign: Math.round(d.weekly * 0.2),
      Package: Math.round(d.weekly * 0.1),
    }));

    // Trends data
    const trendsArr = growthArr.map(d => ({
      label: d.label,
      requests: Math.round(d.count * 0.8),
      completed: Math.round(d.count * 0.6),
      pending: Math.round(d.count * 0.2),
      volunteer: Math.round(d.count * 0.3),
      sponsor: d.sponsors,
      packages: Math.round(d.count * 0.4),
    }));

    // Sponsor stats
    const sponsorStats = {
      new_sponsors: thisMonthByType.sponsored || Math.max(1, Math.round((profile?.heroes_supported || 0) * 0.1)),
      returning: Math.max(0, (profile?.heroes_supported || 0) - Math.round((profile?.heroes_supported || 0) * 0.1)),
      avg_contribution: lastMonthContribution > 0 ? Math.round((thisMonthContribution + lastMonthContribution) / 2) : Math.round(totalContribution / Math.max(1, profile?.heroes_supported || 1)),
      retention: 78,
    };

    const sponsorActivity = growthArr.map(d => ({ label: d.label, value: d.sponsors }));

    return { kpis: kpiCards, growthData: growthArr, fundsData: fundsArr, trendsData: trendsArr, sponsorStats, sponsorActivity };
  }, [profile, activities]);

  if (!profile) {
    return (
      <div className="vantoris-glass-premium p-8 text-center mb-5">
        <Target size={32} className="text-gray mx-auto mb-3" />
        <p className="text-gray text-sm">Activate your HeroBox profile to view impact analytics</p>
      </div>
    );
  }

  return (
    <div className="mb-5 space-y-4">
      {/* Executive Summary */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-foreground font-bold text-sm flex items-center gap-2">
            <TrendingUp size={15} className="text-brass" /> Executive Summary
          </h3>
          <span className="text-gray text-[11px]">Mission Analytics</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {kpis.map((kpi, idx) => (
            <ImpactKpiCard key={kpi.label} {...kpi} delay={idx * 0.05} />
          ))}
        </div>
      </div>

      {/* Community Growth Chart */}
      <CommunityGrowthChart data={growthData} />

      {/* Funds Distributed */}
      <FundsDistributedChart data={fundsData} period="monthly" breakdown="Mission" />

      {/* Support Trends */}
      <SupportTrendsChart data={trendsData} />

      {/* Sponsorship Intelligence */}
      <SponsorshipIntelligence stats={sponsorStats} monthlyActivity={sponsorActivity} />
    </div>
  );
}
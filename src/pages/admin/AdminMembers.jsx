import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/formatCurrency';
import { Users, Search } from 'lucide-react';

export default function AdminMembers() {
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const [u, a] = await Promise.all([
        base44.entities.User.list('-created_date', 50),
        base44.entities.Account.list('-created_date', 50),
      ]);
      setUsers(u);
      setAccounts(a);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
    </div>;
  }

  const members = users.filter(u => u.role !== 'admin');
  const filtered = members.filter(m =>
    (m.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Members</h1>
      <p className="text-[#AAB4C3] text-sm mb-6">{members.length} registered members</p>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full bg-[#242D38] border border-[#242D38] rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-brass/50 focus:outline-none"
        />
      </div>

      <div className="vantoris-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#242D38] bg-[#1a2535]">
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Member</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Email</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Accounts</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Total Balance</th>
              <th className="text-left text-[#AAB4C3] text-xs font-medium uppercase tracking-wider px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(member => {
              const memberAccts = accounts.filter(a => a.user_id === member.id);
              const totalBal = memberAccts.reduce((sum, a) => sum + (a.balance || 0), 0);
              return (
                <tr key={member.id} className="border-b border-[#242D38]/40 hover:bg-[#242D38]/20 transition-all">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brass/15 flex items-center justify-center">
                        <span className="text-brass text-xs font-bold">{(member.full_name || 'U').charAt(0)}</span>
                      </div>
                      <p className="text-white font-medium">{member.full_name || '—'}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#AAB4C3]">{member.email}</td>
                  <td className="px-5 py-4 text-white">{memberAccts.length}</td>
                  <td className="px-5 py-4 text-white font-medium">{formatCurrency(totalBal)}</td>
                  <td className="px-5 py-4 text-[#AAB4C3] text-xs">
                    {new Date(member.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-[#AAB4C3]">No members found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Pin, Star, Archive, Trash2, MoreVertical, Home } from 'lucide-react';

export default function AIWorkspaceSidebar({ conversations = [], onSelect, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = conversations.filter(c =>
    (c.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#242D38] flex-shrink-0">
        <Link to="/advisor/home" className="flex items-center gap-2 mb-4 text-white hover:text-brass transition-all">
          <Home size={16} />
          <span className="text-xs font-semibold">Back to Home</span>
        </Link>
        <button className="w-full py-2.5 bg-brass text-[#0E1A2B] rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-brass/90 transition-all">
          <Plus size={14} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#242D38] flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AAB4C3]" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-[#242D38] border border-[#242D38] rounded-lg pl-9 pr-3 py-2 text-white text-xs focus:border-brass/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="text-[#AAB4C3]/40 mx-auto mb-2" />
            <p className="text-[#AAB4C3] text-xs">No conversations yet</p>
          </div>
        ) : (
          filtered.map((conv, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredId(idx)}
              onMouseLeave={() => setHoveredId(null)}
              className="group relative p-2 hover:bg-[#242D38] rounded-lg cursor-pointer transition-all"
              onClick={() => onSelect?.(idx)}
            >
              <p className="text-white text-sm font-medium truncate">{conv.title || 'Untitled'}</p>
              <p className="text-[#AAB4C3] text-xs truncate">{conv.preview || 'No messages'}</p>
              {hoveredId === idx && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-[#3a4450] rounded" title="Pin"><Pin size={12} /></button>
                  <button className="p-1 hover:bg-[#3a4450] rounded" title="Favorite"><Star size={12} /></button>
                  <button className="p-1 hover:bg-[#3a4450] rounded" title="More"><MoreVertical size={12} /></button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#242D38] space-y-2 flex-shrink-0 text-xs text-[#AAB4C3]">
        <button className="w-full text-left px-2 py-1.5 hover:bg-[#242D38] rounded transition-all">Settings</button>
        <p className="px-2 py-1">VANTORIS Guide v1.0</p>
      </div>
    </aside>
  );
}
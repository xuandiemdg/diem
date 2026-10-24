import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  SquarePen,
  Rocket,
  Radar,
  ExternalLink,
  MapPin,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectDashboard?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onSelectDashboard,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      iconColor: 'text-slate-600',
      href: '#',
      badge: null,
      isActive: false,
      isExternal: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        onSelectDashboard?.();
      },
    },
    {
      id: 'geotag',
      label: 'GeoTag Vị trí',
      icon: SquarePen,
      iconColor: 'text-slate-700',
      href: 'https://geotag-ai.ai.studio/',
      badge: 'Mới',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-300 font-semibold',
      isActive: false,
      isExternal: true,
    },
    {
      id: 'audit-maps',
      label: 'Audit Maps và đối thủ',
      icon: Rocket,
      iconColor: 'text-rose-500',
      href: 'https://audit-maps1.ai.studio/',
      badge: 'Hot',
      badgeClass: 'bg-emerald-50 text-emerald-600 border border-emerald-300 font-semibold',
      isActive: false,
      isExternal: true,
    },
    {
      id: 'local-rank-grid',
      label: 'Local Rank Grid',
      icon: Radar,
      iconColor: 'text-emerald-600',
      href: '#',
      badge: 'Đang mở',
      badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold',
      isActive: true,
      isExternal: false,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
      },
    },
  ];

  return (
    <aside
      className={`sticky top-0 left-0 z-30 h-screen bg-white text-slate-800 border-r border-slate-200 shadow-md flex flex-col transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-[76px]' : 'w-[250px] sm:w-[270px]'
      }`}
    >
      {/* Top Header: Logo & Collapse Button */}
      <div className="h-16 sm:h-20 px-3.5 sm:px-4 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
        {!collapsed ? (
          <a
            href="https://mapsngon.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 overflow-hidden py-1 group"
            title="Trang chủ MapsNgon.vn"
          >
            <img
              src="/mapsngon-logo-header-1024x246.png"
              alt="Maps Ngon Logo"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </a>
        ) : (
          <a
            href="https://mapsngon.vn/"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
            title="MapsNgon.vn"
          >
            <MapPin className="w-5 h-5 text-emerald-600" />
          </a>
        )}

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition cursor-pointer shrink-0"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 bg-white">
        <div>
          {/* Section Category Title: CÔNG CỤ SEO & MAPS */}
          {!collapsed ? (
            <div className="px-2 mb-2.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-wider text-slate-400">
              CÔNG CỤ SEO & MAPS
            </div>
          ) : (
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-3" />
          )}

          {/* Menu Items */}
          <nav className="space-y-1.5 sm:space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isSelected = item.isActive;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={item.onClick}
                  target={item.isExternal ? '_blank' : undefined}
                  rel={item.isExternal ? 'noopener noreferrer' : undefined}
                  className={`group relative flex items-center gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-[13px] sm:text-[14px] font-semibold transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Icon */}
                  <div
                    className={`shrink-0 transition-transform group-hover:scale-110 ${
                      isSelected ? 'text-emerald-600' : item.iconColor
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {/* Text Label & Badges (when not collapsed) */}
                  {!collapsed && (
                    <div className="flex-1 flex items-center justify-between gap-1.5 overflow-hidden">
                      <span className="truncate">{item.label}</span>

                      <div className="flex items-center gap-1 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-md border ${item.badgeClass}`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {item.isExternal && (
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Floating badge indicator in collapsed mode */}
                  {collapsed && item.badge && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  )}
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Sidebar Info (when expanded) */}
      {!collapsed && (
        <div className="p-3 sm:p-3.5 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/80">
          <div className="flex items-center justify-between text-slate-700 font-bold mb-0.5">
            <span className="text-[11px]">MapsNgon Ecosystem</span>
            <span className="text-[9px] text-emerald-700 font-extrabold bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Phát triển bởi <strong className="text-slate-700">Mr. Đình Diệm</strong> 0966666341
          </p>
        </div>
      )}
    </aside>
  );
};

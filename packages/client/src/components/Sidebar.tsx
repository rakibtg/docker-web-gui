import { useState, memo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  HiGlobeAlt,
  HiDatabase,
  HiChartPie,
  HiMenu,
  HiX,
  HiCog,
  HiInformationCircle,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { Tooltip } from "react-tooltip";
import { LuLayers3 } from "react-icons/lu";
import { FiBox } from "react-icons/fi";

import logo from "../assets/docker-web-gui-logo.png";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: HiChartPie,
  },
  {
    id: "containers",
    label: "Containers",
    icon: FiBox,
  },
  {
    id: "images",
    label: "Images",
    icon: LuLayers3,
  },
  {
    id: "networks",
    label: "Networks",
    icon: HiGlobeAlt,
  },
  {
    id: "volumes",
    label: "Volumes",
    icon: HiDatabase,
  },
];

const bottomItems: SidebarItem[] = [
  {
    id: "settings",
    label: "Settings",
    icon: HiCog,
  },
  {
    id: "about",
    label: "About",
    icon: HiInformationCircle,
  },
];

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get current page from location pathname
  const currentPage = location.pathname.slice(1) || "containers"; // Remove leading slash

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen(!isMobileOpen);
  }, [isMobileOpen]);

  // Handle navigation
  const handleNavigation = useCallback(
    (pageId: string) => {
      navigate(`/${pageId}`);
      setIsMobileOpen(false); // Close mobile menu when navigating
    },
    [navigate]
  );

  const SidebarContent = () => (
    <>
      <div className={`flex items-center p-4 ${isCollapsed ? "px-2" : ""}`}>
        <div
          className={`flex items-center transition-[justify-content] duration-300 ${
            isCollapsed ? "justify-center w-full" : "flex-1"
          }`}
        >
          <div className="w-10 h-10 flex-shrink-0 transition-transform duration-300 pt-1.5">
            <img src={logo} alt="Docker GUI Logo" />
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1 transition-opacity duration-300">
              <h1 className="text-sm font-bold text-theme-primary truncate ">
                Docker Web GUI
              </h1>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex p-2 rounded-lg transition-colors duration-200 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary ml-2 flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse button when sidebar is collapsed */}
      {isCollapsed && (
        <div className="px-2 pb-2">
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex w-full p-2 rounded-lg transition-colors duration-200 hover:bg-theme-tertiary text-theme-secondary hover:text-theme-primary justify-center"
            aria-label="Expand sidebar"
            data-tooltip-id="expand-tooltip"
            data-tooltip-content="Expand sidebar"
            data-tooltip-place="right"
          >
            <HiChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-2 pb-4">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const tooltipProps = isCollapsed
              ? {
                  "data-tooltip-id": "sidebar-tooltip",
                  "data-tooltip-content": item.label,
                  "data-tooltip-place": "right" as const,
                }
              : {};

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group cursor-pointer ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary"
                } ${isCollapsed ? "justify-center" : ""}`}
                {...tooltipProps}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 text-left">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className={`my-6 ${isCollapsed ? "mx-2" : "mx-3"}`}>
          <div className="h-px bg-theme-border"></div>
        </div>

        {/* Bottom Items */}
        <div className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            const tooltipProps = isCollapsed
              ? {
                  "data-tooltip-id": "sidebar-tooltip",
                  "data-tooltip-content": item.label,
                  "data-tooltip-place": "right" as const,
                }
              : {};

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary"
                } ${isCollapsed ? "justify-center" : ""}`}
                {...tooltipProps}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                    isActive ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 text-left">{item.label}</span>
                )}
                {isActive && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-theme-card border border-theme-border text-theme-primary shadow-lg hover:shadow-xl transition-shadow duration-200 hover:bg-theme-tertiary"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <HiX className="w-5 h-5" />
        ) : (
          <HiMenu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleMobile}
        />
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-theme-card border-r border-theme-border transition-[width] duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-40 w-64 bg-theme-card border-r border-theme-border transform transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          <SidebarContent />
        </div>
      </aside>

      {/* React Tooltip Components */}
      <Tooltip
        id="expand-tooltip"
        style={{
          backgroundColor: "rgb(17 24 39)",
          color: "rgb(243 244 246)",
          fontSize: "0.875rem",
          zIndex: 9999,
        }}
      />
      <Tooltip
        id="sidebar-tooltip"
        style={{
          backgroundColor: "rgb(17 24 39)",
          color: "rgb(243 244 246)",
          fontSize: "0.875rem",
          zIndex: 9999,
        }}
      />
    </>
  );
}

// Memoize the component to prevent unnecessary re-renders
export default memo(Sidebar);

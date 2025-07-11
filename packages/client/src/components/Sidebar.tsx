import { useState } from "react";
import {
  HiViewList,
  HiPhotograph,
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
import { Tooltip } from "./Tooltip";
import logo from "../assets/docker-web-gui-logo.png";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: HiChartPie,
    active: false,
  },
  {
    id: "containers",
    label: "Containers",
    icon: HiViewList,
    active: true,
  },
  {
    id: "images",
    label: "Images",
    icon: HiPhotograph,
    active: false,
  },
  {
    id: "networks",
    label: "Networks",
    icon: HiGlobeAlt,
    active: false,
  },
  {
    id: "volumes",
    label: "Volumes",
    icon: HiDatabase,
    active: false,
  },
];

const bottomItems: SidebarItem[] = [
  {
    id: "settings",
    label: "Settings",
    icon: HiCog,
    active: false,
  },
  {
    id: "about",
    label: "About",
    icon: HiInformationCircle,
    active: false,
  },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const SidebarContent = () => (
    <>
      <div className={`flex items-center p-4 ${isCollapsed ? "px-2" : ""}`}>
        <div
          className={`flex items-center transition-all duration-300 ${
            isCollapsed ? "justify-center w-full" : "flex-1"
          }`}
        >
          <div className="w-12 h-12 flex-shrink-0 transition-all duration-300 pt-2">
            <img src={logo} alt="Docker GUI Logo" />
          </div>
          {!isCollapsed && (
            <div className="ml-5 flex-1 transition-all duration-300">
              <h1 className="text-sm font-bold text-theme-primary">
                Docker Web GUI
              </h1>
            </div>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="hidden hover:bg-amber-400 lg:flex p-2 rounded-lg transition-all duration-200 text-theme-secondary ml-2 flex-shrink-0"
            aria-label="Collapse sidebar"
          >
            <HiChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Collapse button when sidebar is collapsed */}
      {isCollapsed && (
        <div className="px-2 pb-2">
          <Tooltip content="Expand sidebar" position="right" delay={200}>
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex w-full p-2 rounded-lg hover:bg-theme-tertiary transition-all duration-200 text-theme-secondary hover:text-theme-primary justify-center"
              aria-label="Expand sidebar"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 px-2 pb-4">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const buttonContent = (
              <button
                key={item.id}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  item.active
                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm"
                    : "text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary"
                } ${isCollapsed ? "justify-center" : ""}`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    item.active ? "text-blue-600 dark:text-blue-400" : ""
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 text-left">{item.label}</span>
                )}
                {item.active && !isCollapsed && (
                  <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                )}
              </button>
            );

            return isCollapsed ? (
              <Tooltip
                key={item.id}
                content={item.label}
                position="right"
                delay={200}
              >
                {buttonContent}
              </Tooltip>
            ) : (
              buttonContent
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
            const buttonContent = (
              <button
                key={item.id}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-theme-secondary hover:text-theme-primary hover:bg-theme-tertiary ${
                  isCollapsed ? "justify-center" : ""
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="ml-3 text-left">{item.label}</span>
                )}
              </button>
            );

            return isCollapsed ? (
              <Tooltip
                key={item.id}
                content={item.label}
                position="right"
                delay={200}
              >
                {buttonContent}
              </Tooltip>
            ) : (
              buttonContent
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
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-theme-card border border-theme-border text-theme-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-theme-tertiary"
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
        className={`hidden lg:flex flex-col bg-theme-card border-r border-theme-border transition-all duration-300 ${
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
    </>
  );
}

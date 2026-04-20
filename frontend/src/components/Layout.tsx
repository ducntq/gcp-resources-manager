import { NavLink, Outlet } from "react-router-dom";
import { ProjectSwitcher } from "./ProjectSwitcher";
import { clsx } from "clsx";
import { Cloud, Flame, FolderKey, Server } from "lucide-react";

const navItems = [
  { to: "/vms", label: "VM Instances", icon: Server },
  { to: "/firewalls", label: "Firewall Rules", icon: Flame },
  { to: "/projects", label: "Projects", icon: FolderKey },
];

export function Layout() {
  return (
    <div className="h-full flex flex-col">
      <header className="flex items-center justify-between px-4 h-12 border-b border-border bg-panel">
        <div className="flex items-center gap-2">
          <Cloud size={18} className="text-blue-400" />
          <span className="font-semibold text-sm">GCP Resources Manager</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400">Active project</span>
          <ProjectSwitcher />
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <nav className="w-52 border-r border-border bg-panel p-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-2 px-3 py-2 rounded text-sm",
                  isActive
                    ? "bg-blue-600/20 text-blue-200"
                    : "text-gray-300 hover:bg-[#1b1f26]",
                )
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

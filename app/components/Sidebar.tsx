import { CalendarDays, LayoutDashboard, History, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarLink = ({ href, icon, label, isActive, onClick }: SidebarLinkProps) => {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center space-x-2 px-4 py-3 rounded-md hover:bg-muted transition-colors",
        isActive ? "bg-muted font-medium" : ""
      )}
      onClick={onClick}
    >
      <div className="flex items-center">
        {icon}
        <span className="ml-2">{label}</span>
      </div>
    </Link>
  );
};

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const handleNavigation = (path: string) => {
    setActiveTab(path);
  };

  return (
    <div className="w-full h-full">
      <Card className="h-full border-r rounded-none shadow-none pt-4">
        <div className="flex items-center justify-center mb-6 px-6">
          <div className="flex items-center">
            <CalendarDays className="h-8 w-8 text-primary mr-2" />
            <h2 className="text-xl font-semibold">Leave Management</h2>
          </div>
        </div>
        <div className="space-y-1 px-2">
          <SidebarLink
            href="/"
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Dashboard"
            isActive={activeTab === "/"}
            onClick={() => handleNavigation("/")}
          />
          <SidebarLink
            href="/history"
            icon={<History className="h-5 w-5" />}
            label="Leave History"
            isActive={activeTab === "/history"}
            onClick={() => handleNavigation("/history")}
          />
          <SidebarLink
            href="/settings"
            icon={<Settings className="h-5 w-5" />}
            label="Settings"
            isActive={activeTab === "/settings"}
            onClick={() => handleNavigation("/settings")}
          />
        </div>
      </Card>
    </div>
  );
} 
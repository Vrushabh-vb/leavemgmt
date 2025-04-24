"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import icons with no SSR
const ChevronDown = dynamic(() => import("lucide-react").then(mod => mod.ChevronDown), {
  ssr: false,
})

interface NavigationProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const router = useRouter()
  
  // Get the active tab name for display in mobile dropdown
  const getActiveTabName = () => {
    switch (activeTab) {
      case "dashboard":
        return "Dashboard"
      case "holidays":
        return "Holidays"
      case "restricted":
        return "RH Selection"
      case "optimizer":
        return "Leave Optimizer"
      case "history":
        return "Leave History"
      case "settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }
  
  const handleTabChange = (tab: string) => {
    // Update URL and state
    router.push(`/?tab=${tab}`)
    setActiveTab(tab)
  }

  return (
    <div className="border-b pb-2">
      {/* Mobile Navigation (Dropdown) */}
      <div className="md:hidden w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {getActiveTabName()}
              {typeof ChevronDown !== 'undefined' && <ChevronDown className="h-4 w-4 ml-2" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            <DropdownMenuItem onClick={() => handleTabChange("dashboard")}>Dashboard</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTabChange("holidays")}>Holidays</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTabChange("restricted")}>RH Selection</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTabChange("optimizer")}>Leave Optimizer</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTabChange("history")}>Leave History</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTabChange("settings")}>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop Navigation (Tabs) */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="restricted">RH Selection</TabsTrigger>
            <TabsTrigger value="optimizer">Leave Optimizer</TabsTrigger>
            <TabsTrigger value="history">Leave History</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  )
}

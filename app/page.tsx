"use client"

import { useState, useEffect } from "react"
import { LeaveProvider } from "./context/LeaveContext"
import Dashboard from "./components/Dashboard"
import HolidayList from "./components/HolidayList"
import LeaveHistory from "./components/LeaveHistory"
import RestrictedHolidaySelector from "./components/RestrictedHolidaySelector"
import LeaveOptimizer from "./components/LeaveOptimizer"
import JoiningMonthSelector from "./components/JoiningMonthSelector"
import Navigation from "./components/Navigation"
import { useLeave } from "./context/LeaveContext"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import Heart icon with no SSR to avoid hydration mismatch
const Heart = dynamic(() => import("lucide-react").then(mod => mod.Heart), {
  ssr: false,
})

// This component will check if joining month is set and redirect to settings if not
function AppContent() {
  const { joiningMonth } = useLeave()
  const [activeTab, setActiveTab] = useState("dashboard")
  const searchParams = useSearchParams()
  // Track if the component is mounted to avoid hydration errors
  const [isMounted, setIsMounted] = useState(false)
  
  // Set mounted state after component mounts
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  // Check URL parameters for tab
  useEffect(() => {
    if (!isMounted) return // Skip during SSR
    
    const tab = searchParams.get('tab')
    if (tab && ['dashboard', 'holidays', 'restricted', 'optimizer', 'history', 'settings'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams, isMounted])
  
  // If joining month is not set, redirect to settings
  useEffect(() => {
    if (!isMounted) return // Skip during SSR
    
    if (joiningMonth === -1) {
      setActiveTab("settings")
    }
  }, [joiningMonth, isMounted])

  // Don't render content until client-side hydration is complete
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">LMS</h1>
          {typeof Heart !== 'undefined' && <Heart className="h-8 w-8 mx-1 text-red-500" />}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="mt-6">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "holidays" && <HolidayList />}
          {activeTab === "restricted" && <RestrictedHolidaySelector />}
          {activeTab === "optimizer" && <LeaveOptimizer />}
          {activeTab === "history" && <LeaveHistory />}
          {activeTab === "settings" && <JoiningMonthSelector />}
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <LeaveProvider>
      <AppContent />
    </LeaveProvider>
  )
}

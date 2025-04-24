"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { format, differenceInCalendarDays, isWeekend, parseISO, getMonth, getYear } from "date-fns"
import type { Holiday, LeaveRequest, LeaveBalance, RestrictedHoliday } from "../types"
import { HOLIDAYS, RESTRICTED_HOLIDAYS } from "../data/holidays"

// Add status type to LeaveRequest
type LeaveStatus = "Pending" | "Confirmed" | "Rejected" | "Approved" | "Deleted"

// Extend LeaveRequest type with status
interface ExtendedLeaveRequest extends Omit<LeaveRequest, 'status'> {
  status: LeaveStatus;
  isPending?: boolean; // For filtering pending leaves that need confirmation
}

interface LeaveContextType {
  holidays: Holiday[]
  restrictedHolidays: RestrictedHoliday[]
  leaveBalance: LeaveBalance
  leaveRequests: ExtendedLeaveRequest[]
  pendingLeaves: ExtendedLeaveRequest[]
  selectedRH: string[]
  joiningMonth: number
  setJoiningMonth: (month: number) => void 
  calculateProRatedLeaves: () => void
  requestLeave: (request: Omit<LeaveRequest, "id" | "status" | "requestDate">) => boolean
  addPlannedLeave: (request: Omit<LeaveRequest, "id" | "status" | "requestDate">) => boolean
  confirmLeave: (id: string) => void
  deleteLeave: (id: string) => void
  selectRestrictedHoliday: (date: string) => boolean
  unselectRestrictedHoliday: (date: string) => void
  resetAllData: () => void
  addUsedLeaves: (pl: number, cl: number, rh: number) => void
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined)

// Helper function to safely access localStorage
const getLocalStorage = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export function LeaveProvider({ children }: { children: ReactNode }) {
  // Initialize state with localStorage data or defaults
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>(() => 
    getLocalStorage("leaveBalance", { pl: 24, cl: 8, rh: 2 })
  )

  const [leaveRequests, setLeaveRequests] = useState<ExtendedLeaveRequest[]>(() => 
    getLocalStorage("leaveRequests", [])
  )

  const [selectedRH, setSelectedRH] = useState<string[]>(() => 
    getLocalStorage("selectedRH", [])
  )
  
  const [joiningMonth, setJoiningMonth] = useState<number>(() => 
    getLocalStorage("joiningMonth", -1) // -1 means not set, -99 means existing employee
  )
  
  // Computed property for pending leaves
  const pendingLeaves = leaveRequests.filter(leave => leave.isPending);

  // Calculate pro-rated leaves based on joining month
  const calculateProRatedLeaves = () => {
    // For existing employees, set full entitlement
    if (joiningMonth === -99) {
      setLeaveBalance(prev => ({
        ...prev,
        pl: 24,
        cl: 8,
        rh: 2
      }));
      return;
    }
    
    // For new joiners
    if (joiningMonth < 0 || joiningMonth > 11) return;
    
    const currentMonth = getMonth(new Date());
    const currentYear = getYear(new Date());
    
    // If we're in a new year, reset the leaves
    const lastCalculationYear = getLocalStorage("lastCalculationYear", currentYear - 1);
    if (currentYear > lastCalculationYear) {
      // For a full year
      if (typeof window !== 'undefined') {
        localStorage.setItem("lastCalculationYear", JSON.stringify(currentYear));
      }
      
      // Calculate eligible months - months after joining
      // Example: If joining in March (index 2), eligible months are April to December (12-3 = 9 months)
      const eligibleMonths = 12 - (joiningMonth + 1);
      
      // Prorate PL: 2 days per month for eligible months
      const plDays = eligibleMonths * 2;
      
      // Prorate CL: 8 days per year proportional to eligible months
      const clDays = Math.floor(eligibleMonths * (8 / 12));
      
      // RH remains fixed at 2
      setLeaveBalance(prev => ({
        ...prev,
        pl: plDays,
        cl: clDays,
        rh: 2
      }));
    }
  }
  
  // Function to add used leaves (for existing employees)
  const addUsedLeaves = (pl: number, cl: number, rh: number) => {
    setLeaveBalance(prev => ({
      pl: Math.max(0, prev.pl - pl),
      cl: Math.max(0, prev.cl - cl),
      rh: Math.max(0, prev.rh - rh),
    }));
  };
  
  // Reset all data function
  const resetAllData = () => {
    setLeaveBalance({ pl: 24, cl: 8, rh: 2 });
    setLeaveRequests([]);
    setSelectedRH([]);
    setJoiningMonth(-1);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem("leaveBalance");
      localStorage.removeItem("leaveRequests");
      localStorage.removeItem("selectedRH");
      localStorage.removeItem("joiningMonth");
      localStorage.removeItem("lastCalculationYear");
    }
  };
  
  // Run leave calculation on initial load and when joining month changes
  useEffect(() => {
    if (joiningMonth >= 0 || joiningMonth === -99) {
      calculateProRatedLeaves();
    }
  }, [joiningMonth]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("leaveBalance", JSON.stringify(leaveBalance))
    }
  }, [leaveBalance])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("leaveRequests", JSON.stringify(leaveRequests))
    }
  }, [leaveRequests])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("selectedRH", JSON.stringify(selectedRH))
    }
  }, [selectedRH])
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("joiningMonth", JSON.stringify(joiningMonth))
    }
  }, [joiningMonth])

  // Function to calculate leave days based on type
  const calculateLeaveDays = (startDate: string, endDate: string, type: string): number => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const daysDiff = differenceInCalendarDays(end, start) + 1
    
    // Check if the leave exceeds 15 consecutive days
    if (daysDiff > 15) {
      return -1; // Signal that leave duration is too long
    }

    // For PL, count all days including weekends
    if (type === "PL") {
      return daysDiff
    }

    // For CL and RH, don't count weekends
    let actualDays = 0
    let currentDate = start

    for (let i = 0; i < daysDiff; i++) {
      if (!isWeekend(currentDate)) {
        actualDays++
      }
      currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
    }

    return actualDays
  }

  // Function to request leave (auto-approved)
  const requestLeave = (request: Omit<LeaveRequest, "id" | "status" | "requestDate">): boolean => {
    const { type, startDate, endDate } = request
    const days = calculateLeaveDays(startDate, endDate, type)
    
    // Check if the leave exceeds maximum duration
    if (days === -1) {
      return false;
    }

    // Check if user has enough balance
    if (
      (type === "PL" && leaveBalance.pl < days) ||
      (type === "CL" && leaveBalance.cl < days) ||
      (type === "RH" && (leaveBalance.rh < 1 || days > 1))
    ) {
      return false
    }

    // For RH, check if the date is in selectedRH
    if (type === "RH" && !selectedRH.includes(startDate)) {
      return false
    }

    // Create new leave request
    const newRequest: ExtendedLeaveRequest = {
      id: Date.now().toString(),
      ...request,
      days,
      status: "Approved", // Auto-approve for this demo
      requestDate: format(new Date(), "yyyy-MM-dd"),
    }

    // Update leave balance
    setLeaveBalance((prev) => ({
      ...prev,
      [type.toLowerCase()]: prev[type.toLowerCase() as keyof LeaveBalance] - days,
    }))

    // Add to leave requests
    setLeaveRequests((prev) => [...prev, newRequest])

    return true
  }
  
  // Function to add planned leave (pending approval)
  const addPlannedLeave = (request: Omit<LeaveRequest, "id" | "status" | "requestDate">): boolean => {
    const { type, startDate, endDate, days } = request
    
    // Create new leave request with pending status
    const newRequest: ExtendedLeaveRequest = {
      id: Date.now().toString(),
      ...request,
      days: days || calculateLeaveDays(startDate, endDate, type),
      status: "Pending",
      isPending: true,
      requestDate: format(new Date(), "yyyy-MM-dd"),
    }

    // Add to leave requests without deducting leave balance yet
    setLeaveRequests((prev) => [...prev, newRequest])

    return true
  }
  
  // Function to confirm a pending leave
  const confirmLeave = (id: string) => {
    const leaveToConfirm = leaveRequests.find(leave => leave.id === id && leave.isPending);
    
    if (!leaveToConfirm) return;
    
    // Check if user has enough balance
    if (
      (leaveToConfirm.type === "PL" && leaveBalance.pl < leaveToConfirm.days) ||
      (leaveToConfirm.type === "CL" && leaveBalance.cl < leaveToConfirm.days) ||
      (leaveToConfirm.type === "RH" && leaveBalance.rh < 1)
    ) {
      // Update leave status to rejected if not enough balance
      setLeaveRequests(prev => 
        prev.map(leave => 
          leave.id === id 
            ? { ...leave, status: "Rejected", isPending: false } 
            : leave
        )
      );
      return;
    }
    
    // Update leave balance
    setLeaveBalance((prev) => ({
      ...prev,
      [leaveToConfirm.type.toLowerCase()]: 
        prev[leaveToConfirm.type.toLowerCase() as keyof LeaveBalance] - leaveToConfirm.days,
    }));
    
    // Update leave status to confirmed
    setLeaveRequests(prev => 
      prev.map(leave => 
        leave.id === id 
          ? { ...leave, status: "Confirmed", isPending: false } 
          : leave
      )
    );
  }
  
  // Function to delete a leave
  const deleteLeave = (id: string) => {
    // Remove from leave requests without refunding leave balance (only for pending)
    setLeaveRequests(prev => 
      prev.map(leave => 
        leave.id === id 
          ? { ...leave, status: "Deleted", isPending: false } 
          : leave
      )
    );
  }

  // Function to select a restricted holiday
  const selectRestrictedHoliday = (date: string): boolean => {
    if (selectedRH.length >= 2 || selectedRH.includes(date)) {
      return false
    }

    setSelectedRH((prev) => [...prev, date])
    return true
  }

  // Function to unselect a restricted holiday
  const unselectRestrictedHoliday = (date: string) => {
    // Find leave request with this RH date
    const hasUsedRH = leaveRequests.some(
      req => req.type === "RH" && req.startDate === date && req.status !== "Deleted"
    );
    
    // Only increase RH count if the RH wasn't used in a leave request
    if (!hasUsedRH) {
      setLeaveBalance((prev) => ({
        ...prev,
        rh: Math.min(prev.rh + 1, 2), // Ensure it never exceeds 2
      }));
    }
    
    setSelectedRH((prev) => prev.filter((d) => d !== date))
  }

  const value = {
    holidays: HOLIDAYS,
    restrictedHolidays: RESTRICTED_HOLIDAYS,
    leaveBalance,
    leaveRequests,
    pendingLeaves,
    selectedRH,
    joiningMonth,
    setJoiningMonth,
    calculateProRatedLeaves,
    requestLeave,
    addPlannedLeave,
    confirmLeave,
    deleteLeave,
    selectRestrictedHoliday,
    unselectRestrictedHoliday,
    resetAllData,
    addUsedLeaves,
  }

  return <LeaveContext.Provider value={value}>{children}</LeaveContext.Provider>
}

export function useLeave() {
  const context = useContext(LeaveContext)
  if (context === undefined) {
    throw new Error("useLeave must be used within a LeaveProvider")
  }
  return context
}

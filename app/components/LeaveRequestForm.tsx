"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useLeave } from "../context/LeaveContext"
import { isBefore, parseISO, differenceInCalendarDays, isWeekend, eachDayOfInterval } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { format as formatDate } from "date-fns"

export default function LeaveRequestForm() {
  const { leaveBalance, requestLeave, selectedRH } = useLeave()
  const [weekendWarning, setWeekendWarning] = useState<string | null>(null)

  // Calculate leave days based on leave type
  const calculateLeaveDays = (startDate: string, endDate: string, type: string): number => {
    const start = parseISO(startDate)
    const end = parseISO(endDate)
    const daysDiff = differenceInCalendarDays(end, start) + 1
    
    // For PL, count all days including weekends
    if (type === "PL") {
      return daysDiff
    }

    // For CL and RH, don't count weekends
    let actualDays = 0
    let currentDate = new Date(start)

    for (let i = 0; i < daysDiff; i++) {
      if (!isBefore(currentDate, start) && !(currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        actualDays++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return actualDays
  }

  const [formData, setFormData] = useState({
    type: "",
    startDate: "",
    endDate: "",
    reason: "",
    useCustomLeaveTypes: false,
    customLeaveTypes: {
      usePL: false,
      useCL: false,
      useRH: false
    },
    leavePriority: "cl-first" // Default priority: CL first, then PL
  })

  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  // Check if date range includes weekends
  const checkForWeekends = (startDate: string, endDate: string): string | null => {
    if (!startDate || !endDate) return null;
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    
    // Get all days in the range
    const dateRange = eachDayOfInterval({ start, end });
    
    // Filter for weekends
    const weekends = dateRange.filter(date => isWeekend(date));
    
    if (weekends.length > 0) {
      const weekendDates = weekends.map(date => formatDate(date, "dd MMM (EEEE)")).join(", ");
      return `Your selection includes ${weekends.length} weekend day(s): ${weekendDates}`;
    }
    
    return null;
  };
  
  // Update weekend warning when dates or leave type change
  useEffect(() => {
    // Only check for weekends if using PL (either standard or in custom)
    const isPLSelected = formData.type === "PL" || 
      (formData.useCustomLeaveTypes && formData.customLeaveTypes.usePL);
    
    if (isPLSelected && formData.startDate && formData.endDate) {
      const warning = checkForWeekends(formData.startDate, formData.endDate);
      setWeekendWarning(warning);
    } else {
      setWeekendWarning(null);
    }
  }, [formData.startDate, formData.endDate, formData.type, formData.useCustomLeaveTypes, formData.customLeaveTypes.usePL]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.type && !formData.useCustomLeaveTypes) {
      toast({
        title: "Validation Error",
        description: "Please select a leave type",
        variant: "destructive",
      })
      return
    }

    if (formData.useCustomLeaveTypes && 
        !formData.customLeaveTypes.usePL && 
        !formData.customLeaveTypes.useCL && 
        !formData.customLeaveTypes.useRH) {
      toast({
        title: "Validation Error",
        description: "Please select at least one leave type",
        variant: "destructive",
      })
      return
    }
    
    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Validation Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      })
      return
    }

    // Validate dates
    if (isBefore(parseISO(formData.endDate), parseISO(formData.startDate))) {
      toast({
        title: "Date Error",
        description: "End date cannot be before start date",
        variant: "destructive",
      })
      return
    }

    // For RH-only requests, start and end date should be the same
    if ((formData.type === "RH" || (formData.useCustomLeaveTypes && formData.customLeaveTypes.useRH && 
        !formData.customLeaveTypes.usePL && !formData.customLeaveTypes.useCL)) && 
        formData.startDate !== formData.endDate) {
      toast({
        title: "Restricted Holiday Error",
        description: "Restricted holidays can only be taken for a single day",
        variant: "destructive",
      })
      return
    }

    // For RH (either standard or custom), check if the date is in selectedRH
    if ((formData.type === "RH" || (formData.useCustomLeaveTypes && formData.customLeaveTypes.useRH)) && 
        !selectedRH.includes(formData.startDate)) {
      toast({
        title: "Restricted Holiday Error",
        description: "You can only request leave for your selected restricted holidays",
        variant: "destructive",
      })
      return
    }

    let success = false;
    
    if (formData.useCustomLeaveTypes) {
      // Handle custom leave type combinations
      let plDays = 0, clDays = 0, rhDays = 0;
      let totalDays = 0;
      
      // Calculate total days
      const start = parseISO(formData.startDate);
      const end = parseISO(formData.endDate);
      totalDays = differenceInCalendarDays(end, start) + 1;
      
      // Validate if the total days exceed 15
      if (totalDays > 15) {
        toast({
          title: "Leave Duration Error",
          description: "Leave duration cannot exceed 15 days",
          variant: "destructive",
        })
        return;
      }
      
      // Assign days based on selected leave types
      if (formData.customLeaveTypes.useRH && selectedRH.includes(formData.startDate)) {
        rhDays = 1; // RH is always 1 day
      }
      
      // Calculate remaining days after RH
      const remainingDays = totalDays - rhDays;
      
      if (remainingDays > 0) {
        if (formData.customLeaveTypes.useCL && formData.customLeaveTypes.usePL) {
          // Apply based on selected priority
          if (formData.leavePriority === "cl-first") {
            // Use CL first, then PL
            clDays = Math.min(remainingDays, leaveBalance.cl);
            plDays = remainingDays - clDays;
          } else if (formData.leavePriority === "pl-first") {
            // Use PL first, then CL
            plDays = Math.min(remainingDays, leaveBalance.pl);
            clDays = remainingDays - plDays;
          } else if (formData.leavePriority === "pl-only") {
            // Use only PL
            plDays = remainingDays;
            clDays = 0;
          } else if (formData.leavePriority === "cl-only") {
            // Use only CL
            clDays = remainingDays;
            plDays = 0;
          } else if (formData.leavePriority === "balanced") {
            // Balance between PL and CL
            const halfDays = Math.ceil(remainingDays / 2);
            clDays = Math.min(halfDays, leaveBalance.cl);
            plDays = remainingDays - clDays;
          }
        } else if (formData.customLeaveTypes.useCL) {
          clDays = remainingDays;
        } else if (formData.customLeaveTypes.usePL) {
          plDays = remainingDays;
        }
      }
      
      // Validate leave balances
      if (
        (formData.customLeaveTypes.usePL && leaveBalance.pl < plDays) ||
        (formData.customLeaveTypes.useCL && leaveBalance.cl < clDays) ||
        (formData.customLeaveTypes.useRH && leaveBalance.rh < rhDays)
      ) {
        toast({
          title: "Leave Balance Error",
          description: "You don't have enough leave balance",
          variant: "destructive",
        })
        return;
      }
      
      // Submit leave requests for each type
      let allSuccess = true;
      
      if (plDays > 0) {
        const plSuccess = requestLeave({
          type: "PL",
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason + " (Combined leave request - PL portion)",
          days: plDays,
        });
        allSuccess = allSuccess && plSuccess;
      }
      
      if (clDays > 0) {
        const clSuccess = requestLeave({
          type: "CL",
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: formData.reason + " (Combined leave request - CL portion)",
          days: clDays,
        });
        allSuccess = allSuccess && clSuccess;
      }
      
      if (rhDays > 0) {
        const rhSuccess = requestLeave({
          type: "RH",
          startDate: formData.startDate,
          endDate: formData.startDate, // RH is always 1 day
          reason: formData.reason + " (Combined leave request - RH portion)",
          days: rhDays,
        });
        allSuccess = allSuccess && rhSuccess;
      }
      
      success = allSuccess;
    } else {
      // Standard leave request
      success = requestLeave({
        type: formData.type as "PL" | "CL" | "RH",
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        days: calculateLeaveDays(formData.startDate, formData.endDate, formData.type),
      });
    }

    if (success) {
      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been approved",
      })

      // Reset form
      setFormData({
        type: "",
        startDate: "",
        endDate: "",
        reason: "",
        useCustomLeaveTypes: false,
        customLeaveTypes: {
          usePL: false,
          useCL: false,
          useRH: false
        },
        leavePriority: "cl-first"
      })
    } else {
      toast({
        title: "Leave Request Failed",
        description: "You don't have enough leave balance or invalid leave combination",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Request Leave</h2>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Leave Request Form</CardTitle>
            <CardDescription>Submit a new leave request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Leave Type Selection Mode */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Leave Type Selection:</label>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="standardLeave"
                    name="leaveTypeMode"
                    checked={!formData.useCustomLeaveTypes}
                    onChange={() => setFormData({...formData, useCustomLeaveTypes: false})}
                    className="rounded-full"
                  />
                  <label htmlFor="standardLeave" className="text-sm">Standard</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="customLeave"
                    name="leaveTypeMode"
                    checked={formData.useCustomLeaveTypes}
                    onChange={() => setFormData({...formData, useCustomLeaveTypes: true})}
                    className="rounded-full"
                  />
                  <label htmlFor="customLeave" className="text-sm">Custom Combination</label>
                </div>
              </div>
            </div>

            {/* Standard Leave Type Selector */}
            {!formData.useCustomLeaveTypes && (
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PL" disabled={leaveBalance.pl <= 0}>
                      Paid Leave (PL) - {leaveBalance.pl} days remaining
                    </SelectItem>
                    <SelectItem value="CL" disabled={leaveBalance.cl <= 0}>
                      Casual Leave (CL) - {leaveBalance.cl} days remaining
                    </SelectItem>
                    <SelectItem value="RH" disabled={leaveBalance.rh <= 0 || selectedRH.length === 0}>
                      Restricted Holiday (RH) - {leaveBalance.rh} selections remaining
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Leave Type Selector */}
            {formData.useCustomLeaveTypes && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                <label className="text-sm font-medium block mb-2">
                  Custom Leave Type Combination <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="usePL"
                      checked={formData.customLeaveTypes.usePL}
                      onChange={() => setFormData({
                        ...formData,
                        customLeaveTypes: {
                          ...formData.customLeaveTypes,
                          usePL: !formData.customLeaveTypes.usePL
                        }
                      })}
                      disabled={leaveBalance.pl <= 0}
                      className="rounded"
                    />
                    <label htmlFor="usePL" className="text-sm">
                      Use Paid Leave (PL) - {leaveBalance.pl} days remaining
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useCL"
                      checked={formData.customLeaveTypes.useCL}
                      onChange={() => setFormData({
                        ...formData,
                        customLeaveTypes: {
                          ...formData.customLeaveTypes,
                          useCL: !formData.customLeaveTypes.useCL
                        }
                      })}
                      disabled={leaveBalance.cl <= 0}
                      className="rounded"
                    />
                    <label htmlFor="useCL" className="text-sm">
                      Use Casual Leave (CL) - {leaveBalance.cl} days remaining
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useRH"
                      checked={formData.customLeaveTypes.useRH}
                      onChange={() => setFormData({
                        ...formData,
                        customLeaveTypes: {
                          ...formData.customLeaveTypes,
                          useRH: !formData.customLeaveTypes.useRH
                        }
                      })}
                      disabled={leaveBalance.rh <= 0 || selectedRH.length === 0}
                      className="rounded"
                    />
                    <label htmlFor="useRH" className="text-sm">
                      Use Restricted Holiday (RH) - {leaveBalance.rh} selections remaining
                    </label>
                  </div>
                </div>

                {formData.customLeaveTypes.usePL && formData.customLeaveTypes.useCL && (
                  <div className="mt-4 space-y-2">
                    <label className="text-sm font-medium block">Leave Priority:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="cl-first"
                          name="leavePriority"
                          checked={formData.leavePriority === "cl-first"}
                          onChange={() => setFormData({...formData, leavePriority: "cl-first"})}
                          className="rounded-full"
                        />
                        <label htmlFor="cl-first" className="text-sm">Use CL first, then PL</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pl-first"
                          name="leavePriority"
                          checked={formData.leavePriority === "pl-first"}
                          onChange={() => setFormData({...formData, leavePriority: "pl-first"})}
                          className="rounded-full"
                        />
                        <label htmlFor="pl-first" className="text-sm">Use PL first, then CL</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="pl-only"
                          name="leavePriority"
                          checked={formData.leavePriority === "pl-only"}
                          onChange={() => setFormData({...formData, leavePriority: "pl-only"})}
                          className="rounded-full"
                        />
                        <label htmlFor="pl-only" className="text-sm">Use only PL</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="cl-only"
                          name="leavePriority" 
                          checked={formData.leavePriority === "cl-only"}
                          onChange={() => setFormData({...formData, leavePriority: "cl-only"})}
                          className="rounded-full"
                        />
                        <label htmlFor="cl-only" className="text-sm">Use only CL</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="balanced"
                          name="leavePriority"
                          checked={formData.leavePriority === "balanced"}
                          onChange={() => setFormData({...formData, leavePriority: "balanced"})}
                          className="rounded-full"
                        />
                        <label htmlFor="balanced" className="text-sm">Balance between both</label>
                      </div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  {formData.customLeaveTypes.useRH ? "RH will be applied first if the start date matches your selected restricted holiday." : ""}
                </p>
              </div>
            )}

            {/* Weekend Warning */}
            {weekendWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium">Weekend Warning</p>
                    <p>{weekendWarning}</p>
                    <p className="mt-1">Please confirm you want to use Paid Leave for weekend days. Consider adjusting your dates to exclude weekends and save your PL balance.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Start Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startDate ? (
                      formatDate(parseISO(formData.startDate), "PPP")
                    ) : (
                      <span>Select start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startDate ? parseISO(formData.startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        const formattedDate = formatDate(date, "yyyy-MM-dd")
                        setFormData({ ...formData, startDate: formattedDate })
                        if (formData.type === "RH") {
                          setFormData((prev) => ({ ...prev, endDate: formattedDate }))
                        }
                        setStartDateOpen(false)
                      }
                    }}
                    disabled={(date) => {
                      // For RH, only allow selected RH dates
                      if (formData.type === "RH") {
                        return !selectedRH.includes(formatDate(date, "yyyy-MM-dd"))
                      }
                      return false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date - Disabled for RH */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                End Date <span className="text-red-500">*</span>
              </label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    disabled={formData.type === "RH"}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.endDate ? formatDate(parseISO(formData.endDate), "PPP") : <span>Select end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.endDate ? parseISO(formData.endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, endDate: formatDate(date, "yyyy-MM-dd") })
                        setEndDateOpen(false)
                      }
                    }}
                    disabled={(date) => {
                      // Disable dates before start date
                      return formData.startDate ? isBefore(date, parseISO(formData.startDate)) : false
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label htmlFor="reason" className="text-sm font-medium">
                Reason (Optional)
              </label>
              <Textarea
                id="reason"
                placeholder="Enter reason for leave"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="resize-none"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto">
              Submit Leave Request
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

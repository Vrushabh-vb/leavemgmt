"use client"

import { useState } from "react"
import { useLeave } from "../context/LeaveContext"
import { differenceInCalendarDays, addDays, isWeekend, parseISO, format, isBefore, eachDayOfInterval } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

type LeaveType = "PL" | "CL" | "RH"

interface DayInfo {
  date: string;
  isWeekend: boolean;
  isHoliday: boolean;
  isRH: boolean;
  isUsed: boolean;
  dayName: string;
}

interface LeaveSuggestion {
  title: string;
  days: number;
  leavesRequired: number;
  dates: string[];
  dayDetails: DayInfo[];  // Add day details
  leaveTypes: {
    usePL: boolean;
    useCL: boolean;
    useRH: boolean;
  };
  description: string;
  warnings: string[];  // Add warnings
}

export default function LeaveOptimizer() {
  const { holidays, leaveBalance, addPlannedLeave, leaveRequests, selectedRH } = useLeave()
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<LeaveSuggestion[]>([])
  
  // Add state for leave type selection
  const [selectedLeaveTypes, setSelectedLeaveTypes] = useState({
    usePL: true,
    useCL: true,
    useRH: true
  })
  
  // Add state for leave type priority
  const [leavePriority, setLeavePriority] = useState<string>("cl-first") // cl-first, pl-first, balanced
  
  // Get all dates that already have leave requests
  const getUsedDates = (): string[] => {
    const usedDates: string[] = [];
    
    leaveRequests.forEach(request => {
      if (request.status !== "Deleted") {
        // Get all dates between start and end date
        const start = parseISO(request.startDate);
        const end = parseISO(request.endDate);
        const dates = eachDayOfInterval({ start, end });
        
        // Add all dates to usedDates
        dates.forEach(date => {
          usedDates.push(format(date, "yyyy-MM-dd"));
        });
      }
    });
    
    return usedDates;
  };
  
  const usedDates = getUsedDates();

  const isHoliday = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd")
    return holidays.some(holiday => holiday.date === dateStr)
  }
  
  const isRestrictedHoliday = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd")
    return selectedRH.includes(dateStr)
  }
  
  const isUsedDate = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd")
    return usedDates.includes(dateStr)
  }

  // Get day details for a date range
  const getDayDetails = (startDate: Date, endDate: Date): DayInfo[] => {
    const dayDetails: DayInfo[] = [];
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1;
    
    let currentDate = new Date(startDate);
    
    for (let i = 0; i < totalDays; i++) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const dayName = format(currentDate, "EEEE"); // Monday, Tuesday, etc.
      
      dayDetails.push({
        date: dateStr,
        isWeekend: isWeekend(currentDate),
        isHoliday: isHoliday(currentDate),
        isRH: isRestrictedHoliday(currentDate),
        isUsed: isUsedDate(currentDate),
        dayName
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return dayDetails;
  };
  
  // Generate warnings based on day details and leave types
  const generateWarnings = (dayDetails: DayInfo[], leaveTypes: { usePL: boolean, useCL: boolean, useRH: boolean }): string[] => {
    const warnings: string[] = [];
    
    // Check for PL on weekends
    if (leaveTypes.usePL && !leaveTypes.useCL) {
      const weekends = dayDetails.filter(day => day.isWeekend);
      if (weekends.length > 0) {
        warnings.push(`This plan would use PL for ${weekends.length} weekend days (${weekends.map(d => format(parseISO(d.date), "dd MMM")).join(", ")}). Consider using CL instead to save your PL balance.`);
      }
    }
    
    // Check for unnecessary leave days
    const holidayDays = dayDetails.filter(day => day.isHoliday).map(d => format(parseISO(d.date), "dd MMM (EEEE)"));
    if (holidayDays.length > 0) {
      warnings.push(`The selected range includes ${holidayDays.length} holiday(s): ${holidayDays.join(", ")}. No leave is required for these days.`);
    }
    
    return warnings;
  };

  const generateSuggestions = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date Selection Required",
        description: "Please select both start and end dates",
        variant: "destructive",
      })
      return
    }

    if (isBefore(endDate, startDate)) {
      toast({
        title: "Invalid Date Range",
        description: "End date must be after start date",
        variant: "destructive",
      })
      return
    }
    
    // Check if any leave types are selected
    if (!selectedLeaveTypes.usePL && !selectedLeaveTypes.useCL && !selectedLeaveTypes.useRH) {
      toast({
        title: "Leave Type Required",
        description: "Please select at least one leave type",
        variant: "destructive",
      })
      return
    }

    const suggestionsArray: LeaveSuggestion[] = []
    
    const totalDays = differenceInCalendarDays(endDate, startDate) + 1
    
    // Get day details for the entire range
    const allDayDetails = getDayDetails(startDate, endDate);
    
    // Strategy 1: Minimum leaves (prioritize weekend and holidays)
    let minLeavesRequired = 0
    const minLeaveDates: string[] = []
    const minLeaveDayDetails: DayInfo[] = []
    
    allDayDetails.forEach(dayInfo => {
      if (!dayInfo.isWeekend && !dayInfo.isHoliday && !dayInfo.isUsed) {
        // For RH, only include if it's a selected RH day
        if (dayInfo.isRH && selectedLeaveTypes.useRH) {
          minLeaveDates.push(dayInfo.date);
          minLeaveDayDetails.push(dayInfo);
          minLeavesRequired++;
        } else if (!dayInfo.isRH && (selectedLeaveTypes.usePL || selectedLeaveTypes.useCL)) {
          minLeaveDates.push(dayInfo.date);
          minLeaveDayDetails.push(dayInfo);
          minLeavesRequired++;
        }
      } else {
        // Include in day details even if it's a weekend or holiday
        minLeaveDayDetails.push(dayInfo);
      }
    });
    
    const leaveTypeConfig = {
      usePL: selectedLeaveTypes.usePL,
      useCL: selectedLeaveTypes.useCL,
      useRH: selectedLeaveTypes.useRH
    };
    
    // Generate warnings for the minimum plan
    const minPlanWarnings = generateWarnings(minLeaveDayDetails, leaveTypeConfig);
    
    suggestionsArray.push({
      title: "Minimum Leave Plan",
      days: totalDays,
      leavesRequired: minLeavesRequired,
      dates: minLeaveDates,
      dayDetails: minLeaveDayDetails,
      leaveTypes: leaveTypeConfig,
      description: "This plan uses the minimum number of leave days by utilizing weekends and holidays.",
      warnings: minPlanWarnings
    });
    
    // Strategy 2: Extended weekend plan
    if (totalDays <= 9) {
      let extendedWeekendDates: string[] = []
      let extendedWeekendDayDetails: DayInfo[] = []
      let daysRequired = 0
      
      // Find the closest weekend
      let weekendStart = new Date(startDate)
      let daysToAdd = 0
      
      while (!isWeekend(weekendStart) && daysToAdd < 5) {
        daysToAdd++
        weekendStart = addDays(startDate, daysToAdd)
      }
      
      if (daysToAdd < 5) {
        // Found a weekend, build a plan around it
        const planStart = addDays(weekendStart, -2) // Start 2 days before the weekend
        const planEnd = addDays(weekendStart, 2) // End 2 days after the weekend
        
        // Get day details for the extended weekend
        const extendedDayDetails = getDayDetails(planStart, planEnd);
        
        extendedDayDetails.forEach(dayInfo => {
          extendedWeekendDayDetails.push(dayInfo);
          
          if (!dayInfo.isWeekend && !dayInfo.isHoliday && !dayInfo.isUsed) {
            if (dayInfo.isRH && selectedLeaveTypes.useRH) {
              extendedWeekendDates.push(dayInfo.date);
              daysRequired++;
            } else if (!dayInfo.isRH && (selectedLeaveTypes.usePL || selectedLeaveTypes.useCL)) {
              extendedWeekendDates.push(dayInfo.date);
              daysRequired++;
            }
          }
        });
        
        if (daysRequired > 0) {
          // Generate warnings for the extended weekend plan
          const extendedPlanWarnings = generateWarnings(extendedWeekendDayDetails, leaveTypeConfig);
          
          suggestionsArray.push({
            title: "Extended Weekend",
            days: differenceInCalendarDays(planEnd, planStart) + 1,
            leavesRequired: daysRequired,
            dates: extendedWeekendDates,
            dayDetails: extendedWeekendDayDetails,
            leaveTypes: leaveTypeConfig,
            description: "Take a longer break by extending a weekend.",
            warnings: extendedPlanWarnings
          });
        }
      }
    }
    
    // Strategy 3: Distributed leave plan (for longer periods)
    if (totalDays > 10) {
      const distributedDates: string[] = []
      const distributedDayDetails: DayInfo[] = [...allDayDetails]; // Include all days for context
      let maxLeaveBalance = 0;
      
      if (selectedLeaveTypes.usePL) maxLeaveBalance += leaveBalance.pl;
      if (selectedLeaveTypes.useCL) maxLeaveBalance += leaveBalance.cl;
      if (selectedLeaveTypes.useRH) maxLeaveBalance += leaveBalance.rh;
      
      let daysRequired = Math.min(Math.ceil(totalDays / 3), maxLeaveBalance)
      
      // Space out the leave days evenly
      const interval = Math.floor(totalDays / daysRequired)
      
      let daysAdded = 0
      let dayIndex = 0
      
      while (daysAdded < daysRequired && dayIndex < allDayDetails.length) {
        const dayInfo = allDayDetails[dayIndex];
        
        if (dayIndex % interval === 0 && !dayInfo.isWeekend && !dayInfo.isHoliday && !dayInfo.isUsed) {
          if (dayInfo.isRH && selectedLeaveTypes.useRH) {
            distributedDates.push(dayInfo.date);
            daysAdded++;
          } else if (!dayInfo.isRH && (selectedLeaveTypes.usePL || selectedLeaveTypes.useCL)) {
            distributedDates.push(dayInfo.date);
            daysAdded++;
          }
        }
        
        dayIndex++;
      }
      
      if (daysAdded > 0) {
        // Generate warnings for the distributed plan
        const distributedPlanWarnings = generateWarnings(distributedDayDetails, leaveTypeConfig);
        
        suggestionsArray.push({
          title: "Distributed Leave Plan",
          days: totalDays,
          leavesRequired: daysAdded,
          dates: distributedDates,
          dayDetails: distributedDayDetails,
          leaveTypes: leaveTypeConfig,
          description: "Spread your leaves throughout the period for regular breaks.",
          warnings: distributedPlanWarnings
        });
      }
    }
    
    setSuggestions(suggestionsArray)
  }

  const handleUsePlan = (suggestion: LeaveSuggestion) => {
    // Find the earliest and latest date in the dates array
    if (suggestion.dates.length === 0) {
      toast({
        title: "No Dates Selected",
        description: "This plan doesn't include any leave dates.",
        variant: "destructive",
      })
      return
    }
    
    const sortedDates = [...suggestion.dates].sort()
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]
    
    // Calculate days for each leave type based on priority
    let plDays = 0, clDays = 0, rhDays = 0;
    const totalDays = suggestion.leavesRequired;
    
    // Process RH days first (they're always specific dates)
    if (suggestion.leaveTypes.useRH) {
      // Count RH days that match the selected dates
      suggestion.dates.forEach(date => {
        if (selectedRH.includes(date) && leaveBalance.rh > 0) {
          rhDays++;
        }
      });
    }
    
    const remainingDays = totalDays - rhDays;
    
    // Assign remaining days based on priority
    if (remainingDays > 0) {
      if (suggestion.leaveTypes.useCL && suggestion.leaveTypes.usePL) {
        if (leavePriority === "cl-first") {
          // Use CL first, then PL
          clDays = Math.min(remainingDays, leaveBalance.cl);
          plDays = remainingDays - clDays;
        } else if (leavePriority === "pl-first") {
          // Use PL first, then CL
          plDays = Math.min(remainingDays, leaveBalance.pl);
          clDays = remainingDays - plDays;
        } else {
          // Balanced
          const halfDays = Math.ceil(remainingDays / 2);
          clDays = Math.min(halfDays, leaveBalance.cl);
          plDays = remainingDays - clDays;
        }
      } else if (suggestion.leaveTypes.useCL) {
        clDays = remainingDays;
      } else if (suggestion.leaveTypes.usePL) {
        plDays = remainingDays;
      }
    }
    
    // Check if user has enough leaves
    if (
      (plDays > 0 && leaveBalance.pl < plDays) ||
      (clDays > 0 && leaveBalance.cl < clDays) ||
      (rhDays > 0 && leaveBalance.rh < rhDays)
    ) {
      toast({
        title: "Insufficient Leave Balance",
        description: "You don't have enough leave balance for this plan.",
        variant: "destructive",
      })
      return
    }
    
    let success = true;
    const combinedMessage = `${suggestion.title}: ${suggestion.description}`;
    
    // Add leave requests for each type
    if (plDays > 0) {
      const plSuccess = addPlannedLeave({
        type: "PL",
        startDate,
        endDate,
        reason: combinedMessage + " (PL portion)",
        days: plDays,
      });
      success = success && plSuccess;
    }
    
    if (clDays > 0) {
      const clSuccess = addPlannedLeave({
        type: "CL",
        startDate,
        endDate,
        reason: combinedMessage + " (CL portion)",
        days: clDays,
      });
      success = success && clSuccess;
    }
    
    if (rhDays > 0) {
      // For RH, we need to find the exact RH dates
      const rhDates = suggestion.dates.filter(date => selectedRH.includes(date));
      if (rhDates.length > 0) {
        const rhSuccess = addPlannedLeave({
          type: "RH",
          startDate: rhDates[0],
          endDate: rhDates[0], // RH is always a single day
          reason: combinedMessage + " (RH portion)",
          days: 1,
        });
        success = success && rhSuccess;
      }
    }

    if (success) {
      toast({
        title: "Leave Plan Added to History",
        description: "Your leave plan has been added to Leave History. Go there to confirm or delete it.",
      })
    } else {
      toast({
        title: "Error Adding Leave Plan",
        description: "There was an error adding your leave plan.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Leave Optimizer</h2>
      <p className="text-muted-foreground">Plan your leaves efficiently by selecting a date range, and we'll suggest the best ways to optimize your leave balance.</p>
      
      <Card>
        <CardHeader>
          <CardTitle>Select Date Range</CardTitle>
          <CardDescription>Choose the period you're interested in taking leave</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date)
                      setStartDateOpen(false)
                    }}
                    disabled={(date) => isUsedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      setEndDateOpen(false)
                    }}
                    disabled={(date) => isUsedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Leave Type Selection */}
          <div className="space-y-3 p-3 bg-gray-50 rounded-md">
            <label className="text-sm font-medium block mb-2">
              Leave Types to Include
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="usePL"
                  checked={selectedLeaveTypes.usePL}
                  onCheckedChange={(checked) => setSelectedLeaveTypes(prev => ({...prev, usePL: !!checked}))}
                  disabled={leaveBalance.pl <= 0}
                />
                <label htmlFor="usePL" className="text-sm">
                  Use Paid Leave (PL) - {leaveBalance.pl} days remaining
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useCL"
                  checked={selectedLeaveTypes.useCL}
                  onCheckedChange={(checked) => setSelectedLeaveTypes(prev => ({...prev, useCL: !!checked}))}
                  disabled={leaveBalance.cl <= 0}
                />
                <label htmlFor="useCL" className="text-sm">
                  Use Casual Leave (CL) - {leaveBalance.cl} days remaining
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="useRH"
                  checked={selectedLeaveTypes.useRH}
                  onCheckedChange={(checked) => setSelectedLeaveTypes(prev => ({...prev, useRH: !!checked}))}
                  disabled={leaveBalance.rh <= 0 || selectedRH.length === 0}
                />
                <label htmlFor="useRH" className="text-sm">
                  Use Restricted Holiday (RH) - {leaveBalance.rh} selections remaining
                </label>
              </div>
            </div>
            
            {/* Leave Priority Selection - only show when both PL and CL are selected */}
            {selectedLeaveTypes.usePL && selectedLeaveTypes.useCL && (
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium block">Leave Priority:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="cl-first"
                      name="leavePriority"
                      checked={leavePriority === "cl-first"}
                      onChange={() => setLeavePriority("cl-first")}
                      className="rounded-full"
                    />
                    <label htmlFor="cl-first" className="text-sm">Use CL first, then PL</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="pl-first"
                      name="leavePriority"
                      checked={leavePriority === "pl-first"}
                      onChange={() => setLeavePriority("pl-first")}
                      className="rounded-full"
                    />
                    <label htmlFor="pl-first" className="text-sm">Use PL first, then CL</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="balanced"
                      name="leavePriority"
                      checked={leavePriority === "balanced"}
                      onChange={() => setLeavePriority("balanced")}
                      className="rounded-full"
                    />
                    <label htmlFor="balanced" className="text-sm">Balance between both</label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={generateSuggestions}>Generate Leave Plans</Button>
        </CardFooter>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-bold">Suggested Plans</h3>
          <p className="text-muted-foreground">
            Current leave balance: 
            <Badge variant="outline" className="ml-1">PL: {leaveBalance.pl}</Badge> 
            <Badge variant="outline" className="ml-1">CL: {leaveBalance.cl}</Badge>
            <Badge variant="outline" className="ml-1">RH: {leaveBalance.rh}</Badge>
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => {
              // Determine badge color based on included leave types
              const badgeColor = suggestion.leaveTypes.usePL && suggestion.leaveTypes.useCL 
                ? "border-purple-500" 
                : suggestion.leaveTypes.usePL 
                  ? "border-blue-500" 
                  : suggestion.leaveTypes.useCL 
                    ? "border-green-500" 
                    : "border-amber-500";
              
              return (
                <Card key={index} className={badgeColor}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{suggestion.title}</CardTitle>
                      <div className="flex space-x-1">
                        {suggestion.leaveTypes.usePL && <Badge className="bg-blue-500">PL</Badge>}
                        {suggestion.leaveTypes.useCL && <Badge className="bg-green-500">CL</Badge>}
                        {suggestion.leaveTypes.useRH && <Badge className="bg-amber-500">RH</Badge>}
                      </div>
                    </div>
                    <CardDescription>{suggestion.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p><span className="font-medium">Total days:</span> {suggestion.days}</p>
                      <p><span className="font-medium">Leaves required:</span> {suggestion.leavesRequired}</p>
                      
                      {/* Day breakdown */}
                      <div>
                        <p className="font-medium mb-2">Day breakdown:</p>
                        <div className="border rounded-md overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">Day</th>
                                <th className="px-3 py-2 text-left font-medium text-gray-500">Type</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {suggestion.dayDetails.map((day, i) => (
                                <tr key={i} className={`${day.isWeekend ? 'bg-gray-50' : ''} ${day.isHoliday ? 'bg-blue-50' : ''} ${day.isRH ? 'bg-amber-50' : ''} ${day.isUsed ? 'text-gray-400' : ''}`}>
                                  <td className="px-3 py-2">{format(parseISO(day.date), "dd MMM")}</td>
                                  <td className="px-3 py-2">{day.dayName}</td>
                                  <td className="px-3 py-2">
                                    {day.isWeekend 
                                      ? <Badge variant="outline" className="bg-gray-100">Weekend</Badge> 
                                      : day.isHoliday 
                                        ? <Badge variant="outline" className="bg-blue-100">Holiday</Badge> 
                                        : day.isRH 
                                          ? <Badge variant="outline" className="bg-amber-100">RH</Badge> 
                                          : day.isUsed 
                                            ? <Badge variant="outline" className="bg-red-100">Used</Badge>
                                            : <Badge variant="outline" className="bg-green-100">Leave</Badge>}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Leave dates */}
                      <div>
                        <p className="font-medium mb-1">Leave dates:</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.dates.map((date, i) => {
                            const dayInfo = suggestion.dayDetails.find(d => d.date === date);
                            return (
                              <Badge 
                                key={i} 
                                variant="outline"
                                className={dayInfo?.isRH ? "border-amber-400 bg-amber-50" : ""}
                              >
                                {format(parseISO(date), "dd MMM")}
                                {dayInfo?.isRH && " (RH)"}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Warnings */}
                      {suggestion.warnings.length > 0 && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm">
                          <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                              <p className="font-medium">Suggestions & Warnings</p>
                              <ul className="mt-1 list-disc list-inside pl-1 space-y-1">
                                {suggestion.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleUsePlan(suggestion)}
                    >
                      Use This Plan
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
} 
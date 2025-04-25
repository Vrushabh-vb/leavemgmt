"use client"

import { useState } from "react"
import { useLeave } from "../context/LeaveContext"
import { differenceInCalendarDays, addDays, isWeekend, parseISO, format, eachDayOfInterval } from "date-fns"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface OptimalLeavePlan {
  startDate: string
  endDate: string
  totalDays: number
  workingDays: number
  leaveDays: number
  weekendDays: number
  holidayDays: number
  efficiency: number // Ratio of total days off to leaves used
  calendarDays: {
    date: string
    isWeekend: boolean
    isHoliday: boolean
    isRestrictedHoliday: boolean
    needsLeave: boolean
    dayName: string
  }[]
}

export default function NumberOfDaysOptimizer() {
  const { holidays, selectedRH } = useLeave()
  const [numberOfDays, setNumberOfDays] = useState<number>(0)
  const [lookAheadMonths, setLookAheadMonths] = useState<number>(3)
  const [includeWeekends, setIncludeWeekends] = useState<boolean>(true)
  const [includePublicHolidays, setIncludePublicHolidays] = useState<boolean>(true)
  const [optimalPlans, setOptimalPlans] = useState<OptimalLeavePlan[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Check if a date is a holiday
  const isHoliday = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd")
    return holidays.some(holiday => holiday.date === dateStr)
  }
  
  // Check if a date is a restricted holiday
  const isRestrictedHoliday = (date: Date): boolean => {
    const dateStr = format(date, "yyyy-MM-dd")
    return selectedRH.includes(dateStr)
  }

  // Function to find optimal leave plans
  const findOptimalLeavePlans = () => {
    if (!numberOfDays || numberOfDays <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of days greater than 0",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    
    // Define the search period (today + lookAheadMonths)
    const today = new Date()
    const endSearchDate = addDays(today, lookAheadMonths * 30) // Approximate months by days
    
    const optimalPlans: OptimalLeavePlan[] = []
    
    // Loop through each possible start date in the search period
    let currentStartDate = new Date(today)
    
    while (differenceInCalendarDays(endSearchDate, currentStartDate) > numberOfDays) {
      // For each start date, calculate a potential plan with the desired number of days
      const endDate = addDays(currentStartDate, numberOfDays - 1)
      
      // Get all dates in the range
      const daysInRange = eachDayOfInterval({ start: currentStartDate, end: endDate })
      
      // Calculate metrics for this plan
      let weekendDays = 0
      let holidayDays = 0
      let leaveDays = 0
      
      const calendarDays = daysInRange.map(date => {
        const isWeekendDay = isWeekend(date)
        const isHolidayDay = isHoliday(date)
        const isRH = isRestrictedHoliday(date)
        const needsLeave = !isWeekendDay && !isHolidayDay

        if (isWeekendDay && includeWeekends) weekendDays++
        if (isHolidayDay && includePublicHolidays) holidayDays++
        if (needsLeave) leaveDays++
        
        return {
          date: format(date, "yyyy-MM-dd"),
          isWeekend: isWeekendDay,
          isHoliday: isHolidayDay,
          isRestrictedHoliday: isRH,
          needsLeave,
          dayName: format(date, "EEEE") // Monday, Tuesday, etc.
        }
      })
      
      // Calculate efficiency (total days / leave days needed)
      const efficiency = numberOfDays / leaveDays
      
      // Add this plan to our results
      optimalPlans.push({
        startDate: format(currentStartDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        totalDays: numberOfDays,
        workingDays: leaveDays,
        leaveDays,
        weekendDays,
        holidayDays,
        efficiency,
        calendarDays
      })
      
      // Move to next day
      currentStartDate = addDays(currentStartDate, 1)
    }
    
    // Sort plans by efficiency (highest first)
    const sortedPlans = [...optimalPlans].sort((a, b) => b.efficiency - a.efficiency)
    
    // Take top 5 most efficient plans
    setOptimalPlans(sortedPlans.slice(0, 5))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Leave Day Optimizer</h2>
      <p className="text-muted-foreground">
        Enter the number of days you want to take off, and we'll suggest the most optimal time periods 
        that require the fewest leave applications.
      </p>
      
      <Card>
        <CardHeader>
          <CardTitle>Find Optimal Leave Periods</CardTitle>
          <CardDescription>
            We'll consider weekends and holidays to maximize your time off with minimal leave days
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Days Off Desired</label>
              <Input 
                type="number" 
                min={1} 
                value={numberOfDays || ''} 
                onChange={(e) => setNumberOfDays(parseInt(e.target.value) || 0)}
                placeholder="Enter number of days"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Look Ahead Period (Months)</label>
              <Input 
                type="number" 
                min={1} 
                max={12}
                value={lookAheadMonths} 
                onChange={(e) => setLookAheadMonths(parseInt(e.target.value) || 3)}
                placeholder="Number of months to look ahead"
              />
            </div>
          </div>
          
          <div className="space-y-3 p-3 bg-gray-50 rounded-md">
            <label className="text-sm font-medium block mb-2">
              Optimization Settings
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeWeekends"
                  checked={includeWeekends}
                  onCheckedChange={(checked) => setIncludeWeekends(!!checked)}
                />
                <label htmlFor="includeWeekends" className="text-sm">
                  Include weekends in calculation (recommended)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeHolidays"
                  checked={includePublicHolidays}
                  onCheckedChange={(checked) => setIncludePublicHolidays(!!checked)}
                />
                <label htmlFor="includeHolidays" className="text-sm">
                  Include public holidays in calculation (recommended)
                </label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={findOptimalLeavePlans} disabled={isLoading}>
            {isLoading ? "Finding Optimal Plans..." : "Find Optimal Leave Plans"}
          </Button>
        </CardFooter>
      </Card>

      {optimalPlans.length > 0 && (
        <div className="space-y-4 mt-6">
          <h3 className="text-xl font-bold">Most Efficient Leave Plans</h3>
          <p className="text-muted-foreground">
            These plans give you {numberOfDays} days off while using the fewest leave applications
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optimalPlans.map((plan, index) => (
              <Card key={index} className={index === 0 ? "border-green-500 shadow-md" : ""}>
                <CardHeader className={index === 0 ? "bg-green-50" : ""}>
                  <div className="flex justify-between items-center">
                    <CardTitle>Plan {index + 1}</CardTitle>
                    {index === 0 && <Badge className="bg-green-500">Most Efficient</Badge>}
                  </div>
                  <CardDescription>
                    {format(parseISO(plan.startDate), "dd MMM yyyy")} - {format(parseISO(plan.endDate), "dd MMM yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col">
                        <span className="font-medium">Total Days Off:</span>
                        <span>{plan.totalDays}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Leave Applications:</span>
                        <span className="text-green-600 font-semibold">{plan.leaveDays}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Weekend Days:</span>
                        <span>{plan.weekendDays}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">Holiday Days:</span>
                        <span>{plan.holidayDays}</span>
                      </div>
                      <div className="flex flex-col col-span-2">
                        <span className="font-medium">Efficiency Score:</span>
                        <span>{plan.efficiency.toFixed(2)}x (higher is better)</span>
                      </div>
                    </div>
                    
                    {/* Calendar view */}
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
                            {plan.calendarDays.map((day, i) => (
                              <tr key={i} className={`
                                ${day.isWeekend ? 'bg-gray-50' : ''} 
                                ${day.isHoliday ? 'bg-blue-50' : ''} 
                                ${day.isRestrictedHoliday ? 'bg-amber-50' : ''}
                              `}>
                                <td className="px-3 py-2">{format(parseISO(day.date), "dd MMM")}</td>
                                <td className="px-3 py-2">{day.dayName}</td>
                                <td className="px-3 py-2">
                                  {day.isWeekend 
                                    ? <Badge variant="outline" className="bg-gray-100">Weekend</Badge> 
                                    : day.isHoliday 
                                      ? <Badge variant="outline" className="bg-blue-100">Holiday</Badge> 
                                      : day.isRestrictedHoliday 
                                        ? <Badge variant="outline" className="bg-amber-100">RH</Badge>
                                        : <Badge variant="outline" className="bg-green-100">Leave</Badge>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={index === 0 ? "default" : "outline"} 
                    className="w-full"
                    onClick={() => {
                      // Copy to clipboard
                      const text = `Optimal Leave Plan:
                      ${format(parseISO(plan.startDate), "dd MMM yyyy")} - ${format(parseISO(plan.endDate), "dd MMM yyyy")}
                      Total Days Off: ${plan.totalDays}
                      Leave Applications Required: ${plan.leaveDays}
                      Weekend Days: ${plan.weekendDays}
                      Holiday Days: ${plan.holidayDays}
                      Efficiency: ${plan.efficiency.toFixed(2)}x`;
                      
                      navigator.clipboard.writeText(text);
                      toast({
                        title: "Plan Copied",
                        description: "The leave plan details have been copied to your clipboard",
                      });
                    }}
                  >
                    Copy Plan Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
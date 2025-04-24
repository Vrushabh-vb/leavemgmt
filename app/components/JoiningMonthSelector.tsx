"use client"

import { useState, useEffect } from "react"
import { useLeave } from "../context/LeaveContext"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import dynamic from "next/dynamic"

// Dynamically import icons
const Settings = dynamic(() => import("lucide-react").then(mod => mod.Settings), {
  ssr: false,
})

const CalendarDays = dynamic(() => import("lucide-react").then(mod => mod.CalendarDays), {
  ssr: false,
})

const UserCog = dynamic(() => import("lucide-react").then(mod => mod.UserCog), {
  ssr: false,
})

const BookCopy = dynamic(() => import("lucide-react").then(mod => mod.BookCopy), {
  ssr: false,
})

const Briefcase = dynamic(() => import("lucide-react").then(mod => mod.Briefcase), {
  ssr: false,
})

const History = dynamic(() => import("lucide-react").then(mod => mod.History), {
  ssr: false,
})

const Building = dynamic(() => import("lucide-react").then(mod => mod.Building), {
  ssr: false,
})

export default function JoiningMonthSelector() {
  const { joiningMonth, setJoiningMonth, calculateProRatedLeaves, leaveBalance, resetAllData, addUsedLeaves } = useLeave()
  const { toast } = useToast()
  const [showSelector, setShowSelector] = useState(joiningMonth === -1)
  const [selectedMonth, setSelectedMonth] = useState<string>(
    joiningMonth >= 0 ? joiningMonth.toString() : ""
  )
  const [isExistingEmployee, setIsExistingEmployee] = useState(joiningMonth === -99)
  const [employeeType, setEmployeeType] = useState<"new" | "existing">(
    joiningMonth >= 0 ? "new" : joiningMonth === -99 ? "existing" : "new"
  )
  
  // For tracking used leaves for existing employees
  const [usedPL, setUsedPL] = useState<number>(0)
  const [usedCL, setUsedCL] = useState<number>(0)
  const [usedRH, setUsedRH] = useState<number>(0)

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  useEffect(() => {
    if (joiningMonth >= 0) {
      setSelectedMonth(joiningMonth.toString())
      setIsExistingEmployee(false)
    } else if (joiningMonth === -99) {
      setIsExistingEmployee(true)
    }
  }, [joiningMonth])

  const handleEmployeeTypeChange = (value: "new" | "existing") => {
    setEmployeeType(value)
    if (value === "existing") {
      setSelectedMonth("")
    }
  }

  const handleSave = () => {
    if (employeeType === "new") {
      if (!selectedMonth) {
        toast({
          title: "Month Selection Required",
          description: "Please select your joining month",
          variant: "destructive",
        })
        return
      }
      
      // Convert month name to month index (0-11)
      const monthIndex = months.indexOf(selectedMonth)
      if (monthIndex === -1) {
        toast({
          title: "Invalid Month",
          description: "Please select a valid month",
          variant: "destructive",
        })
        return
      }
      
      setJoiningMonth(monthIndex)
      calculateProRatedLeaves()
      setShowSelector(false)
      
      toast({
        title: "Joining Month Saved",
        description: `Your joining month has been set to ${selectedMonth}`,
      })
    } else {
      // For existing employees
      setJoiningMonth(-99) // Special code for existing employees
      
      // Apply used leaves if specified
      if (usedPL > 0 || usedCL > 0 || usedRH > 0) {
        addUsedLeaves(usedPL, usedCL, usedRH)
      }
      
      toast({
        title: "Employee Type Saved",
        description: "You've been set as an existing employee with full leave entitlement",
      })
    }
  }

  const handleEdit = () => {
    setShowSelector(true)
  }
  
  const handleReset = () => {
    resetAllData()
    setShowSelector(true)
    setSelectedMonth("")
    setIsExistingEmployee(false)
    setEmployeeType("new")
    setUsedPL(0)
    setUsedCL(0)
    setUsedRH(0)
    
    toast({
      title: "Data Reset",
      description: "All your leave data has been reset",
    })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        {typeof Settings !== 'undefined' && <Settings className="h-6 w-6 mr-2 text-indigo-600" />} 
        Settings
      </h2>
      
      {showSelector ? (
        <Card className="border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-700">
              {typeof UserCog !== 'undefined' && <UserCog className="h-5 w-5 mr-2" />}
              Employee Information
            </CardTitle>
            <CardDescription>Set your employee type and joining date to calculate leaves correctly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-700 flex items-center">
                {typeof Briefcase !== 'undefined' && <Briefcase className="h-4 w-4 mr-2 text-indigo-600" />}
                Employee Type
              </h3>
              <RadioGroup 
                value={employeeType} 
                onValueChange={(value) => handleEmployeeTypeChange(value as "new" | "existing")}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors">
                  <RadioGroupItem value="new" id="new" className="text-indigo-600" />
                  <Label htmlFor="new" className="text-gray-700 cursor-pointer">
                    I'm a new joiner (pro-rated leaves based on joining month)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 rounded hover:bg-white transition-colors">
                  <RadioGroupItem value="existing" id="existing" className="text-indigo-600" />
                  <Label htmlFor="existing" className="text-gray-700 cursor-pointer">
                    I'm an existing employee (full leave entitlement)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {employeeType === "new" && (
              <div className="space-y-3 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-700 flex items-center">
                  {typeof CalendarDays !== 'undefined' && <CalendarDays className="h-4 w-4 mr-2" />}
                  Joining Month
                </h3>
                <div className="max-w-xs">
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="bg-white border-blue-200">
                      <SelectValue placeholder="Select your joining month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            {employeeType === "existing" && (
              <div className="space-y-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-medium text-green-700 flex items-center">
                  {typeof History !== 'undefined' && <History className="h-4 w-4 mr-2" />}
                  Already Used Leaves
                </h3>
                <p className="text-sm text-green-600">
                  If you have already used some of your leaves this year, specify the count below:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-green-200">
                    <Label htmlFor="usedPL" className="text-green-700">Used Paid Leaves (PL)</Label>
                    <Input
                      id="usedPL"
                      type="number"
                      min="0"
                      max="24"
                      value={usedPL.toString()}
                      onChange={(e) => setUsedPL(Number(e.target.value))}
                      className="border-green-200"
                    />
                    <p className="text-xs text-green-500">Max: 24 days</p>
                  </div>
                  
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-green-200">
                    <Label htmlFor="usedCL" className="text-green-700">Used Casual Leaves (CL)</Label>
                    <Input
                      id="usedCL"
                      type="number"
                      min="0"
                      max="8"
                      value={usedCL.toString()}
                      onChange={(e) => setUsedCL(Number(e.target.value))}
                      className="border-green-200"
                    />
                    <p className="text-xs text-green-500">Max: 8 days</p>
                  </div>
                  
                  <div className="space-y-2 bg-white p-3 rounded-lg border border-green-200">
                    <Label htmlFor="usedRH" className="text-green-700">Used Restricted Holidays (RH)</Label>
                    <Input
                      id="usedRH"
                      type="number"
                      min="0"
                      max="2"
                      value={usedRH.toString()}
                      onChange={(e) => setUsedRH(Number(e.target.value))}
                      className="border-green-200"
                    />
                    <p className="text-xs text-green-500">Max: 2 days</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Reset All Data
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-indigo-700">
              {typeof Building !== 'undefined' && <Building className="h-5 w-5 mr-2" />}
              Your Leave Balance
            </CardTitle>
            <CardDescription>
              {joiningMonth === -99 
                ? "Full entitlement as an existing employee" 
                : `Based on your joining month: ${months[joiningMonth]}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center border border-blue-100 hover:shadow-sm transition-shadow">
                  <h3 className="font-medium text-blue-700">Paid Leave</h3>
                  <p className="text-3xl font-bold text-blue-700 my-2">{leaveBalance.pl}</p>
                  <p className="text-sm text-blue-500">days</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center border border-green-100 hover:shadow-sm transition-shadow">
                  <h3 className="font-medium text-green-700">Casual Leave</h3>
                  <p className="text-3xl font-bold text-green-700 my-2">{leaveBalance.cl}</p>
                  <p className="text-sm text-green-500">days</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center border border-purple-100 hover:shadow-sm transition-shadow">
                  <h3 className="font-medium text-purple-700">Restricted Holidays</h3>
                  <p className="text-3xl font-bold text-purple-700 my-2">{leaveBalance.rh}</p>
                  <p className="text-sm text-purple-500">days</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1 mt-2 bg-gray-50 p-4 rounded-lg">
                {joiningMonth === -99 ? (
                  <>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      Paid leave (PL): 24 days (full entitlement)
                    </p>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Casual leave (CL): 8 days (full entitlement)
                    </p> 
                  </>
                ) : (
                  <>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                      Paid leave (PL): 2 days per month from the month after joining
                    </p>
                    <p className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                      Casual leave (CL): 8 days per year, prorated based on joining month
                    </p>
                  </>
                )}
                <p className="flex items-center">
                  <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                  Restricted holidays (RH): Fixed at 2 days
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <Button 
              variant="outline" 
              onClick={handleEdit}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Change Settings
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  Reset Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all your data including leave balance, leave requests, and selected restricted holidays.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReset}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      )}

      <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-700">
            {typeof BookCopy !== 'undefined' && <BookCopy className="h-5 w-5 mr-2" />}
            How Leave Calculation Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
              <h3 className="font-medium mb-1 text-amber-800">For Existing Employees:</h3>
              <ul className="list-disc pl-5 space-y-1 text-amber-700">
                <li>Paid Leave (PL): 24 days per year</li>
                <li>Casual Leave (CL): 8 days per year</li>
                <li>Restricted Holidays (RH): 2 days per year</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <h3 className="font-medium mb-1 text-blue-800">For New Joiners:</h3>
              <ul className="list-disc pl-5 space-y-1 text-blue-700">
                <li>
                  <strong>Paid Leave (PL):</strong> 2 days per month, starting from the month after joining
                  <p className="text-sm text-blue-600 mt-1">Example: If you join in March, you'll get 2 days × (12-3) = 18 PL days</p>
                </li>
                <li>
                  <strong>Casual Leave (CL):</strong> 8 days per year, prorated for the remaining months
                  <p className="text-sm text-blue-600 mt-1">Example: If you join in March, you'll get 8 × (12-3)/12 = 6 CL days</p>
                </li>
                <li>
                  <strong>Restricted Holidays (RH):</strong> Fixed at 2 days per year regardless of joining date
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
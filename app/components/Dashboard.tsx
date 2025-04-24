import { useLeave } from "../context/LeaveContext"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

// Dynamically import icons with no SSR to avoid hydration mismatch
const AlertCircle = dynamic(() => import("lucide-react").then(mod => mod.AlertCircle), {
  ssr: false,
})

const ArrowRight = dynamic(() => import("lucide-react").then(mod => mod.ArrowRight), {
  ssr: false,
})

const Calendar = dynamic(() => import("lucide-react").then(mod => mod.Calendar), {
  ssr: false,
})

const Users = dynamic(() => import("lucide-react").then(mod => mod.Users), {
  ssr: false,
})

const Clock = dynamic(() => import("lucide-react").then(mod => mod.Clock), {
  ssr: false,
})

const PieChart = dynamic(() => import("lucide-react").then(mod => mod.PieChart), {
  ssr: false,
})

const Briefcase = dynamic(() => import("lucide-react").then(mod => mod.Briefcase), {
  ssr: false,
})

const Award = dynamic(() => import("lucide-react").then(mod => mod.Award), {
  ssr: false,
})

const Gift = dynamic(() => import("lucide-react").then(mod => mod.Gift), {
  ssr: false,
})

// Simple donut chart component
const DonutChart = ({ used, total, color }: { used: number; total: number; color: string }) => {
  const percentage = Math.min(100, Math.max(0, (used / total) * 100));
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference * (1 - percentage / 100);
  
  return (
    <div className="relative h-32 w-32 mx-auto">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke="#e5e7eb" 
          strokeWidth="10" 
        />
        {/* Foreground circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="40" 
          fill="none" 
          stroke={color} 
          strokeWidth="10" 
          strokeDasharray={circumference} 
          strokeDashoffset={dashOffset} 
          strokeLinecap="round" 
          transform="rotate(-90 50 50)" 
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-800">{used}/{total}</span>
        <span className="text-xs text-gray-500">days used</span>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { leaveBalance, leaveRequests, selectedRH, holidays, restrictedHolidays, joiningMonth, pendingLeaves } = useLeave()
  
  // For navigation
  const router = useRouter();

  // Get upcoming holidays (next 3)
  const today = new Date()
  const upcomingHolidays = [...holidays]
    .filter((holiday) => parseISO(holiday.date) >= today)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime())
    .slice(0, 3)

  // Get upcoming leave requests
  const upcomingLeaves = leaveRequests
    .filter((request) => parseISO(request.startDate) >= today && request.status !== "Deleted")
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
    .slice(0, 3)

  // Get selected RH details
  const selectedRHDetails = restrictedHolidays.filter((rh) => selectedRH.includes(rh.date))
  
  // Calculate max allowed leaves based on joining month (for new joiners)
  const isExistingEmployee = joiningMonth === -99;
  
  // Eligible months calculation (months after joining month)
  const eligibleMonths = joiningMonth >= 0 ? 12 - (joiningMonth + 1) : 0;
  
  // For existing employees, use full entitlement; for new joiners, calculate prorated leaves
  const maxPaidLeaves = isExistingEmployee ? 24 : Math.max(eligibleMonths * 2, 0);
  const maxCasualLeaves = isExistingEmployee ? 8 : Math.max(Math.floor(eligibleMonths * (8 / 12)), 0);

  // Calculate used leaves
  const usedPL = maxPaidLeaves - leaveBalance.pl;
  const usedCL = maxCasualLeaves - leaveBalance.cl;
  const usedRH = 2 - leaveBalance.rh;

  const goToLeaveHistory = () => {
    // Use router to navigate to history tab
    router.push("/?tab=history");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        {typeof Briefcase !== 'undefined' && <Briefcase className="h-6 w-6 mr-2 text-blue-600" />} 
        Dashboard
      </h2>

      {pendingLeaves.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200">
          {typeof AlertCircle !== 'undefined' && <AlertCircle className="h-4 w-4 text-amber-600" />}
          <div className="flex justify-between w-full items-center">
            <div>
              <AlertTitle className="text-amber-800">Pending Leave Requests</AlertTitle>
              <AlertDescription className="text-amber-700">
                You have {pendingLeaves.length} pending leave {pendingLeaves.length === 1 ? 'request' : 'requests'} that need your confirmation.
              </AlertDescription>
            </div>
            <Button 
              variant="outline" 
              className="border-amber-500 text-amber-700 hover:bg-amber-100"
              onClick={goToLeaveHistory}
            >
              View in History
              {typeof ArrowRight !== 'undefined' && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </Alert>
      )}

      {/* Leave Usage Visualization */}
      <Card className="border-t-4 border-t-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            {typeof PieChart !== 'undefined' && <PieChart className="h-5 w-5 mr-2" />}
            Leave Usage Overview
          </CardTitle>
          <CardDescription>
            Visual summary of your leave balance and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Paid Leave (PL)</h3>
              <DonutChart used={usedPL} total={maxPaidLeaves} color="#3b82f6" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Casual Leave (CL)</h3>
              <DonutChart used={usedCL} total={maxCasualLeaves} color="#10b981" />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Restricted Holidays (RH)</h3>
              <DonutChart used={usedRH} total={2} color="#8b5cf6" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-blue-700">Paid Leave</CardTitle>
              {typeof Award !== 'undefined' && <Award className="h-5 w-5 text-blue-600" />}
            </div>
            <CardDescription>
              {joiningMonth === -1 
                ? "Set your employee type in Settings" 
                : isExistingEmployee 
                  ? "24 days (full entitlement)"
                  : `Based on joining in ${new Date(0, joiningMonth).toLocaleString('default', { month: 'long' })}: ${maxPaidLeaves} days`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold text-blue-700">{leaveBalance.pl}</span>
              <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded-full">days remaining</span>
            </div>
            <Progress value={maxPaidLeaves > 0 ? (leaveBalance.pl / maxPaidLeaves) * 100 : 0} className="h-2 bg-blue-100" />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-green-700">Casual Leave</CardTitle>
              {typeof Clock !== 'undefined' && <Clock className="h-5 w-5 text-green-600" />}
            </div>
            <CardDescription>
              {joiningMonth === -1 
                ? "Set your employee type in Settings" 
                : isExistingEmployee 
                  ? "8 days (full entitlement)"
                  : `Based on joining in ${new Date(0, joiningMonth).toLocaleString('default', { month: 'long' })}: ${maxCasualLeaves} days`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold text-green-700">{leaveBalance.cl}</span>
              <span className="text-sm text-gray-500 bg-green-50 px-2 py-1 rounded-full">days remaining</span>
            </div>
            <Progress value={maxCasualLeaves > 0 ? (leaveBalance.cl / maxCasualLeaves) * 100 : 0} className="h-2 bg-green-100" />
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-purple-700">Restricted Holidays</CardTitle>
              {typeof Gift !== 'undefined' && <Gift className="h-5 w-5 text-purple-600" />}
            </div>
            <CardDescription>Annual selection: 2 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-3xl font-bold text-purple-700">{leaveBalance.rh}</span>
              <span className="text-sm text-gray-500 bg-purple-50 px-2 py-1 rounded-full">selections remaining</span>
            </div>
            <Progress value={(leaveBalance.rh / 2) * 100} className="h-2 bg-purple-100" />
          </CardContent>
        </Card>
      </div>

      {/* Leave Rules */}
      <Card className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-indigo-700">
            {typeof Users !== 'undefined' && <Users className="h-5 w-5 mr-2" />}
            Leave Policy
          </CardTitle>
          <CardDescription>Important rules to remember when planning your leaves</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex justify-center items-center mr-3 flex-shrink-0">1</span>
              <span>
                <strong className="text-indigo-700">Leave Entitlement:</strong> Existing employees get full entitlement; new joiners get prorated leaves.
              </span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex justify-center items-center mr-3 flex-shrink-0">2</span>
              <span>
                <strong className="text-indigo-700">PL for New Joiners:</strong> 2 days per month, starting from the month after joining.
              </span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex justify-center items-center mr-3 flex-shrink-0">3</span>
              <span>
                <strong className="text-indigo-700">CL for New Joiners:</strong> 8 days per year, prorated based on joining month.
              </span>
            </li>
            <li className="flex items-start">
              <span className="bg-indigo-100 text-indigo-800 rounded-full w-6 h-6 flex justify-center items-center mr-3 flex-shrink-0">4</span>
              <span>
                <strong className="text-indigo-700">Maximum Duration:</strong> A single leave request cannot exceed 15 consecutive days.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Selected RH */}
      <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-purple-700">
            {typeof Gift !== 'undefined' && <Gift className="h-5 w-5 mr-2" />}
            Selected Restricted Holidays
          </CardTitle>
          <CardDescription>You can select up to 2 restricted holidays per year</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedRHDetails.length > 0 ? (
            <ul className="space-y-2">
              {selectedRHDetails.map((rh) => (
                <li key={rh.date} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <div>
                    <span className="font-medium text-purple-800">{rh.name}</span>
                    <p className="text-sm text-purple-600">{rh.day}</p>
                  </div>
                  <span className="text-sm bg-white px-2 py-1 rounded-md text-purple-700 border border-purple-200">{format(parseISO(rh.date), "dd MMM yyyy")}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No restricted holidays selected yet</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Holidays */}
      <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-700">
            {typeof Calendar !== 'undefined' && <Calendar className="h-5 w-5 mr-2" />}
            Upcoming Holidays
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingHolidays.length > 0 ? (
            <ul className="space-y-2">
              {upcomingHolidays.map((holiday) => (
                <li key={holiday.date} className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div>
                    <span className="font-medium text-amber-800">{holiday.name}</span>
                    <p className="text-sm text-amber-600">{holiday.type} Holiday</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm bg-white px-2 py-1 rounded-md text-amber-700 border border-amber-200">{format(parseISO(holiday.date), "dd MMM yyyy")}</span>
                    <p className="text-sm text-amber-600 mt-1">{holiday.day}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming holidays</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Leaves */}
      <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            {typeof Clock !== 'undefined' && <Clock className="h-5 w-5 mr-2" />}
            Upcoming Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLeaves.length > 0 ? (
            <ul className="space-y-2">
              {upcomingLeaves.map((leave) => (
                <li key={leave.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <span className="font-medium text-blue-800">
                      <span className={`inline-block w-8 text-center rounded-md mr-2 
                        ${leave.type === 'PL' ? 'bg-blue-200 text-blue-800' : 
                          leave.type === 'CL' ? 'bg-green-200 text-green-800' : 
                          'bg-purple-200 text-purple-800'}`}>
                        {leave.type}
                      </span>
                      {leave.days} day(s)
                    </span>
                    <p className="text-sm text-blue-600 ml-10">{leave.reason || "No reason provided"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm bg-white px-2 py-1 rounded-md text-blue-700 border border-blue-200">
                      {format(parseISO(leave.startDate), "dd MMM")} - {format(parseISO(leave.endDate), "dd MMM yyyy")}
                    </span>
                    <p className={`text-sm mt-1 text-center rounded-full px-2
                      ${leave.status === 'Approved' || leave.status === 'Confirmed' ? 'text-green-600 bg-green-100' : 
                        leave.status === 'Pending' ? 'text-amber-600 bg-amber-100' : 
                        'text-red-600 bg-red-100'}`}>
                      {leave.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4">No upcoming leave requests</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

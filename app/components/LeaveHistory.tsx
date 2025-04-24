import { useLeave } from "../context/LeaveContext"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import dynamic from "next/dynamic"

// Dynamically import icons with no SSR to avoid hydration mismatch
const Check = dynamic(() => import("lucide-react").then(mod => mod.Check), {
  ssr: false,
})

const X = dynamic(() => import("lucide-react").then(mod => mod.X), {
  ssr: false,
})

const History = dynamic(() => import("lucide-react").then(mod => mod.History), {
  ssr: false,
})

const CalendarClock = dynamic(() => import("lucide-react").then(mod => mod.CalendarClock), {
  ssr: false,
})

export default function LeaveHistory() {
  const { leaveRequests, confirmLeave, deleteLeave } = useLeave()

  // Sort leave requests by date (newest first) and filter out deleted leaves
  const sortedRequests = [...leaveRequests]
    .filter(request => request.status !== "Deleted")
    .sort(
      (a, b) => parseISO(b.requestDate).getTime() - parseISO(a.requestDate).getTime(),
    )

  const handleConfirm = (id: string) => {
    confirmLeave(id)
    toast({
      title: "Leave Confirmed",
      description: "Your leave request has been confirmed and leave balance updated.",
    })
  }

  const handleDelete = (id: string) => {
    deleteLeave(id)
    toast({
      title: "Leave Deleted",
      description: "Your leave request has been deleted and removed from history.",
    })
  }

  // Group leave requests by month/year
  const groupedRequests = sortedRequests.reduce((acc, request) => {
    const monthYear = format(parseISO(request.requestDate), "MMMM yyyy");
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(request);
    return acc;
  }, {} as Record<string, typeof sortedRequests>);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        {typeof History !== 'undefined' && <History className="h-6 w-6 mr-2 text-indigo-600" />}
        Leave History
      </h2>

      {Object.keys(groupedRequests).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedRequests).map(([monthYear, requests]) => (
            <Card key={monthYear} className="border-t-4 border-t-indigo-500 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center">
                  {typeof CalendarClock !== 'undefined' && 
                    <CalendarClock className="h-5 w-5 mr-2 text-indigo-600" />
                  }
                  <CardTitle className="text-indigo-700">{monthYear}</CardTitle>
                </div>
                <CardDescription>{requests.length} leave request(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Dates</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Days</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Reason</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Requested On</th>
                        <th className="text-left py-3 px-4 text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id} className="border-b hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={`
                                ${request.type === "PL" ? 'border-blue-500 text-blue-700 bg-blue-50' : 
                                  request.type === "CL" ? 'border-green-500 text-green-700 bg-green-50' : 
                                  'border-purple-500 text-purple-700 bg-purple-50'}
                              `}
                            >
                              {request.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {format(parseISO(request.startDate), "dd MMM")} -{" "}
                            {format(parseISO(request.endDate), "dd MMM yyyy")}
                          </td>
                          <td className="py-3 px-4 text-gray-700 font-medium">{request.days}</td>
                          <td className="py-3 px-4 max-w-[200px] truncate text-gray-600">
                            {request.reason || "No reason provided"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className={`
                                ${request.status === "Approved" || request.status === "Confirmed"
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : request.status === "Pending"
                                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'}
                              `}
                            >
                              {request.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {format(parseISO(request.requestDate), "dd MMM yyyy")}
                          </td>
                          <td className="py-3 px-4">
                            {request.isPending && (
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700"
                                  onClick={() => handleConfirm(request.id)}
                                >
                                  {typeof Check !== 'undefined' && <Check className="h-4 w-4 mr-1" />}
                                  Confirm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2 text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700"
                                  onClick={() => handleDelete(request.id)}
                                >
                                  {typeof X !== 'undefined' && <X className="h-4 w-4 mr-1" />}
                                  Delete
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-10">
            <div className="text-center">
              <div className="mx-auto rounded-full bg-indigo-100 p-3 w-14 h-14 flex items-center justify-center mb-4">
                {typeof History !== 'undefined' && <History className="h-7 w-7 text-indigo-600" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No leave history</h3>
              <p className="text-gray-500 mb-4">You haven't requested any leaves yet.</p>
              <Button
                onClick={() => window.location.href = "/?tab=optimizer"}
                variant="outline"
                className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              >
                Plan a leave
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

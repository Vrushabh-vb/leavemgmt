"use client"

import { useLeave } from "../context/LeaveContext"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

export default function RestrictedHolidaySelector() {
  const { restrictedHolidays, selectedRH, selectRestrictedHoliday, unselectRestrictedHoliday, leaveBalance } =
    useLeave()

  const handleSelect = (date: string) => {
    if (selectedRH.includes(date)) {
      unselectRestrictedHoliday(date)
      toast({
        title: "Restricted Holiday Unselected",
        description: "You have unselected a restricted holiday",
      })
    } else {
      const success = selectRestrictedHoliday(date)
      if (success) {
        toast({
          title: "Restricted Holiday Selected",
          description: "You have selected a restricted holiday",
        })
      } else {
        toast({
          title: "Selection Failed",
          description: "You can only select 2 restricted holidays per year",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Restricted Holiday Selection</h2>
        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full">{leaveBalance.rh} of 2 selections remaining</span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Restricted Holidays 2025</CardTitle>
          <CardDescription>You can select up to 2 restricted holidays for the year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {restrictedHolidays.map((holiday) => (
              <div
                key={holiday.date}
                className={`flex items-start space-x-3 p-3 rounded-md border ${
                  selectedRH.includes(holiday.date) ? "border-primary bg-primary/5" : "border-gray-200"
                }`}
              >
                <Checkbox
                  id={`rh-${holiday.date}`}
                  checked={selectedRH.includes(holiday.date)}
                  onCheckedChange={() => handleSelect(holiday.date)}
                  disabled={leaveBalance.rh === 0 && !selectedRH.includes(holiday.date)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={`rh-${holiday.date}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {holiday.name}
                  </label>
                  <p className="text-sm text-gray-500 mt-1">
                    {format(parseISO(holiday.date), "dd MMM yyyy")} ({holiday.day})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedRH.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Restricted Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {restrictedHolidays
                .filter((holiday) => selectedRH.includes(holiday.date))
                .map((holiday) => (
                  <li key={holiday.date} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="font-medium">{holiday.name}</span>
                      <p className="text-sm text-gray-500">{holiday.day}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{format(parseISO(holiday.date), "dd MMM yyyy")}</span>
                      <Button variant="outline" size="sm" onClick={() => handleSelect(holiday.date)}>
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

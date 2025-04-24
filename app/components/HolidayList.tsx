"use client"

import { useState } from "react"
import { useLeave } from "../context/LeaveContext"
import { format, parseISO } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function HolidayList() {
  const { holidays } = useLeave()
  const [filter, setFilter] = useState<string>("all")

  // Filter holidays based on selected filter
  const filteredHolidays = holidays.filter((holiday) => {
    if (filter === "all") return true
    if (filter === "weekend" && holiday.weekend) return true
    return holiday.type.toLowerCase() === filter.toLowerCase()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Holidays 2025</h2>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter holidays" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Holidays</SelectItem>
            <SelectItem value="compulsory">Compulsory</SelectItem>
            <SelectItem value="additional">Additional</SelectItem>
            <SelectItem value="declared">Declared</SelectItem>
            <SelectItem value="weekend">Weekend Holidays</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holiday List</CardTitle>
          <CardDescription>All holidays for the year 2025</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Day</th>
                  <th className="text-left py-3 px-4">Holiday</th>
                  <th className="text-left py-3 px-4">Type</th>
                </tr>
              </thead>
              <tbody>
                {filteredHolidays.map((holiday) => (
                  <tr key={holiday.date} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{format(parseISO(holiday.date), "dd MMM yyyy")}</td>
                    <td className="py-3 px-4">
                      <span className={holiday.weekend ? "text-red-500 font-medium" : ""}>{holiday.day}</span>
                    </td>
                    <td className="py-3 px-4">{holiday.name}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          holiday.type === "Compulsory"
                            ? "default"
                            : holiday.type === "Additional"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {holiday.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredHolidays.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      No holidays match the selected filter
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

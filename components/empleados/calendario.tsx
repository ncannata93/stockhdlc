"use client"

import type React from "react"
import { useState } from "react"
import { Calendar } from "react-modern-calendar-datepicker"
import "react-modern-calendar-datepicker/lib/styles.css"

interface CalendarioProps {
  onDateSelect: (date: any) => void
}

const Calendario: React.FC<CalendarioProps> = ({ onDateSelect }) => {
  const [selectedDay, setSelectedDay] = useState(null)

  const handleDateChange = (date: any) => {
    setSelectedDay(date)
    onDateSelect(date)
  }

  return (
    <div className="w-full">
      <Calendar
        value={selectedDay}
        onChange={handleDateChange}
        colorPrimary="#7950f2" // Replace with your desired primary color
        calendarClassName="custom-calendar"
      />
      <div className="border-b border-gray-200 my-4" />
    </div>
  )
}

export default Calendario

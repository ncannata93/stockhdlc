"use client"

import { BookingForm } from "./booking-form"
import { CleaningGrid } from "./cleaning-grid"
import { BookingsList } from "./bookings-list"
import { useRouter } from "next/navigation"
import { useState } from "react"

type Booking = {
  id: string
  apartment: string
  pax: number
  check_in: string
  check_out: string
  notes?: string
  created_at: string
}

type CleaningRecord = {
  id: string
  apartment: string
  date: string
  day_type: string
  cleaning_type: string
  is_completed: boolean
  pax?: number
  check_in?: string
  check_out?: string
}

export function ClientWrapper({
  bookings,
  schedule,
}: {
  bookings: { active: Booking[]; past: Booking[] }
  schedule: CleaningRecord[]
}) {
  const router = useRouter()
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined)

  const handleUpdate = () => {
    setEditingBooking(undefined)
    router.refresh()
  }

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancelEdit = () => {
    setEditingBooking(undefined)
  }

  return (
    <>
      <BookingForm onSuccess={handleUpdate} editingBooking={editingBooking} onCancelEdit={handleCancelEdit} />
      <BookingsList bookings={bookings} onUpdate={handleUpdate} onEdit={handleEdit} />
      <CleaningGrid data={schedule} onUpdate={handleUpdate} />
    </>
  )
}

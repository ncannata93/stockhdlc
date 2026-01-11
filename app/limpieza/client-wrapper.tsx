"use client"

import { BookingForm } from "./booking-form"
import { CleaningGrid } from "./cleaning-grid"
import { BookingsList } from "./bookings-list"
import { useRouter } from "next/navigation"

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
  bookings: Booking[]
  schedule: CleaningRecord[]
}) {
  const router = useRouter()

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <>
      <BookingForm onSuccess={handleUpdate} />
      <BookingsList bookings={bookings} onUpdate={handleUpdate} />
      <CleaningGrid data={schedule} onUpdate={handleUpdate} />
    </>
  )
}

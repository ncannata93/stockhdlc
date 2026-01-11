-- Fix the cleaning schedule generation to avoid duplicates on check-in/out days
-- and properly handle same-day check-in/check-out scenarios

-- Drop and recreate the function with corrected logic
create or replace function generate_cleaning_schedule(
  p_booking_id uuid,
  p_apartment varchar,
  p_check_in date,
  p_check_out date
) returns void as $$
declare
  loop_date date;
  days_since_checkin integer;
  day_type varchar;
  cleaning_type varchar;
begin
  -- Delete existing schedule for this booking
  delete from public.cleaning_schedule where booking_id = p_booking_id;
  
  -- Generate schedule for each day
  loop_date := p_check_in;
  
  while loop_date <= p_check_out loop
    days_since_checkin := loop_date - p_check_in;
    
    -- Improved logic: Only generate one cleaning per day, prioritizing check-in/out
    -- Determine day type and cleaning type
    if loop_date = p_check_in and loop_date = p_check_out then
      -- Same day check-in and check-out
      day_type := 'check-in-out';
      cleaning_type := 'completa';
    elsif loop_date = p_check_in then
      -- Check-in day - only complete cleaning, no daily repaso
      day_type := 'check-in';
      cleaning_type := 'completa';
    elsif loop_date = p_check_out then
      -- Check-out day - only complete cleaning, no daily repaso
      day_type := 'check-out';
      cleaning_type := 'completa';
    else
      -- Regular day during stay (not check-in or check-out)
      day_type := 'daily';
      -- Every 3 days (not counting check-in day) = repaso + sabanas
      if (days_since_checkin > 0) and (days_since_checkin % 3) = 0 then
        cleaning_type := 'repaso-sabanas';
      else
        cleaning_type := 'repaso';
      end if;
    end if;
    
    -- Insert cleaning record
    insert into public.cleaning_schedule (
      booking_id,
      apartment,
      date,
      day_type,
      cleaning_type
    ) values (
      p_booking_id,
      p_apartment,
      loop_date,
      day_type,
      cleaning_type
    );
    
    loop_date := loop_date + interval '1 day';
  end loop;
end;
$$ language plpgsql;

-- Regenerate cleaning schedules for all existing bookings
-- This will apply the corrected logic to all bookings
do $$
declare
  booking_record record;
begin
  for booking_record in select id, apartment, check_in, check_out from public.bookings loop
    perform generate_cleaning_schedule(
      booking_record.id,
      booking_record.apartment,
      booking_record.check_in,
      booking_record.check_out
    );
  end loop;
end;
$$;

-- Drop existing tables if they exist
drop table if exists public.cleaning_records cascade;
drop table if exists public.bookings cascade;

-- Create bookings table for stays
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  apartment varchar(3) not null,
  pax integer not null,
  check_in date not null,
  check_out date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint valid_dates check (check_out > check_in)
);

-- Create cleaning schedule table (generated from bookings)
create table if not exists public.cleaning_schedule (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  apartment varchar(3) not null,
  date date not null,
  day_type varchar(20) not null check (day_type in ('check-in', 'check-out', 'check-in-out', 'daily')),
  cleaning_type varchar(20) not null check (cleaning_type in ('repaso', 'repaso-sabanas', 'completa')),
  is_completed boolean default false,
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bookings enable row level security;
alter table public.cleaning_schedule enable row level security;

-- Bookings policies (public access)
create policy "Allow all to view bookings"
  on public.bookings for select using (true);

create policy "Allow all to insert bookings"
  on public.bookings for insert with check (true);

create policy "Allow all to update bookings"
  on public.bookings for update using (true);

create policy "Allow all to delete bookings"
  on public.bookings for delete using (true);

-- Cleaning schedule policies (public access)
create policy "Allow all to view cleaning schedule"
  on public.cleaning_schedule for select using (true);

create policy "Allow all to insert cleaning schedule"
  on public.cleaning_schedule for insert with check (true);

create policy "Allow all to update cleaning schedule"
  on public.cleaning_schedule for update using (true);

create policy "Allow all to delete cleaning schedule"
  on public.cleaning_schedule for delete using (true);

-- Create indexes
create index if not exists bookings_apartment_dates_idx 
  on public.bookings(apartment, check_in, check_out);

create index if not exists cleaning_schedule_date_apartment_idx 
  on public.cleaning_schedule(date desc, apartment);

create index if not exists cleaning_schedule_booking_idx 
  on public.cleaning_schedule(booking_id);

-- Function to generate cleaning schedule from booking
create or replace function generate_cleaning_schedule(
  p_booking_id uuid,
  p_apartment varchar,
  p_check_in date,
  p_check_out date
) returns void as $$
declare
  current_date date;
  days_since_checkin integer;
  day_type varchar;
  cleaning_type varchar;
begin
  -- Delete existing schedule for this booking
  delete from public.cleaning_schedule where booking_id = p_booking_id;
  
  -- Generate schedule for each day
  current_date := p_check_in;
  
  while current_date <= p_check_out loop
    days_since_checkin := current_date - p_check_in;
    
    -- Determine day type
    if current_date = p_check_in and current_date = p_check_out then
      day_type := 'check-in-out';
      cleaning_type := 'completa';
    elsif current_date = p_check_in then
      day_type := 'check-in';
      cleaning_type := 'completa';
    elsif current_date = p_check_out then
      day_type := 'check-out';
      cleaning_type := 'completa';
    else
      day_type := 'daily';
      -- Every 3 days (including check-in day) = repaso + sabanas, otherwise just repaso
      if (days_since_checkin % 3) = 0 then
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
      current_date,
      day_type,
      cleaning_type
    );
    
    current_date := current_date + interval '1 day';
  end loop;
end;
$$ language plpgsql;

-- Trigger to auto-generate cleaning schedule when booking is created/updated
create or replace function trigger_generate_cleaning_schedule()
returns trigger as $$
begin
  perform generate_cleaning_schedule(
    NEW.id,
    NEW.apartment,
    NEW.check_in,
    NEW.check_out
  );
  return NEW;
end;
$$ language plpgsql;

create trigger bookings_generate_schedule
  after insert or update on public.bookings
  for each row
  execute function trigger_generate_cleaning_schedule();

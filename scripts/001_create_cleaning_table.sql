-- Create cleaning records table
create table if not exists public.cleaning_records (
  id uuid primary key default gen_random_uuid(),
  apartment varchar(3) not null,
  date date not null default current_date,
  check_type varchar(20) not null check (check_type in ('check-in', 'check-out', 'check-in-out')),
  cleaning_type varchar(20) not null check (cleaning_type in ('repaso', 'repaso-sabanas')),
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.cleaning_records enable row level security;

-- Create policies (public access for cleaning staff)
create policy "Allow all to view cleaning records"
  on public.cleaning_records for select
  using (true);

create policy "Allow all to insert cleaning records"
  on public.cleaning_records for insert
  with check (true);

create policy "Allow all to update cleaning records"
  on public.cleaning_records for update
  using (true);

create policy "Allow all to delete cleaning records"
  on public.cleaning_records for delete
  using (true);

-- Create index for faster queries
create index if not exists cleaning_records_apartment_date_idx 
  on public.cleaning_records(apartment, date desc);

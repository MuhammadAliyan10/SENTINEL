-- Enable replication for access_logs table to allow Realtime subscriptions
begin;
  -- Add table to publication
  alter publication supabase_realtime add table access_logs;
commit;

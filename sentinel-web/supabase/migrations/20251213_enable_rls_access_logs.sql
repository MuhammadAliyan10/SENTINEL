-- Enable RLS on access_logs
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to view all logs
CREATE POLICY "Admins can view all access logs"
ON access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "users"
    WHERE "users".id = auth.uid()
    AND "users".role IN ('SUPER_ADMIN', 'ADMIN')
  )
);

-- Create policy to allow service role to insert logs (backend)
CREATE POLICY "Service role can insert logs"
ON access_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create policy to allow service role to view logs (for backend queries)
CREATE POLICY "Service role can view logs"
ON access_logs
FOR SELECT
TO service_role
USING (true);

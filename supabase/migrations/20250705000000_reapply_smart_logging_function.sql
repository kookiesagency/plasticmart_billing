-- This migration re-applies the "smart" logging function to ensure the database is using the latest version.
-- It correctly extracts the primary key for the target table, even if it's not named 'id'.

CREATE OR REPLACE FUNCTION public.fn_record_activity()
RETURNS TRIGGER AS $$
DECLARE
  log_details JSONB;
  user_email_from_auth TEXT;
  target_primary_key_column TEXT;
  target_id_value TEXT;
BEGIN
  -- Get the primary key column name for the table
  SELECT kcu.column_name INTO target_primary_key_column
  FROM information_schema.key_column_usage AS kcu
  JOIN information_schema.table_constraints AS tc
  ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = TG_TABLE_SCHEMA
  AND tc.table_name = TG_TABLE_NAME;

  -- Build the details JSON and get the target ID based on the operation
  IF (TG_OP = 'INSERT') THEN
    log_details := jsonb_build_object('new_data', to_jsonb(NEW));
    EXECUTE format('SELECT ($1).%I::text', target_primary_key_column) INTO target_id_value USING NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    log_details := jsonb_build_object('new_data', to_jsonb(NEW), 'old_data', to_jsonb(OLD));
    EXECUTE format('SELECT ($1).%I::text', target_primary_key_column) INTO target_id_value USING NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    log_details := jsonb_build_object('old_data', to_jsonb(OLD));
    EXECUTE format('SELECT ($1).%I::text', target_primary_key_column) INTO target_id_value USING OLD;
  END IF;

  -- Attempt to get user email if available from a session
  BEGIN
    user_email_from_auth := (SELECT u.email FROM auth.users u WHERE u.id = auth.uid());
  EXCEPTION WHEN others THEN
    user_email_from_auth := 'System Action';
  END;

  -- Insert into activity_logs
  INSERT INTO public.activity_logs (user_email, action, target_table, target_id, details)
  VALUES (
    user_email_from_auth,
    TG_OP,
    TG_TABLE_NAME,
    target_id_value,
    log_details
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

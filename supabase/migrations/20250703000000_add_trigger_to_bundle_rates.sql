CREATE TRIGGER log_app_settings_changes
AFTER INSERT OR UPDATE OR DELETE ON public.app_settings
FOR EACH ROW EXECUTE FUNCTION public.fn_record_activity();

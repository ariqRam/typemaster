
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jthkdnoljfzgdhmedxfb.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0aGtkbm9samZ6Z2RobWVkeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU0MTIwODAsImV4cCI6MjAzMDk4ODA4MH0.hkYlbqZcr2K9WOvvQVascGRwtbgyO9MzvX-3MpCml8A"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

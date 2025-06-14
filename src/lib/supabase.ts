
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

const supabaseUrl = "https://socrnutfpqtcjmetskta.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvY3JudXRmcHF0Y2ptZXRza3RhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNDg1OTMsImV4cCI6MjA1MzkyNDU5M30.yFkP90puucdc1qxlIOs3Hp4V18_LKea2mf6blmJ9Rpw";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

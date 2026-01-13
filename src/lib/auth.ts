import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export async function requireUser(): Promise<User> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Not signed in");
  return data.user;
}

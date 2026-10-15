import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fvvcdhbreeluecajxzmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2dmNkaGJyZWVsdWVjYWp4em15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc2ODQ4NjUsImV4cCI6MjEwMzI2MDg2NX0.GmAF8iFc6U7X2eAdH98G1fvuZlqDfoxZAQ3-R8d6ZfU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false, // Lo desactivamos temporalmente para evitar problemas de almacenamiento local en este inicio
  },
});
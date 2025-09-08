import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Profile {
  id: string;
  full_name: string;
  email: string;
  university: string;
  phone?: string;
  rating: number;
  total_rides: number;
  created_at: string;
  updated_at: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  price_per_person: number;
  preferences: string[];
  additional_notes: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  driver?: Profile;
}

export interface RideRequest {
  id: string;
  ride_id: string;
  passenger_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  passenger?: Profile;
  ride?: Ride;
}
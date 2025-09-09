import { useState, useEffect } from 'react';
import { supabase, Ride } from '../lib/supabase';

export function useRides() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles(*)
        `)
        .eq('status', 'active')
        .gte('departure_date', new Date().toISOString().split('T')[0])
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const createRide = async (rideData: {
    from_location: string;
    to_location: string;
    departure_date: string;
    departure_time: string;
    available_seats: number;
    total_seats: number;
    price_per_person: number;
    preferences: string[];
    additional_notes: string;
  }) => {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in to create a ride');
    }

    // Add driver_id to the ride data
    const rideDataWithDriver = {
      ...rideData,
      driver_id: user.id
    };

    console.log('Creating ride with data:', rideDataWithDriver); // Debug log

    const { data, error } = await supabase
      .from('rides')
      .insert([rideDataWithDriver])
      .select(`
        *,
        driver:profiles(*)
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error); // Debug log
      throw error;
    }

    await fetchRides(); // Refresh the list
    return data;
  };

  const searchRides = async (filters: {
    from?: string;
    to?: string;
    date?: string;
  }) => {
    try {
      let query = supabase
        .from('rides')
        .select(`
          *,
          driver:profiles(*)
        `)
        .eq('status', 'active')
        .gte('departure_date', new Date().toISOString().split('T')[0]);

      if (filters.from) {
        query = query.ilike('from_location', `%${filters.from}%`);
      }
      if (filters.to) {
        query = query.ilike('to_location', `%${filters.to}%`);
      }
      if (filters.date) {
        query = query.eq('departure_date', filters.date);
      }

      const { data, error } = await query
        .order('departure_date', { ascending: true })
        .order('departure_time', { ascending: true });

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error searching rides:', error);
    }
  };

  const requestRide = async (rideId: string, message: string = '') => {
    // Get the current authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('You must be logged in to request a ride');
    }

    const { data, error } = await supabase
      .from('ride_requests')
      .insert([{
        ride_id: rideId,
        passenger_id: user.id, // Explicitly set passenger_id
        message,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return {
    rides,
    loading,
    fetchRides,
    createRide,
    searchRides,
    requestRide,
  };
}

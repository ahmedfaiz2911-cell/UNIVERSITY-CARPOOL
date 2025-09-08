/*
  # Iqra University Carpool Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `full_name` (text)
      - `email` (text, unique)
      - `university` (text, default 'Iqra University')
      - `phone` (text, optional)
      - `rating` (numeric, default 5.0)
      - `total_rides` (integer, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `rides`
      - `id` (uuid, primary key)
      - `driver_id` (uuid, references profiles)
      - `from_location` (text)
      - `to_location` (text)
      - `departure_date` (date)
      - `departure_time` (time)
      - `available_seats` (integer)
      - `total_seats` (integer)
      - `price_per_person` (numeric)
      - `preferences` (text array)
      - `additional_notes` (text)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `ride_requests`
      - `id` (uuid, primary key)
      - `ride_id` (uuid, references rides)
      - `passenger_id` (uuid, references profiles)
      - `status` (text, default 'pending')
      - `message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access to rides and profiles
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  university text DEFAULT 'Iqra University',
  phone text,
  rating numeric DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  total_rides integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rides table
CREATE TABLE IF NOT EXISTS rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  from_location text NOT NULL,
  to_location text NOT NULL,
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  available_seats integer NOT NULL CHECK (available_seats >= 0),
  total_seats integer NOT NULL CHECK (total_seats > 0),
  price_per_person numeric DEFAULT 0 CHECK (price_per_person >= 0),
  preferences text[] DEFAULT '{}',
  additional_notes text DEFAULT '',
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ride_requests table
CREATE TABLE IF NOT EXISTS ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid REFERENCES rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(ride_id, passenger_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Rides policies
CREATE POLICY "Rides are viewable by everyone"
  ON rides
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rides"
  ON rides
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own rides"
  ON rides
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can delete their own rides"
  ON rides
  FOR DELETE
  TO authenticated
  USING (auth.uid() = driver_id);

-- Ride requests policies
CREATE POLICY "Users can view ride requests for their rides or requests they made"
  ON ride_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = passenger_id OR 
    auth.uid() IN (SELECT driver_id FROM rides WHERE id = ride_id)
  );

CREATE POLICY "Authenticated users can create ride requests"
  ON ride_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update their own ride requests"
  ON ride_requests
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = passenger_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
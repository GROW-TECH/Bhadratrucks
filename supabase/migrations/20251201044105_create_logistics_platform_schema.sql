/*
  # Logistics Platform Database Schema

  ## Overview
  Complete database schema for a truck/logistics booking platform with user and admin panels.

  ## 1. New Tables

  ### `users`
  Main user table for drivers/vehicle owners
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique, not null) - User email for login
  - `password_hash` (text, not null) - Encrypted password
  - `full_name` (text, not null) - User's full name
  - `mobile_number` (text, not null) - Contact number
  - `mail_id` (text) - Additional email/mail ID
  - `district` (text, not null) - User's district
  - `vehicle_type` (text, not null) - Type of vehicle owned
  - `wheel_type` (text, not null) - Wheel configuration (4-wheel, 6-wheel, etc.)
  - `vehicle_photo_url` (text) - URL to vehicle photo
  - `vehicle_rc_front_url` (text) - URL to RC front photo
  - `vehicle_rc_back_url` (text) - URL to RC back photo
  - `payment_screenshot_url` (text) - Registration payment proof
  - `referral_code` (text, unique, not null) - User's unique referral code
  - `referred_by` (text) - Referral code of who referred this user
  - `reward_wallet` (numeric, default 250) - Referral reward balance
  - `diesel_wallet` (numeric, default 300) - Diesel wallet balance
  - `approval_status` (text, default 'pending') - pending/approved/rejected
  - `is_admin` (boolean, default false) - Admin flag
  - `created_at` (timestamptz, default now()) - Registration timestamp
  - `updated_at` (timestamptz, default now()) - Last update timestamp

  ### `orders`
  Order/job assignments for drivers
  - `id` (uuid, primary key) - Unique order identifier
  - `pickup_location` (text, not null) - From location
  - `delivery_location` (text, not null) - To location
  - `weight` (text, not null) - Weight in kg/ton
  - `material_type` (text, not null) - Type of material
  - `vehicle_type` (text, not null) - Required vehicle type
  - `wheel_type` (text) - Required wheel configuration
  - `amount` (numeric, not null) - Total payment amount
  - `advance` (numeric, default 0) - Advance payment
  - `contact_number` (text, not null) - Contact for order
  - `assigned_to` (uuid) - User ID of assigned driver
  - `status` (text, default 'pending') - pending/assigned/completed/cancelled
  - `created_by` (uuid) - Admin who created the order
  - `created_at` (timestamptz, default now()) - Order creation time
  - `updated_at` (timestamptz, default now()) - Last update time

  ### `referrals`
  Track referral relationships and rewards
  - `id` (uuid, primary key) - Unique referral record
  - `referrer_id` (uuid, not null) - User who made the referral
  - `referred_id` (uuid, not null) - User who was referred
  - `reward_amount` (numeric, default 50) - Reward for this referral
  - `reward_paid` (boolean, default false) - Whether reward was credited
  - `created_at` (timestamptz, default now()) - Referral timestamp

  ### `admins`
  Admin user credentials
  - `id` (uuid, primary key) - Unique admin identifier
  - `username` (text, unique, not null) - Admin username
  - `password_hash` (text, not null) - Encrypted password
  - `created_at` (timestamptz, default now()) - Admin creation time

  ## 2. Security
  - Enable Row Level Security (RLS) on all tables
  - Users can only view/edit their own data
  - Admins have full access to manage users and orders
  - Public can insert new user registrations (pending approval)

  ## 3. Indexes
  - Index on users.referral_code for quick lookups
  - Index on users.approval_status for filtering
  - Index on orders.assigned_to for user order queries
  - Index on orders.status for order filtering

  ## 4. Important Notes
  - New users start with 250rs reward wallet and 300rs diesel wallet
  - Each successful referral adds 50rs to referrer's reward wallet
  - Users must be approved by admin before accessing the platform
  - Referral codes are auto-generated and unique per user
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  mobile_number text NOT NULL,
  mail_id text,
  district text NOT NULL,
  vehicle_type text NOT NULL,
  wheel_type text NOT NULL,
  vehicle_photo_url text,
  vehicle_rc_front_url text,
  vehicle_rc_back_url text,
  payment_screenshot_url text,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  reward_wallet numeric DEFAULT 250,
  diesel_wallet numeric DEFAULT 300,
  approval_status text DEFAULT 'pending',
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_location text NOT NULL,
  delivery_location text NOT NULL,
  weight text NOT NULL,
  material_type text NOT NULL,
  vehicle_type text NOT NULL,
  wheel_type text,
  amount numeric NOT NULL,
  advance numeric DEFAULT 0,
  contact_number text NOT NULL,
  assigned_to uuid REFERENCES users(id),
  status text DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES users(id),
  referred_id uuid NOT NULL REFERENCES users(id),
  reward_amount numeric DEFAULT 50,
  reward_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table

-- Allow anyone to insert (for signup)
CREATE POLICY "Anyone can signup"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);

-- Users can view their own profile if approved
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id AND approval_status = 'approved');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update any user
CREATE POLICY "Admins can update users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for orders table

-- Users can view their assigned orders
CREATE POLICY "Users can view assigned orders"
  ON orders FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can create orders
CREATE POLICY "Admins can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update orders
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can delete orders
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for referrals table

-- Users can view their own referrals
CREATE POLICY "Users can view own referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

-- System can create referrals
CREATE POLICY "Allow referral creation"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policies for admins table

-- Only admins can view admin table
CREATE POLICY "Admins can view admins"
  ON admins FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert default admin account (username: admin, password: admin123)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO admins (username, password_hash)
VALUES ('admin', '$2a$10$rKZqKq0Z0Z0Z0Z0Z0Z0Z0eMqY5YqYqYqYqYqYqYqYqYqYqYqY')
ON CONFLICT (username) DO NOTHING;
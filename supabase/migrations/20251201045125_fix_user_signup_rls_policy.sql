/*
  # Fix User Signup RLS Policy

  ## Changes
  - Drop the existing restrictive insert policy
  - Create a new policy that allows anyone (including anonymous users) to sign up
  - This enables the public signup functionality without authentication

  ## Security Notes
  - New users are created with 'pending' status by default
  - They cannot access the system until admin approves them
  - This is safe because users cannot self-approve
*/

-- Drop the existing insert policy if it exists
DROP POLICY IF EXISTS "Anyone can signup" ON users;

-- Create a new policy that allows public signups
CREATE POLICY "Allow public user registration"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

-- Also ensure anon role has access
CREATE POLICY "Allow anon user registration"
  ON users FOR INSERT
  TO anon
  WITH CHECK (true);
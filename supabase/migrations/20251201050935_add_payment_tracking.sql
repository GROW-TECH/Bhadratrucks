/*
  # Add Payment Tracking System

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `amount` (decimal)
      - `payment_type` (text) - 'advance' or 'balance'
      - `payment_method` (text) - 'cash', 'upi', 'bank_transfer', 'other'
      - `payment_date` (timestamptz)
      - `payment_proof_url` (text, optional)
      - `notes` (text, optional)
      - `recorded_by` (uuid, foreign key to admins)
      - `created_at` (timestamptz)

  2. Changes to orders table
    - Add `balance_paid` (decimal, default 0)
    - Add `payment_status` (text, default 'pending') - 'pending', 'partial', 'completed'
    - Add `completed_at` (timestamptz, nullable)

  3. Security
    - Enable RLS on `payments` table
    - Add policies for admin access
*/

-- Add new columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'balance_paid'
  ) THEN
    ALTER TABLE orders ADD COLUMN balance_paid decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN completed_at timestamptz;
  END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_type text NOT NULL CHECK (payment_type IN ('advance', 'balance', 'partial')),
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date timestamptz NOT NULL DEFAULT now(),
  payment_proof_url text,
  notes text,
  recorded_by uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policies for payments table
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.id = auth.uid()
    )
  );

-- Users can view payments for their orders
CREATE POLICY "Users can view their order payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.assigned_to = auth.uid()
    )
  );

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

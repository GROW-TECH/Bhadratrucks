import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          mobile_number: string;
          mail_id: string | null;
          district: string;
          vehicle_type: string;
          wheel_type: string;
          vehicle_photo_url: string | null;
          vehicle_rc_front_url: string | null;
          vehicle_rc_back_url: string | null;
          payment_screenshot_url: string | null;
          referral_code: string;
          referred_by: string | null;
          reward_wallet: number;
          diesel_wallet: number;
          approval_status: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          full_name: string;
          mobile_number: string;
          mail_id?: string | null;
          district: string;
          vehicle_type: string;
          wheel_type: string;
          vehicle_photo_url?: string | null;
          vehicle_rc_front_url?: string | null;
          vehicle_rc_back_url?: string | null;
          payment_screenshot_url?: string | null;
          referral_code: string;
          referred_by?: string | null;
          reward_wallet?: number;
          diesel_wallet?: number;
          approval_status?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          password_hash?: string;
          full_name?: string;
          mobile_number?: string;
          mail_id?: string | null;
          district?: string;
          vehicle_type?: string;
          wheel_type?: string;
          vehicle_photo_url?: string | null;
          vehicle_rc_front_url?: string | null;
          vehicle_rc_back_url?: string | null;
          payment_screenshot_url?: string | null;
          referral_code?: string;
          referred_by?: string | null;
          reward_wallet?: number;
          diesel_wallet?: number;
          approval_status?: string;
          is_admin?: boolean;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          pickup_location: string;
          delivery_location: string;
          weight: string;
          material_type: string;
          vehicle_type: string;
          wheel_type: string | null;
          amount: number;
          advance: number;
          contact_number: string;
          assigned_to: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pickup_location: string;
          delivery_location: string;
          weight: string;
          material_type: string;
          vehicle_type: string;
          wheel_type?: string | null;
          amount: number;
          advance?: number;
          contact_number: string;
          assigned_to?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pickup_location?: string;
          delivery_location?: string;
          weight?: string;
          material_type?: string;
          vehicle_type?: string;
          wheel_type?: string | null;
          amount?: number;
          advance?: number;
          contact_number?: string;
          assigned_to?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          reward_amount: number;
          reward_paid: boolean;
          created_at: string;
        };
      };
      admins: {
        Row: {
          id: string;
          username: string;
          password_hash: string;
          created_at: string;
        };
      };
    };
  };
};

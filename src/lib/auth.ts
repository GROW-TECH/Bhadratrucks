import { supabase } from './supabase';

export const generateReferralCode = (): string => {
  return 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase();
};

// Removed hashPassword and verifyPassword completely

export const userLogin = async (email: string, password: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Invalid credentials');
  }

  if (data.approval_status !== 'approved') {
    throw new Error('Your account is pending approval');
  }

  return data;
};

export const adminLogin = async (username: string, password: string) => {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Invalid admin credentials');
  }

  return data;
};

export const registerUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  mobile_number: string;
  mail_id?: string;
  district: string;
  vehicle_type: string;
  wheel_type: string;
  vehicle_photo_url?: string;
  vehicle_rc_front_url?: string;
  vehicle_rc_back_url?: string;
  payment_screenshot_url?: string;
  referred_by?: string;
}) => {
  const referralCode = generateReferralCode();

  const { data, error } = await supabase
    .from('users')
    .insert({
      email: userData.email,
      password: userData.password,
      full_name: userData.full_name,
      mobile_number: userData.mobile_number,
      mail_id: userData.mail_id,
      district: userData.district,
      vehicle_type: userData.vehicle_type,
      wheel_type: userData.wheel_type,
      vehicle_photo_url: userData.vehicle_photo_url,
      vehicle_rc_front_url: userData.vehicle_rc_front_url,
      vehicle_rc_back_url: userData.vehicle_rc_back_url,
      payment_screenshot_url: userData.payment_screenshot_url,
      referral_code: referralCode,
      referred_by: userData.referred_by,
      approval_status: 'pending',
      reward_wallet: 250,
      diesel_wallet: 300,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (userData.referred_by) {
    const { data: referrer } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', userData.referred_by)
      .maybeSingle();

    if (referrer) {
      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: data.id,
        reward_amount: 50,
        reward_paid: false,
      });
    }
  }

  return data;
};

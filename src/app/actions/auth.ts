'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * 2FA / MFA Enrollment via TOTP (Google Authenticator, Authy, etc.)
 */
export async function enrollMfaAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Требуется авторизация' };
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'Animo',
    friendlyName: user.email || 'Animo Account',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    factorId: data.id,
    totpUri: data.totp.uri,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

/**
 * Verify TOTP code during enrollment or login challenge
 */
export async function verifyMfaAction(factorId: string, code: string) {
  const supabase = await createClient();
  const cleanCode = code.trim().replace(/\s+/g, '');

  if (!cleanCode || cleanCode.length < 6) {
    return { success: false, error: 'Введите 6-значный код подтверждения' };
  }

  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: cleanCode,
  });

  if (error) {
    return { success: false, error: 'Неверный код 2FA. Попробуйте еще раз.' };
  }

  return { success: true, factorId: data.user?.id };
}

/**
 * List all active MFA factors for the current user
 */
export async function listMfaFactorsAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { factors: [] };

  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { factors: [] };

  return {
    totp: data.totp || [],
    all: data.all || [],
  };
}

/**
 * Disable an existing MFA factor
 */
export async function unenrollMfaAction(factorId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, unverifiedId: data.id };
}

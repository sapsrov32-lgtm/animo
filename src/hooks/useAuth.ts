'use client';

import { useState, useEffect } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export type AuthState = 'loading' | 'guest' | 'user';

export interface UseAuthReturn {
  state: AuthState;
  user: User | null;
  session: Session | null;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // 1. Initial session lookup from browser storage / cookies
    supabase.auth.getSession().then((res: { data: { session: Session | null } }) => {
      if (!isMounted) return;
      const s = res?.data?.session;
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        setState('user');
      } else {
        setSession(null);
        setUser(null);
        setState('guest');
      }
    });

    // 2. Real-time auth state subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, s: Session | null) => {
      if (!isMounted) return;
      if (s?.user) {
        setSession(s);
        setUser(s.user);
        setState('user');
      } else {
        setSession(null);
        setUser(null);
        setState('guest');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { state, user, session };
}

import { useState } from 'react';
import { User } from '@supabase/supabase-js';

export { AuthWrapper } from './AuthWrapper';

export function useAuthWrapper() {
  const [user, setUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  return {
    user,
    loading,
    setUser: (user) => {
      setLoading(false);
      setUser(user);
    }
  };
}
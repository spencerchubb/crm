import { useState } from 'react';

export { AuthWrapper } from './AuthWrapper';

export function useAuthWrapper() {
  const [user, setUser] = useState(undefined);
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
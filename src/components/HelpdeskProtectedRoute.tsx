import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase/client';
import { Loader2 } from 'lucide-react';

export default function HelpdeskProtectedRoute({ children }: { children: JSX.Element }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!mounted) return;
      if (!session?.user) {
        setAllowed(false);
        setLoading(false);
        return;
      }
      if (session.user.user_metadata?.role !== 'helpdesk') {
        setAllowed(false);
        setLoading(false);
        return;
      }
      setAllowed(true);
      setLoading(false);
    };

    check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user || session.user.user_metadata?.role !== 'helpdesk') {
        setAllowed(false);
      } else {
        setAllowed(true);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" aria-label="Loading" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/login" replace state={{ from: location.pathname, defaultTab: 'helpdesk' }} />;
  }

  return children;
}

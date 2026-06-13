import { AuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { PropsWithChildren, useEffect, useState } from 'react';

export default function AuthProvider({ children }: PropsWithChildren) {
    const [claims, setClaims] = useState<Record<string, any> | undefined | null>();
    const [profile, setProfile] = useState<any>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Fetch the session once, and subscribe to auth state changes
    useEffect(() => {
        let isMounted = true;

        const applySession = async (session: Session | null) => {
            if (!isMounted) return;

            setIsLoggedIn(!!session);

            if (!session) {
                setClaims(null);
                setProfile(null);
                return;
            }

            const claimsResponse = await supabase.auth.getClaims();
            const nextClaims = claimsResponse.data?.claims ?? null;
            setClaims(nextClaims);

            if (!nextClaims?.sub) {
                setProfile(null);
                return;
            }

            const { data } = await (supabase as any)
                .from('profiles')
                .select('*')
                .eq('id', nextClaims.sub)
                .single();

            setProfile(data ?? null);
        };

        const fetchClaims = async () => {
            setIsLoading(true);

            const {
                data: { session },
                error,
            } = await supabase.auth.getSession();

            if (error) {
                console.error('Error fetching session:', error);
            }

            await applySession(session);

            if (isMounted) {
                setIsLoading(false);
            }
        };

        fetchClaims().then(() => null);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, _session) => {
            setIsLoading(true);
            await applySession(_session);
            if (isMounted) setIsLoading(false);
        });

        // Cleanup subscription on unmount
        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider
            value={{
                claims,
                isLoading,
                profile,
                isLoggedIn,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

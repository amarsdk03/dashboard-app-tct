import { AuthContext } from '@/hooks/use-auth-context';
import { supabase } from '@/lib/supabase';
import { PropsWithChildren, useEffect, useState } from 'react';

export default function AuthProvider({ children }: PropsWithChildren) {
    const [claims, setClaims] = useState<Record<string, any> | undefined | null>();
    const [profile, setProfile] = useState<any>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

    // Fetch the session once, and subscribe to auth state changes
    useEffect(() => {
        const fetchClaims = async () => {
            setIsLoading(true);

            // getSession is much more reliable for determining login status
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('Error fetching session:', error);
            }

            setIsLoggedIn(!!session);
            
            if (session) {
                const claimsResponse = await supabase.auth.getClaims();
                setClaims(claimsResponse.data?.claims ?? null);
            } else {
                setClaims(null);
            }
            
            setIsLoading(false);
        };

        fetchClaims();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, _session) => {
            console.log('Auth state changed:', { event: _event });
            setIsLoggedIn(!!_session);

            if (_session) {
                const { data } = await supabase.auth.getClaims();
                setClaims(data?.claims ?? null);
            } else {
                setClaims(null);
            }
        });

        // Cleanup subscription on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Fetch the profile when the claims change
    useEffect(() => {
        const fetchProfile = async () => {
            if (claims) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', claims.sub)
                    .single();

                setProfile(data);
            } else {
                setProfile(null);
            }
        };

        fetchProfile();
    }, [claims]);

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

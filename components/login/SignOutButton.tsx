import { supabase } from '@/lib/supabase';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react-native';

async function onSignOutButtonPress() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error('Error signing out:', error);
    }
}

export default function SignOutButton() {
    return (
        <Button
            onPress={onSignOutButtonPress}
            style={[styles.logoutButton]}
            className="h-12 rounded-2xl bg-red-700">
            <LogOut color="white" size={20} />
            <Text className="text-md font-bold text-white">Logout</Text>
        </Button>
    );
}

const styles = StyleSheet.create({
    logoutButton: {
        borderRadius: 16,
        height: 48,
    },
});

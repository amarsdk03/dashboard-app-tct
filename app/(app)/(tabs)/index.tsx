import { View } from 'react-native';
import { Text } from '@/components/ui/text';

import SignOutButton from '@/components/login/sign-out-button';

export default function HomeScreen() {
    return (
        <View className="flex-1 items-center justify-center p-4">
            <Text className="text-2xl font-bold mb-4">Home</Text>
            <SignOutButton />
        </View>
    );
}

import { View } from 'react-native';
import { InterText } from '@/components/InterText';

import SignOutButton from '@/components/login/sign-out-button';

export default function HomeScreen() {
    return (
        <View className="flex-1 items-center justify-center p-4">
            <InterText className="text-2xl font-bold mb-4">Home</InterText>
            <SignOutButton />
        </View>
    );
}

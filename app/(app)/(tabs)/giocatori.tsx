import { View } from 'react-native';
import { InterText } from '@/components/InterText';

export default function GiocatoriScreen() {
    return (
        <View className="flex-1 items-center justify-center p-4">
            <InterText className="text-2xl font-bold">Giocatori</InterText>
        </View>
    );
}

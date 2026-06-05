import { Alert } from 'react-native';

export default function errorMessage(prefix: string, message: string) {
    const errorMsg = `${prefix} - ${message}`;

    console.error(errorMsg);
    Alert.alert(prefix, message);
}
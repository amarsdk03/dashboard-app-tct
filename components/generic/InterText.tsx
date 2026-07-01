import { Text, TextProps } from 'react-native';

export function InterText(props: TextProps) {
    return <Text {...props} style={[{ fontFamily: 'Inter' }, props.style]} />;
}
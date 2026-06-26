import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { CircleIcon } from 'lucide-react-native';

export default function LiveCircle() {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.25,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{ opacity, marginRight: 4 }}>
            <CircleIcon size={8} color="red" fill="red" />
        </Animated.View>
    );
}

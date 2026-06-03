import { Tabs } from 'expo-router';
import { Image, StyleSheet, Platform, View, Text } from 'react-native';
import { Award, CalendarDays, LogOut, ShieldUser, UsersRound } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Button } from '@expo/ui';

/*
Navbar principale dell'applicazione, basata sulle Tabs di Expo Router:
https://docs.expo.dev/router/advanced/tabs/
*/
export default function BottomNavbar() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: '#b3642c',
                tabBarInactiveTintColor: '#888888',
                tabBarStyle: {
                    margin: 10,
                    paddingTop: Platform.OS !== 'web' ? 5 : 0,
                    position: 'absolute',
                    bottom: 10,
                    justifyContent: 'center',
                    alignSelf: 'center',
                    borderRadius: 50,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    overflow: 'hidden',
                },
                tabBarLabelStyle: {
                    fontFamily: 'Inter',
                },
                tabBarBackground: () => (
                    <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
                ),
            }}>
            <Tabs.Screen
                name="tornei"
                options={{
                    title: 'Tornei',
                    headerTitleStyle: {
                        fontFamily: 'Inter',
                    },
                    tabBarIcon: ({ color }) => <Award color={color} size={24} />,
                }}
            />

            <Tabs.Screen
                name="partite"
                options={{
                    title: 'Partite',
                    headerTitleStyle: {
                        fontFamily: 'Inter',
                    },
                    tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
                }}
            />

            <Tabs.Screen
                name="index"
                options={{
                    title: '',
                    headerTitle: 'Dashboard',
                    headerTitleStyle: {
                        fontFamily: 'Inter',
                    },
                    tabBarIconStyle: {
                        width: '100%',
                        height: '100%',
                        transform: [{ translateY: Platform.OS !== 'web' ? 4 : 0 }],
                        justifyContent: 'center',
                        alignItems: 'center',
                    },
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={require('../../../assets/images/logo.png')}
                            style={{
                                width: 64,
                                height: 64,
                                opacity: focused ? 1 : 0.7,
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="squadre"
                options={{
                    title: 'Squadre',
                    headerTitleStyle: {
                        fontFamily: 'Inter',
                    },
                    tabBarIcon: ({ color }) => <ShieldUser color={color} size={24} />,
                }}
            />

            <Tabs.Screen
                name="giocatori"
                options={{
                    title: 'Giocatori',
                    headerTitleStyle: {
                        fontFamily: 'Inter',
                    },
                    tabBarIcon: ({ color }) => <UsersRound color={color} size={24} />,
                }}
            />
        </Tabs>
    );
}

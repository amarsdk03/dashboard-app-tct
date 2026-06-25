import { Tabs } from 'expo-router';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Award, CalendarDays, ShieldUser, UsersRound } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import React from 'react';
import TabBarButton from '@/components/generic/TabBarButton';

/*
Navbar principale dell'applicazione, basata sulle Tabs di Expo Router:
https://docs.expo.dev/router/advanced/tabs/
*/
export default function BottomNavbar() {
    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarActiveTintColor: '#bf7f4b',
                tabBarInactiveTintColor: '#888888',
                tabBarStyle: {
                    margin: 10,
                    paddingTop: Platform.OS !== 'web' ? 5 : 0,
                    position: 'absolute',
                    bottom: 10,
                    justifyContent: 'center',
                    alignSelf: 'center',
                    borderRadius: 50,
                    backgroundColor:
                        Platform.OS !== 'android'
                            ? 'rgba(255, 255, 255, 0.25)'
                            : 'rgba(255, 255, 255, 0.8)',
                    borderTopWidth: 0,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 12,
                    overflow: Platform.OS === 'android' ? 'visible' : 'hidden',
                },
                tabBarLabelStyle: {
                    fontFamily: 'Inter',
                },
                tabBarBackground: () => (
                    <View
                        style={{
                            ...StyleSheet.absoluteFill,
                            borderRadius: 50,
                            overflow: 'hidden',
                            backgroundColor: 'transparent',
                        }}>
                        <BlurView
                            intensity={Platform.OS === 'web' ? 20 : 100}
                            tint="light"
                            style={StyleSheet.absoluteFill}
                        />
                    </View>
                ),
            }}>
            <Tabs.Screen
                name="tornei"
                options={{
                    title: 'Tornei',
                    headerTitle: 'Gestione tornei',
                    headerTitleStyle: {
                        fontSize: 24,
                        fontFamily: 'Inter',
                        fontWeight: '700',
                    },
                    headerLeftContainerStyle: {
                        padding: 1.5,
                    },
                    headerRightContainerStyle: {
                        padding: 18,
                    },
                    tabBarIcon: ({ color }) => <Award color={color} size={24} />,
                    headerRight: () => <TabBarButton link={'/tornei/modal?mode=create'} />,
                }}
            />

            <Tabs.Screen
                name="partite"
                options={{
                    title: 'Partite',
                    headerTitle: 'Gestione partite',
                    headerTitleStyle: {
                        fontSize: 24,
                        fontFamily: 'Inter',
                        fontWeight: '700',
                    },
                    headerLeftContainerStyle: {
                        padding: 1.5,
                    },
                    headerRightContainerStyle: {
                        padding: 18,
                    },
                    tabBarIcon: ({ color }) => <CalendarDays color={color} size={24} />,
                    headerRight: () => <TabBarButton link={'/partite/modal?mode=create'} />,
                }}
            />

            <Tabs.Screen
                name="index"
                options={{
                    title: '',
                    headerTitle: 'Dashboard',
                    headerTitleStyle: {
                        fontSize: 24,
                        fontFamily: 'Inter',
                        fontWeight: '700',
                    },
                    headerLeftContainerStyle: {
                        padding: 1.5,
                    },
                    headerRightContainerStyle: {
                        padding: 18,
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
                    headerRight: () => <TabBarButton link={'/impostazioni'} type={'settings'} />,
                }}
            />

            <Tabs.Screen
                name="squadre"
                options={{
                    title: 'Squadre',
                    headerTitle: 'Gestione squadre',
                    headerTitleStyle: {
                        fontSize: 24,
                        fontFamily: 'Inter',
                        fontWeight: '700',
                    },
                    headerLeftContainerStyle: {
                        padding: 1.5,
                    },
                    headerRightContainerStyle: {
                        padding: 18,
                    },
                    tabBarIcon: ({ color }) => <ShieldUser color={color} size={24} />,
                    headerRight: () => <TabBarButton link={'/squadre/modal?mode=create'} />,
                }}
            />

            <Tabs.Screen
                name="giocatori"
                options={{
                    title: 'Giocatori',
                    headerTitle: 'Gestione giocatori',
                    headerTitleStyle: {
                        fontSize: 24,
                        fontFamily: 'Inter',
                        fontWeight: '700',
                    },
                    headerLeftContainerStyle: {
                        padding: 1.5,
                    },
                    headerRightContainerStyle: {
                        padding: 18,
                    },
                    tabBarIcon: ({ color }) => <UsersRound color={color} size={24} />,
                    headerRight: () => <TabBarButton link={'/giocatori/modal?mode=create'} />,
                }}
            />
        </Tabs>
    );
}

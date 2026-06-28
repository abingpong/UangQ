import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Home, BarChart3, Mic, User } from 'lucide-react-native';
import { COLORS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import ReportScreen from '../screens/ReportScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VoiceInputScreen from '../screens/VoiceInputScreen';
import AccountsScreen from '../screens/AccountsScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import InvestmentsScreen from '../screens/InvestmentsScreen';
import InstallmentsScreen from '../screens/InstallmentsScreen';
import UpdatePasswordScreen from '../screens/UpdatePasswordScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ReportStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Accounts" component={AccountsScreen} />
      <HomeStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <HomeStack.Screen name="Investments" component={InvestmentsScreen} />
      <HomeStack.Screen name="Installments" component={InstallmentsScreen} />
      <HomeStack.Screen name="VoiceInput" component={VoiceInputScreen} />
    </HomeStack.Navigator>
  );
}

function ReportStackScreen() {
  return (
    <ReportStack.Navigator screenOptions={{ headerShown: false }}>
      <ReportStack.Screen name="ReportMain" component={ReportScreen} />
    </ReportStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="Accounts" component={AccountsScreen} />
      <ProfileStack.Screen name="UpdatePassword" component={UpdatePasswordScreen} />
    </ProfileStack.Navigator>
  );
}

// Placeholder for center tab
function DummyScreen() { return null; }

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.tabActive,
        tabBarInactiveTintColor: COLORS.tabInactive,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Beranda"
        component={HomeStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Laporan"
        component={ReportStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <BarChart3 size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Mic"
        component={DummyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <MicTabButton {...props} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Beranda', { screen: 'VoiceInput' });
          },
        })}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileStackScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function MicTabButton({ onPress }: any) {
  return (
    <View style={styles.micContainer}>
      <TouchableOpacity style={styles.micFab} onPress={onPress} activeOpacity={0.8}>
        <Mic size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bgTabBar,
    borderTopWidth: 0,
    height: 70,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  micContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    top: -20,
  },
  micFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
});

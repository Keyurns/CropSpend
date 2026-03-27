import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider } from './constants/ThemeContext';

// Import your screens
import LoginScreen from './screens/LoginScreen';
import ExpenseListScreen from './screens/ExpenseListScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ProfileScreen from './screens/ProfileScreen'; 
import AdminDashboardScreen from './screens/AdminDashboardScreen';



const Stack = createStackNavigator();

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Login"
          screenOptions={{
            headerShown: false, // We use custom headers in our screens
            animationEnabled: true,
            gestureEnabled: true
          }}
        >
          
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Dashboard" component={ExpenseListScreen} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
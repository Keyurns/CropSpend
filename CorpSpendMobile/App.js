import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import all our screens
import LoginScreen from './screens/LoginScreen';
import AddExpenseScreen from './screens/AddExpenseScreen';
import ExpenseListScreen from './screens/ExpenseListScreen'; // <-- NEW IMPORT

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Login Screen (Hiding the header for a cleaner look) */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        
        {/* Add Expense Screen */}
        <Stack.Screen 
          name="Dashboard" 
          component={AddExpenseScreen} 
          options={{ 
            title: 'Submit Expense',
            headerBackVisible: false // Prevents going back to login without logging out
          }} 
        />

        {/* NEW: Expense List Dashboard Screen */}
        <Stack.Screen 
          name="ExpenseList" 
          component={ExpenseListScreen} 
          options={{ 
            title: 'All Expenses' 
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
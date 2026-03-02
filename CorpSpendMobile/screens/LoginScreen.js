import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.92.90.181:5000/api'; 

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) return Alert.alert("Required", "Please fill in all fields.");
        
        setIsLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/login`, { 
                email: email.trim(), 
                password: password 
            });
            
            // 1. Save the token to the phone's storage
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('userRole', response.data.role);
            
            // 2. Navigate to the Dashboard (AddExpenseScreen)
            navigation.navigate('Dashboard'); 
            
        } catch (error) {
            console.log("LOGIN ERROR:", error.message); // Prints in VS Code terminal
            Alert.alert("Connection Failed", error.message || "Invalid credentials."); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Ionicons name="wallet" size={48} color="#4f46e5" />
                    <Text style={styles.headerTitle}>CorpSpend</Text>
                    <Text style={styles.headerSubtitle}>Enterprise Expense Management</Text>
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="employee@company.com" 
                        placeholderTextColor="#94a3b8"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>
                
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="••••••••" 
                        placeholderTextColor="#94a3b8"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>
                
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
                    <Text style={styles.buttonText}>{isLoading ? "Authenticating..." : "Sign In"}</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', padding: 20 },
    card: { backgroundColor: '#ffffff', padding: 30, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    logoContainer: { alignItems: 'center', marginBottom: 30 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginTop: 10 },
    headerSubtitle: { fontSize: 14, color: '#64748b', marginTop: 5 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, textTransform: 'uppercase' },
    input: { backgroundColor: '#f8fafc', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 16, color: '#1e293b' },
    button: { backgroundColor: '#4f46e5', paddingVertical: 16, borderRadius: 10, alignItems: 'center', marginTop: 10, shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 },
    buttonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }
});
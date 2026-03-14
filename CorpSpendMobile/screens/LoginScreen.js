import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.58.104.181:5000/api'; // KEEP YOUR LAPTOP IP HERE

export default function LoginScreen({ navigation }) {
    const [isLogin, setIsLogin] = useState(true); // Defaulting to Register based on your request
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Employee');
    const [department, setDepartment] = useState('General');

    // Dropdown States
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [showDeptPicker, setShowDeptPicker] = useState(false);

    const roles = ['Employee', 'Manager'];
    const departments = ['General', 'Finance', 'Engineering', 'HR', 'Sales'];

    const handleAuth = async () => {
        if (!email || !password || (!isLogin && !username)) {
            return Alert.alert("Required", "Please fill in all fields.");
        }
        
        setIsLoading(true);
        try {
            const endpoint = isLogin ? '/auth/login' : '/auth/register';
            const payload = isLogin 
                ? { email: email.trim(), password } 
                : { 
                    username: username.trim(), 
                    email: email.trim(), 
                    password, 
                    role: role.toLowerCase(), 
                    department 
                };

            const response = await axios.post(`${API_URL}${endpoint}`, payload);
            
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('userRole', response.data.role || role.toLowerCase());
            await AsyncStorage.setItem('userName', response.data.username || username || 'User');
            
            navigation.replace('Dashboard');
            
        } catch (error) {
            console.log("AUTH ERROR:", error.message);
            Alert.alert("Authentication Failed", error.response?.data?.msg || error.message || "Invalid credentials."); 
        } finally {
            setIsLoading(false);
        }
    };

    // Custom Dropdown UI Component
    const renderDropdown = (label, value, onPress) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.dropdownInput} onPress={onPress}>
                <Text style={styles.dropdownText}>{value}</Text>
                <Ionicons name="chevron-down" size={20} color="#cbd5e1" />
            </TouchableOpacity>
        </View>
    );

    // Modal Picker Component for Dropdowns
    const renderPickerModal = (visible, setVisible, data, onSelect, title) => (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select {title}</Text>
                    <FlatList 
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({item}) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); setVisible(false); }}>
                                <Text style={styles.modalItemText}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <Text style={styles.headerTitle}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </Text>

                    {!isLogin && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Username</Text>
                            <TextInput 
                                style={styles.input} 
                                placeholder="Your name" 
                                placeholderTextColor="#64748b"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="words"
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="you@company.com" 
                            placeholderTextColor="#64748b"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {!isLogin && renderDropdown("Role", role, () => setShowRolePicker(true))}
                    {!isLogin && renderDropdown("Department", department, () => setShowDeptPicker(true))}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="••••••••" 
                            placeholderTextColor="#64748b"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                    
                    <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{isLogin ? "Login" : "Register"}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Toggle Button for Login/Signup */}
                    <TouchableOpacity 
                        style={styles.toggleContainer} 
                        onPress={() => {
                            setIsLogin(!isLogin);
                            setEmail(''); setPassword(''); setUsername('');
                        }}
                    >
                        <Text style={styles.toggleText}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Text style={styles.toggleTextLink}>{isLogin ? "Register here" : "Login here"}</Text>
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Dropdown Modals */}
            {renderPickerModal(showRolePicker, setShowRolePicker, roles, setRole, "Role")}
            {renderPickerModal(showDeptPicker, setShowDeptPicker, departments, setDepartment, "Department")}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // Dark Theme Colors matching your screenshot
    container: { flex: 1, backgroundColor: '#2E3246' }, 
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    
    headerTitle: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', marginBottom: 30 },

    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, color: '#f8fafc', marginBottom: 8, fontWeight: '500' },
    
    input: { 
        backgroundColor: '#40455B', // Darker input background
        borderWidth: 1, 
        borderColor: '#545B77', 
        borderRadius: 8, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
        color: '#FFFFFF' 
    },

    // Custom Dropdown Styles
    dropdownInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#40455B', 
        borderWidth: 1, 
        borderColor: '#545B77', 
        borderRadius: 8, 
        paddingHorizontal: 16, 
        paddingVertical: 14,
    },
    dropdownText: { fontSize: 16, color: '#FFFFFF' },
    
    button: { 
        backgroundColor: '#5243F2', // Vibrant Purple from your screenshot
        paddingVertical: 16, 
        borderRadius: 8, 
        alignItems: 'center', 
        marginTop: 10, 
        elevation: 2 
    },
    buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },

    toggleContainer: { marginTop: 24, alignItems: 'center' },
    toggleText: { fontSize: 14, color: '#94a3b8' },
    toggleTextLink: { color: '#818CF8', fontWeight: '500' }, // Lighter purple for link

    // Modal Picker Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#2E3246', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#545B77' },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 15 },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#40455B' },
    modalItemText: { fontSize: 16, color: '#FFFFFF' }
});
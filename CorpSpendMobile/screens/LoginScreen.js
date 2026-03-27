import React, { useState, useContext } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
    KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView, 
    Modal, FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext'; 
import { API_URL } from '../constants/Config';

export default function LoginScreen({ navigation }) {
    const { colors, theme } = useContext(ThemeContext); 
    
    const [isLogin, setIsLogin] = useState(true); 
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

    const [idProofUri, setIdProofUri] = useState(null); // 👈 New state for ID Proof

const pickIdProof = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
    });

    if (!result.canceled) {
        setIdProofUri(result.assets[0].uri);
    }
};

const handleAuth = async () => {
    if (!email || !password || (!isLogin && !username)) {
        return Alert.alert("Required", "Please fill in all fields.");
    }

    if (!isLogin && !idProofUri) {
        return Alert.alert("ID Required", "Please upload an ID proof for admin verification.");
    }
    
    setIsLoading(true);
    try {
        if (isLogin) {
            // --- LOGIN FLOW (Guarded against 'Pending' users) ---
            const response = await axios.post(`${API_URL}/auth/login`, { 
                email: email.trim().toLowerCase(), 
                password 
            });
            
            await AsyncStorage.setItem('userToken', response.data.token);
            await AsyncStorage.setItem('userRole', response.data.role);
            await AsyncStorage.setItem('userName', response.data.username);
            if (response.data.profilePicUrl) {
                await AsyncStorage.setItem('userProfilePic', response.data.profilePicUrl);
            }
            
            navigation.replace('Dashboard'); 

        } else {
            // --- REGISTRATION FLOW (Sending ID Proof via FormData) ---
            const formData = new FormData();
            formData.append('username', username.trim());
            formData.append('email', email.trim().toLowerCase());
            formData.append('password', password);
            formData.append('department', department);
            // Notice we do NOT send 'role' here anymore, as the Admin assigns it later!

            const filename = idProofUri.split('/').pop();
            const type = `image/${filename.split('.').pop()}`;
            formData.append('idProof', { uri: idProofUri, name: filename, type });

            await axios.post(`${API_URL}/auth/register`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            Alert.alert(
                "Registration Submitted", 
                "Your account is pending Admin approval. You will be able to log in once verified.",
                [{ text: "OK", onPress: () => setIsLogin(true) }] // Switch back to login view
            );
            
            // Clear fields
            setEmail(''); setPassword(''); setUsername(''); setIdProofUri(null);
        }
        
    } catch (error) {
        console.log("AUTH ERROR:", error.message);
        // This catches the backend rejecting a login because the status is still "Pending"
        Alert.alert("Authentication Failed", error.response?.data?.msg || "Check your credentials."); 
    } finally {
        setIsLoading(false);
    }
};

    // UI Helper: Custom Dropdown
    const renderDropdown = (label, value, onPress) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <TouchableOpacity 
                style={[styles.dropdownInput, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={onPress}
            >
                <Text style={[styles.dropdownText, { color: colors.text }]}>{value}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.subtext} />
            </TouchableOpacity>
        </View>
    );

    // UI Helper: Picker Modal
    const renderPickerModal = (visible, setVisible, data, onSelect, title) => (
        <Modal visible={visible} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Select {title}</Text>
                    <FlatList 
                        data={data}
                        keyExtractor={(item) => item}
                        renderItem={({item}) => (
                            <TouchableOpacity style={[styles.modalItem, { borderBottomColor: colors.border }]} onPress={() => { onSelect(item); setVisible(false); }}>
                                <Text style={[styles.modalItemText, { color: colors.text }]}>{item}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    <View style={styles.logoContainer}>
                        <View style={styles.logoCircle}>
                            <Ionicons name="flash" size={32} color="#fff" />
                        </View>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </Text>
                    </View>

                    {!isLogin && (
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                                placeholder="Your name" 
                                placeholderTextColor={colors.subtext}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="words"
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                            placeholder="you@company.com" 
                            placeholderTextColor={colors.subtext}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {!isLogin && renderDropdown("Role", role, () => setShowRolePicker(true))}
                    {!isLogin && renderDropdown("Department", department, () => setShowDeptPicker(true))}
                    {!isLogin && (
    <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: colors.text }]}>ID Proof (Required)</Text>
        <TouchableOpacity 
            style={[styles.dropdownInput, { backgroundColor: colors.card, borderColor: colors.primary, borderStyle: 'dashed' }]} 
            onPress={pickIdProof}
        >
            <Text style={[styles.dropdownText, { color: idProofUri ? '#10B981' : colors.subtext }]}>
                {idProofUri ? "✓ ID Proof Attached" : "Tap to Upload ID Image"}
            </Text>
            <Ionicons name={idProofUri ? "checkmark-circle" : "cloud-upload-outline"} size={20} color={idProofUri ? '#10B981' : colors.subtext} />
        </TouchableOpacity>
    </View>
)}

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                        <TextInput 
                            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                            placeholder="••••••••" 
                            placeholderTextColor={colors.subtext}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                    
                    <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>{isLogin ? "Sign In" : "Get Started"}</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.toggleContainer} 
                        onPress={() => {
                            setIsLogin(!isLogin);
                            setEmail(''); setPassword(''); setUsername('');
                        }}
                    >
                        <Text style={[styles.toggleText, { color: colors.subtext }]}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <Text style={styles.toggleTextLink}>{isLogin ? "Register here" : "Login here"}</Text>
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {renderPickerModal(showRolePicker, setShowRolePicker, roles, setRole, "Role")}
            {renderPickerModal(showDeptPicker, setShowDeptPicker, departments, setDepartment, "Department")}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 }, 
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    logoContainer: { alignItems: 'center', marginBottom: 30 },
    logoCircle: { width: 64, height: 64, backgroundColor: '#5243F2', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    headerTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, marginBottom: 8, fontWeight: '600' },
    input: { 
        borderWidth: 1.5, 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 14, 
        fontSize: 16, 
    },
    dropdownInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1.5, 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 14,
    },
    dropdownText: { fontSize: 16 },
    button: { 
        backgroundColor: '#5243F2', 
        paddingVertical: 18, 
        borderRadius: 14, 
        alignItems: 'center', 
        marginTop: 10, 
        elevation: 4,
        shadowColor: '#5243F2',
        shadowOpacity: 0.3,
        shadowRadius: 8
    },
    buttonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
    toggleContainer: { marginTop: 24, alignItems: 'center' },
    toggleText: { fontSize: 14 },
    toggleTextLink: { color: '#5243F2', fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 18, padding: 20, borderWidth: 1 },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 15 },
    modalItem: { paddingVertical: 15, borderBottomWidth: 1 },
    modalItemText: { fontSize: 16 }
});
import React, { useState, useContext, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Image, 
    TextInput, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext';

const API_URL = 'http://10.43.180.181:5000/api'; 

export default function ProfileScreen({ navigation }) {
    const { colors, theme } = useContext(ThemeContext);
    
    const [username, setUsername] = useState('');
    const [role, setRole] = useState('');
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const loadUserData = async () => {
            const name = await AsyncStorage.getItem('userName');
            const userRole = await AsyncStorage.getItem('userRole');
            const pic = await AsyncStorage.getItem('userProfilePic');
            if (name) setUsername(name);
            if (userRole) setRole(userRole);
            if (pic) setProfilePic(pic);
        };
        loadUserData();
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            uploadProfilePic(result.assets[0].uri);
        }
    };

    const uploadProfilePic = async (uri) => {
        setUploading(true);
        const formData = new FormData();
        const filename = uri.split('/').pop();
        const type = `image/${filename.split('.').pop()}`;

        formData.append('profilePic', { uri, name: filename, type });

        try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await axios.put(`${API_URL}/users/profile`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token 
                }
            });

            const newPicUrl = res.data.profilePicUrl;
            setProfilePic(newPicUrl);
            await AsyncStorage.setItem('userProfilePic', newPicUrl);
            Alert.alert("Success", "Profile picture updated!");
        } catch (error) {
            Alert.alert("Upload Failed", "Could not save image to server.");
        } finally {
            setUploading(false);
        }
    };

    const handleUpdateName = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(`${API_URL}/users/profile`, { username }, {
                headers: { 'x-auth-token': token }
            });
            await AsyncStorage.setItem('userName', username);
            Alert.alert("Success", "Username updated!");
        } catch (error) {
            Alert.alert("Error", "Failed to update name.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* --- PROFILE IMAGE SECTION --- */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        {profilePic ? (
                            <Image source={{ uri: profilePic }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="person" size={40} color={colors.subtext} />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
                            {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={18} color="#fff" />}
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.roleLabel, { color: colors.subtext }]}>{role.toUpperCase()}</Text>
                </View>

                {/* --- SETTINGS FORM --- */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.label, { color: colors.text }]}>Display Name</Text>
                    <TextInput 
                        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                        value={username}
                        onChangeText={setUsername}
                    />
                    
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
                        onPress={handleUpdateName}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                    </TouchableOpacity>
                </View>

                <View style={styles.infoSection}>
                    <Text style={[styles.infoTitle, { color: colors.subtext }]}>ACCOUNT SECURITY</Text>
                    <TouchableOpacity style={styles.infoRow}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.subtext} />
                        <Text style={[styles.infoText, { color: colors.text }]}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={18} color={colors.subtext} />
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: '#5243F2' },
    editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#5243F2', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWhite: 3, borderColor: '#fff' },
    roleLabel: { marginTop: 12, fontWeight: 'bold', letterSpacing: 1, fontSize: 12 },
    card: { padding: 20, borderRadius: 20, borderWidth: 1 },
    label: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
    input: { borderWidth: 1.5, borderRadius: 12, padding: 12, fontSize: 16, marginBottom: 20 },
    saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold' },
    infoSection: { marginTop: 40 },
    infoTitle: { fontSize: 12, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
    infoText: { flex: 1, fontSize: 16, fontWeight: '500' }
});
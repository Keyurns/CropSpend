import React, { useEffect, useState, useContext } from 'react';
import { 
    View, Text, FlatList, TouchableOpacity, StyleSheet, 
    Alert, ActivityIndicator, Image, Modal, ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext';
import { API_URL } from '../constants/Config';

export default function AdminDashboardScreen({ navigation }) {
    const { colors, theme } = useContext(ThemeContext);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State for Reviewing ID & Assigning Role
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState('employee');
    const [showReviewModal, setShowReviewModal] = useState(false);

    const roles = ['employee', 'manager', 'admin'];

    const fetchPendingUsers = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            // Ensure your backend has this route to fetch users where status === 'Pending'
            const res = await axios.get(`${API_URL}/users/pending`, {
                headers: { 'x-auth-token': token }
            });
            setPendingUsers(res.data);
        } catch (error) {
            console.log("Fetch Pending Error:", error);
            Alert.alert("Error", "Could not fetch pending users.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchPendingUsers();
        });
        return unsubscribe;
    }, [navigation]);

    const handleApprove = async () => {
        if (!selectedUser) return;
        
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(`${API_URL}/users/approve/${selectedUser._id}`, 
                { status: 'Approved', role: selectedRole }, 
                { headers: { 'x-auth-token': token } }
            );
            
            Alert.alert("Success", `${selectedUser.username} has been approved as a ${selectedRole.toUpperCase()}.`);
            setShowReviewModal(false);
            fetchPendingUsers(); // Refresh the list
        } catch (error) {
            Alert.alert("Error", "Failed to approve user.");
        }
    };

    const handleReject = async (userId) => {
        Alert.alert("Reject User", "Are you sure you want to reject this registration?", [
            { text: "Cancel", style: "cancel" },
            { text: "Reject", style: "destructive", onPress: async () => {
                try {
                    const token = await AsyncStorage.getItem('userToken');
                    await axios.put(`${API_URL}/users/approve/${userId}`, 
                        { status: 'Rejected' }, 
                        { headers: { 'x-auth-token': token } }
                    );
                    Alert.alert("Rejected", "User has been denied access.");
                    setShowReviewModal(false);
                    fetchPendingUsers();
                } catch (error) {
                    Alert.alert("Error", "Failed to reject user.");
                }
            }}
        ]);
    };

    const openReviewModal = (user) => {
        setSelectedUser(user);
        setSelectedRole('employee'); // Default role
        setShowReviewModal(true);
    };

    const renderUserCard = ({ item }) => (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={[styles.userName, { color: colors.text }]}>{item.username}</Text>
                    <Text style={[styles.userEmail, { color: colors.subtext }]}>{item.email}</Text>
                </View>
                <View style={[styles.deptBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.deptText, { color: colors.primary }]}>{item.department}</Text>
                </View>
            </View>
            
            <TouchableOpacity 
                style={[styles.reviewBtn, { backgroundColor: colors.primary }]} 
                onPress={() => openReviewModal(item)}
            >
                <Ionicons name="id-card-outline" size={18} color="#fff" />
                <Text style={styles.reviewBtnText}>Review ID & Approve</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, {backgroundColor: colors.card}]}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Access Management</Text>
                <View style={{ width: 44 }} />
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 50 }} />
            ) : (
                <FlatList 
                    data={pendingUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderUserCard}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Ionicons name="shield-checkmark-outline" size={60} color={colors.subtext} />
                            <Text style={[styles.emptyText, { color: colors.subtext }]}>No pending registrations.</Text>
                        </View>
                    )}
                />
            )}

            {/* --- REVIEW MODAL --- */}
            <Modal visible={showReviewModal} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Review Applicant</Text>
                        <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                            <Ionicons name="close-circle" size={30} color={colors.subtext} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {selectedUser && (
                            <>
                                <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                    <Text style={[styles.infoLabel, { color: colors.subtext }]}>Name: <Text style={{ color: colors.text, fontWeight: 'bold' }}>{selectedUser.username}</Text></Text>
                                    <Text style={[styles.infoLabel, { color: colors.subtext }]}>Email: <Text style={{ color: colors.text, fontWeight: 'bold' }}>{selectedUser.email}</Text></Text>
                                    <Text style={[styles.infoLabel, { color: colors.subtext }]}>Department: <Text style={{ color: colors.text, fontWeight: 'bold' }}>{selectedUser.department}</Text></Text>
                                </View>

                                <Text style={[styles.sectionTitle, { color: colors.text }]}>ID Proof Submitted</Text>
                                <View style={[styles.imageContainer, { borderColor: colors.border }]}>
                                    {selectedUser.idProofUrl ? (
                                        <Image 
                                            source={{ uri: selectedUser.idProofUrl }} 
                                            style={styles.idImage} 
                                            resizeMode="contain" 
                                        />
                                    ) : (
                                        <Text style={{ color: colors.subtext }}>No ID Proof provided.</Text>
                                    )}
                                </View>

                                <Text style={[styles.sectionTitle, { color: colors.text }]}>Assign Role</Text>
                                <View style={styles.roleContainer}>
                                    {roles.map(r => (
                                        <TouchableOpacity 
                                            key={r}
                                            style={[
                                                styles.roleChip, 
                                                { 
                                                    backgroundColor: selectedRole === r ? colors.primary : colors.card,
                                                    borderColor: selectedRole === r ? colors.primary : colors.border
                                                }
                                            ]}
                                            onPress={() => setSelectedRole(r)}
                                        >
                                            <Text style={{ 
                                                color: selectedRole === r ? '#fff' : colors.text,
                                                fontWeight: 'bold', textTransform: 'uppercase', fontSize: 12
                                            }}>
                                                {r}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <View style={styles.actionRow}>
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, styles.rejectBtn]} 
                                        onPress={() => handleReject(selectedUser._id)}
                                    >
                                        <Text style={styles.rejectText}>Reject</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                        style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
                                        onPress={handleApprove}
                                    >
                                        <Text style={styles.approveText}>Approve Access</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
    backBtn: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    listContent: { padding: 20 },
    card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    userEmail: { fontSize: 14 },
    deptBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    deptText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
    reviewBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
    reviewBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    emptyState: { alignItems: 'center', marginTop: 80 },
    emptyText: { fontSize: 16, marginTop: 15 },
    
    // Modal Styles
    modalContainer: { flex: 1, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    modalTitle: { fontSize: 24, fontWeight: 'bold' },
    infoBox: { padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
    infoLabel: { fontSize: 14, marginBottom: 5 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
    imageContainer: { height: 250, borderRadius: 12, borderWidth: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
    idImage: { width: '100%', height: '100%' },
    roleContainer: { flexDirection: 'row', gap: 10, marginBottom: 30 },
    roleChip: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
    actionRow: { flexDirection: 'row', gap: 15, marginBottom: 40 },
    actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    rejectBtn: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#EF4444' },
    rejectText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
    approveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
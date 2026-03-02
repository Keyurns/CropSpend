import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'http://10.92.90.181:5000/api'; 

export default function ExpenseListScreen() {
    const [expenses, setExpenses] = useState([]);
    const [role, setRole] = useState('employee');
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const storedRole = await AsyncStorage.getItem('userRole');
            setRole(storedRole || 'employee');

            const res = await axios.get(`${API_URL}/expenses`, {
                headers: { 'x-auth-token': token }
            });
            setExpenses(res.data);
        } catch (error) {
            Alert.alert("Error", "Could not fetch expenses.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // NEW: Function to handle Approval/Rejection with Reason
    const handleAction = async (id, status) => {
        if (status === 'Rejected') {
            // Ask for a reason before rejecting
            Alert.prompt(
                "Reject Expense",
                "Provide a reason for the employee:",
                [
                    { text: "Cancel", style: "cancel" },
                    { 
                        text: "Confirm Rejection", 
                        style: "destructive",
                        onPress: (reason) => processUpdate(id, status, reason) 
                    }
                ],
                "plain-text"
            );
        } else {
            processUpdate(id, status, "Approved by Manager");
        }
    };

    const processUpdate = async (id, status, reason) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            
            // The key here MUST be 'reason' to match the backend 'const { reason } = req.body'
            await axios.put(`${API_URL}/expenses/approve/${id}`, 
                { 
                    status: status, 
                    reason: reason  // This must be named 'reason'
                }, 
                { headers: { 'x-auth-token': token } }
            );
            
            Alert.alert("Success", "Employee has been notified.");
            fetchExpenses();
        } catch (error) {
            Alert.alert("Error", "Failed to send rejection.");
        }
    };

    const renderExpenseCard = ({ item }) => {
        const isManager = role === 'manager' || role === 'admin';

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.amount}>₹{Number(item.amount).toLocaleString()}</Text>
                </View>

                {isManager && item.requestedBy && (
                    <Text style={styles.requestedBy}>By: {item.requestedBy.email}</Text>
                )}

                <View style={styles.badgeRow}>
                    <View style={[styles.statusBadge, 
                        item.status === 'Approved' ? styles.bgEmerald : 
                        item.status === 'Pending' ? styles.bgAmber : styles.bgRed]}>
                        <Text style={[styles.statusText, 
                            item.status === 'Approved' ? styles.textEmerald : 
                            item.status === 'Pending' ? styles.textAmber : styles.textRed]}>
                            {item.status}
                        </Text>
                    </View>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>

                {item.isFlagged && isManager && (
                    <View style={styles.aiFlagContainer}>
                        <Ionicons name="warning" size={16} color="#b91c1c" />
                        <Text style={styles.aiFlagText}>AI FLAG: SPENDING ANOMALY</Text>
                    </View>
                )}

                {/* Show rejection reason if it exists */}
                {item.reason && item.status === 'Rejected' && (
                    <Text style={styles.reasonText}>Note: {item.reason}</Text>
                )}

                {isManager && item.status === 'Pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => handleAction(item._id, 'Approved')}>
                            <Ionicons name="checkmark" size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleAction(item._id, 'Rejected')}>
                            <Ionicons name="close" size={18} color="#fff" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <ActivityIndicator size="large" color="#4f46e5" style={{ flex: 1, justifyContent: 'center' }} />;

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Expense Dashboard</Text>
            <FlatList 
                data={expenses}
                keyExtractor={(item) => item._id}
                renderItem={renderExpenseCard}
                onRefresh={fetchExpenses}
                refreshing={loading}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f1f5f9', padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    title: { fontSize: 16, fontWeight: '700', color: '#1e293b', flex: 1 },
    amount: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
    requestedBy: { fontSize: 13, color: '#64748b', marginBottom: 8 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
    categoryText: { fontSize: 13, color: '#64748b' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    bgEmerald: { backgroundColor: '#d1fae5' }, textEmerald: { color: '#047857' },
    bgAmber: { backgroundColor: '#fef3c7' }, textAmber: { color: '#b45309' },
    bgRed: { backgroundColor: '#fee2e2' }, textRed: { color: '#b91c1c' },
    aiFlagContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 8, borderRadius: 8, marginTop: 5 },
    aiFlagText: { color: '#b91c1c', fontSize: 11, fontWeight: '800', marginLeft: 6 },
    reasonText: { fontSize: 13, color: '#ef4444', fontStyle: 'italic', marginTop: 5 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 5 },
    approveBtn: { backgroundColor: '#10b981' },
    rejectBtn: { backgroundColor: '#ef4444' },
    actionBtnText: { color: '#fff', fontWeight: 'bold' }
});
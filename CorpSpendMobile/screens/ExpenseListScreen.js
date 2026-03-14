import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const API_URL = 'http://10.30.63.75:5000/api'; // KEEP YOUR LAPTOP IP HERE

export default function ExpenseListScreen({ navigation }) {
    const [expenses, setExpenses] = useState([]);
    const [role, setRole] = useState('employee');
    const [username, setUsername] = useState('User');
    const [loading, setLoading] = useState(true);
    const [totalSpent, setTotalSpent] = useState(0);
    const [categoryData, setCategoryData] = useState({});

    const fetchExpenses = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const storedRole = await AsyncStorage.getItem('userRole');
            const storedName = await AsyncStorage.getItem('userName'); 
            
            setRole(storedRole || 'employee');
            if (storedName) setUsername(storedName);

            const res = await axios.get(`${API_URL}/expenses`, {
                headers: { 'x-auth-token': token }
            });
            setExpenses(res.data);

            // 100% Dynamic Math for Charts & Budgets
            let total = 0;
            let catTotals = {};

            res.data.forEach(item => {
                const amt = Number(item.amount || 0);
                total += amt;
                
                // Group by category for the chart
                const cat = item.category || 'Other';
                catTotals[cat] = (catTotals[cat] || 0) + amt;
            });

            setTotalSpent(total);
            setCategoryData(catTotals);

        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    // Refresh data every time this screen is focused
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchExpenses();
        });
        return unsubscribe;
    }, [navigation]);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Logout", 
                    style: "destructive", 
                    onPress: async () => {
                        await AsyncStorage.clear();
                        navigation.replace('Login');
                    }
                }
            ]
        );
    };

    const processUpdate = async (id, status, reason) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(`${API_URL}/expenses/approve/${id}`, { status, reason }, { headers: { 'x-auth-token': token } });
            fetchExpenses(); 
        } catch (error) {
            Alert.alert("Error", "Failed to update expense.");
        }
    };

    const isManager = role === 'manager' || role === 'admin';
    const budgetLimit = isManager ? 500000 : 50000;
    const remaining = budgetLimit - totalSpent;
    const progressPercent = Math.min((totalSpent / budgetLimit) * 100, 100).toFixed(1);

    const getCategoryIcon = (category) => {
        switch(category?.toLowerCase()) {
            case 'food': return { name: 'silverware-fork-knife', color: '#ef4444' };
            case 'transport': return { name: 'car', color: '#3b82f6' };
            default: return { name: 'receipt', color: '#10b981' };
        }
    };
    const renderDashboardHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
                <View>
                    {/* UPDATED GREETING LOGIC */}
                    <Text style={styles.greeting}>
                        {isManager ? `Welcome, ${username} ` : `Hello, ${username}! `}
                    </Text>
                    <Text style={styles.subGreeting}>
                        {isManager ? 'Company Dashboard & Approvals' : 'Track your expenses wisely'}
                    </Text>
                </View>
                <View style={{flexDirection: 'row', gap: 8}}>
                    <TouchableOpacity style={styles.exportButton} onPress={() => setExportModalVisible(true)}>
                        <Ionicons name="download-outline" size={22} color="#6366F1" />
                    </TouchableOpacity>
                    
                    {!isManager && (
                        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddExpense')}>
                            <Ionicons name="add" size={24} color="#fff" />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>
            

            {/* Purple Budget Card */}
            <View style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                    <View>
                        <Text style={styles.budgetLabel}>{isManager ? 'Total Company Spend' : 'Total Spent This Month'}</Text>
                        <Text style={styles.budgetAmount}>₹{totalSpent.toLocaleString()}</Text>
                    </View>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="currency-inr" size={28} color="#fff" />
                    </View>
                </View>

                <View style={styles.budgetDetails}>
                    <Text style={styles.budgetText}>Budget: ₹{budgetLimit.toLocaleString()}</Text>
                    <Text style={styles.budgetText}>Remaining: ₹{remaining > 0 ? remaining.toLocaleString() : '0'}</Text>
                </View>

                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: progressPercent > 90 ? '#ef4444' : '#FFFFFF' }]} />
                </View>
            </View>

            {/* DYNAMIC CATEGORY BAR CHART */}
            {Object.keys(categoryData).length > 0 && (
                <View style={styles.chartCard}>
                    <Text style={styles.sectionTitle}>Spending by Category</Text>
                    {Object.keys(categoryData).map((cat, index) => {
                        const amt = categoryData[cat];
                        const catPercent = ((amt / totalSpent) * 100).toFixed(0);
                        const iconData = getCategoryIcon(cat);
                        
                        return (
                            <View key={index} style={styles.chartRow}>
                                <View style={styles.chartLabelContainer}>
                                    <Text style={styles.chartCatName}>{cat}</Text>
                                    <Text style={styles.chartCatAmount}>₹{amt.toLocaleString()}</Text>
                                </View>
                                <View style={styles.chartBarBackground}>
                                    <View style={[styles.chartBarFill, { width: `${catPercent}%`, backgroundColor: iconData.color }]} />
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}

            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            
            {/* Empty State Message */}
            {expenses.length === 0 && (
                <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyStateText}>No expenses logged yet.</Text>
                </View>
            )}
        </View>
    );

    const renderExpenseCard = ({ item }) => {
        const iconData = getCategoryIcon(item.category);
        return (
            <View style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                    <View style={[styles.transactionIconBg, { backgroundColor: iconData.color + '20' }]}>
                        <MaterialCommunityIcons name={iconData.name} size={24} color={iconData.color} />
                    </View>
                    <View style={styles.transactionDetails}>
                        <Text style={styles.transactionTitle}>{item.title}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={styles.transactionCategory}>{item.category}</Text>
                            <Text style={styles.bullet}> • </Text>
                            <Text style={[styles.transactionStatus, { color: item.status === 'Approved' ? '#10b981' : item.status === 'Rejected' ? '#ef4444' : '#f59e0b' }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.transactionAmount}>₹{Number(item.amount || 0).toLocaleString()}</Text>
                </View>

                {item.isFlagged && isManager && (
                    <View style={styles.aiFlagContainer}>
                        <Ionicons name="warning" size={16} color="#b91c1c" />
                        <Text style={styles.aiFlagText}>AI FLAG: SPENDING ANOMALY</Text>
                    </View>
                )}

                {isManager && item.status === 'Pending' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={[styles.actionBtn, styles.approveBtn]} onPress={() => processUpdate(item._id, 'Approved', 'Looks good.')}>
                            <Ionicons name="checkmark" size={16} color="#10b981" />
                            <Text style={[styles.actionBtnText, {color: '#10b981'}]}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => {
                            Alert.prompt("Reject Expense", "Provide a reason:", 
                                [{ text: "Cancel", style: "cancel" }, { text: "Reject", style: "destructive", onPress: (reason) => processUpdate(item._id, 'Rejected', reason) }]
                            );
                        }}>
                            <Ionicons name="close" size={16} color="#ef4444" />
                            <Text style={[styles.actionBtnText, {color: '#ef4444'}]}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <ActivityIndicator size="large" color="#6366F1" style={{ flex: 1, justifyContent: 'center' }} />;

    return (
        <SafeAreaView style={styles.container}>
            <FlatList 
                data={expenses}
                keyExtractor={(item, index) => item._id || index.toString()}
                ListHeaderComponent={renderDashboardHeader}
                renderItem={renderExpenseCard}
                onRefresh={fetchExpenses}
                refreshing={loading}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    headerContainer: { marginBottom: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10 },
    greeting: { fontSize: 24, fontWeight: 'bold', color: '#1E293B' },
    subGreeting: { fontSize: 14, color: '#64748B', marginTop: 4 },
    addButton: { backgroundColor: '#6366F1', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    logoutButton: { backgroundColor: '#fef2f2', width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    budgetCard: { backgroundColor: '#6366F1', borderRadius: 24, padding: 24, marginBottom: 24, elevation: 6 },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    budgetLabel: { color: '#E0E7FF', fontSize: 14, fontWeight: '500' },
    budgetAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
    iconCircle: { backgroundColor: 'rgba(255,255,255,0.2)', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    budgetDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 12 },
    budgetText: { color: '#E0E7FF', fontSize: 13, fontWeight: '500' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    
    // Chart Styles
    chartCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, marginBottom: 24, elevation: 2 },
    chartRow: { marginBottom: 12 },
    chartLabelContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    chartCatName: { fontSize: 14, fontWeight: '600', color: '#475569' },
    chartCatAmount: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    chartBarBackground: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
    chartBarFill: { height: '100%', borderRadius: 4 },

    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyStateText: { marginTop: 10, color: '#94a3b8', fontSize: 16 },

    transactionCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, elevation: 2 },
    transactionRow: { flexDirection: 'row', alignItems: 'center' },
    transactionIconBg: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    transactionDetails: { flex: 1 },
    transactionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
    transactionCategory: { fontSize: 13, color: '#64748B' },
    bullet: { fontSize: 13, color: '#CBD5E1' },
    transactionStatus: { fontSize: 13, fontWeight: '700' },
    transactionAmount: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    aiFlagContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 10, borderRadius: 10, marginTop: 12 },
    aiFlagText: { color: '#b91c1c', fontSize: 12, fontWeight: '800', marginLeft: 6 },
    actionRow: { flexDirection: 'row', gap: 10, marginTop: 15, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 15 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 5, borderWidth: 1 },
    approveBtn: { borderColor: '#10b981', backgroundColor: '#ecfdf5' },
    rejectBtn: { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
    actionBtnText: { fontWeight: 'bold' }
});
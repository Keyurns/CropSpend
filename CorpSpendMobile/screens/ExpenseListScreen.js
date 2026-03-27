import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeContext } from '../constants/ThemeContext'; 
import { API_URL } from '../constants/Config';

export default function ExpenseListScreen({ navigation }) {
    const { theme, toggleTheme, colors } = useContext(ThemeContext);
    const [expenses, setExpenses] = useState([]);
    const [role, setRole] = useState('employee');
    const [username, setUsername] = useState('User');
    const [profilePic, setProfilePic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // 👈 Dedicated refresh state
    const [totalSpent, setTotalSpent] = useState(0);

    const fetchExpenses = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            const storedRole = await AsyncStorage.getItem('userRole');
            const storedName = await AsyncStorage.getItem('userName'); 
            const storedPic = await AsyncStorage.getItem('userProfilePic'); 
            
            setRole(storedRole || 'employee');
            if (storedName) setUsername(storedName);
            if (storedPic) setProfilePic(storedPic);

            const res = await axios.get(`${API_URL}/expenses`, {
                headers: { 'x-auth-token': token }
            });
            
            // Filter out rejected expenses for total calculation just like Web
            const validExpenses = res.data.filter(e => e.status !== 'Rejected');
            const total = validExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
            
            setExpenses(res.data);
            setTotalSpent(total);
        } catch (error) {
            console.log("Fetch Error:", error);
            if (error.response?.status === 401) navigation.replace('Login');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchExpenses(true); 
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchExpenses();
        });
        return unsubscribe;
    }, [navigation]);

    const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive", onPress: async () => {
                await AsyncStorage.clear();
                navigation.replace('Login');
            }}
        ]);
    };

    const processUpdate = async (id, status) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.put(`${API_URL}/expenses/approve/${id}`, { status }, { headers: { 'x-auth-token': token } });
            fetchExpenses(true); 
        } catch (error) {
            Alert.alert("Error", "Failed to update expense.");
        }
    };

    const isManager = role === 'manager' || role === 'admin';
    const budgetLimit = isManager ? 500000 : 50000;
    const progressPercent = Math.min((totalSpent / budgetLimit) * 100, 100);

    const getCategoryIcon = (category) => {
        switch(category?.toLowerCase()) {
            case 'food': return { name: 'silverware-fork-knife', color: '#ef4444' };
            case 'travel': return { name: 'airplane', color: '#3b82f6' };
            case 'software': return { name: 'laptop', color: '#6366F1' };
            case 'equipment': return { name: 'tools', color: '#f59e0b' };
            default: return { name: 'receipt', color: '#10b981' };
        }
    };

    const renderDashboardHeader = () => (

        
        <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={toggleTheme}>
        <Ionicons name={theme === 'light' ? "moon-outline" : "sunny-outline"} size={22} color={colors.text} />
    </TouchableOpacity>

    {/* 🛡️ NEW: ADMIN IAM SHIELD (Only visible to Admins) */}
    {role === 'admin' && (
        <TouchableOpacity 
            style={[styles.iconBtn, { backgroundColor: colors.primary + '20' }]} 
            onPress={() => navigation.navigate('AdminDashboard')}
        >
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        </TouchableOpacity>
    )}
    
    {/* Add Expense (Only visible to Employees) */}
    {!isManager && (
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddExpense')}>
            <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
    )}
    
    {/* Logout */}
    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
    </TouchableOpacity>
                <View style={styles.userProfileSection}>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                        <View style={styles.avatarWrapper}>
                            {profilePic ? (
                                <Image source={{ uri: profilePic }} style={styles.avatarImg} />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
                                    <Ionicons name="person" size={22} color={colors.subtext} />
                                </View>
                            )}
                            <View style={styles.onlineDot} />
                        </View>
                    </TouchableOpacity>
                    
                    <View style={styles.welcomeTextColumn}>
                        <Text style={[styles.greeting, { color: colors.text }]}>
                            {username} 
                        </Text>
                        <View style={[styles.roleBadge, { backgroundColor: role === 'admin' ? '#F3E8FF' : '#DBEAFE' }]}>
                             <Text style={[styles.roleText, { color: role === 'admin' ? '#7E22CE' : '#1D4ED8' }]}>
                                {role.toUpperCase()}
                             </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={toggleTheme}>
                        <Ionicons name={theme === 'light' ? "moon-outline" : "sunny-outline"} size={22} color={colors.text} />
                    </TouchableOpacity>
                    
                    {!isManager && (
                        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddExpense')}>
                            <Ionicons name="add" size={26} color="#fff" />
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.card }]} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.budgetCard}>
                <View style={styles.budgetTop}>
                    <View>
                        <Text style={styles.budgetLabel}>{isManager ? 'Company Spend' : 'Monthly Spending'}</Text>
                        <Text style={styles.budgetAmount}>₹{totalSpent.toLocaleString('en-IN')}</Text>
                    </View>
                    <MaterialCommunityIcons name="wallet-outline" size={32} color="rgba(255,255,255,0.4)" />
                </View>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: '#FFF' }]} />
                </View>
                <Text style={styles.budgetSubtext}>Limit: ₹{budgetLimit.toLocaleString('en-IN')}</Text>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
        </View>
    );

    const renderExpenseCard = ({ item }) => {
        const iconData = getCategoryIcon(item.category);
        return (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardMain}>
                    <View style={[styles.iconBg, { backgroundColor: iconData.color + '15' }]}>
                        <MaterialCommunityIcons name={iconData.name} size={24} color={iconData.color} />
                    </View>
                    <View style={styles.cardContent}>
                        <Text style={[styles.merchantName, { color: colors.text }]}>{item.title}</Text>
                        <View style={styles.cardMeta}>
                            <Text style={[styles.cardSub, { color: colors.subtext }]}>{item.category}</Text>
                            <Text style={styles.dot}> • </Text>
                            <Text style={[styles.statusText, { color: item.status === 'Approved' ? '#10b981' : item.status === 'Rejected' ? '#ef4444' : '#f59e0b' }]}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.amountText, { color: colors.text }]}>₹{(item.amount || 0).toLocaleString('en-IN')}</Text>
                        {item.currency !== 'INR' && (
                            <Text style={{ fontSize: 10, color: colors.subtext }}>{item.originalAmount} {item.currency}</Text>
                        )}
                    </View>
                </View>

                {item.isFlagged && isManager && (
                    <View style={styles.flagBox}>
                        <Ionicons name="warning" size={14} color="#b91c1c" />
                        <Text style={styles.flagText}>ANOMALY DETECTED</Text>
                    </View>
                )}

                {isManager && item.status === 'Pending' && (
                    <View style={styles.managerActions}>
                        <TouchableOpacity style={[styles.actionButton, styles.approveBtn]} onPress={() => processUpdate(item._id, 'Approved')}>
                            <Text style={styles.approveText}>Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.rejectBtn]} onPress={() => processUpdate(item._id, 'Rejected')}>
                            <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading && !refreshing) return (
        <View style={[styles.loader, {backgroundColor: colors.bg}]}>
            <ActivityIndicator size="large" color="#6366F1" />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]} edges={['top']}>
            <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
            <FlatList 
                data={expenses}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={renderDashboardHeader}
                renderItem={renderExpenseCard}
                onRefresh={onRefresh}
                refreshing={refreshing}
                contentContainerStyle={styles.scrollContainer}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: colors.subtext }}>No transactions yet.</Text>
                )}
            />
        </SafeAreaView>
    );
}

// ... styles remain the same as your provided code ...
const styles = StyleSheet.create({
    container: { flex: 1 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContainer: { padding: 20 },
    headerContainer: { marginBottom: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    userProfileSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarWrapper: { position: 'relative' },
    avatarImg: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#6366F130' },
    avatarPlaceholder: { width: 50, height: 50, borderRadius: 25 },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, backgroundColor: '#22C55E', borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
    welcomeTextColumn: { justifyContent: 'center' },
    greeting: { fontSize: 20, fontWeight: 'bold', letterSpacing: -0.5 },
    roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
    roleText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    headerActions: { flexDirection: 'row', gap: 10 },
    iconBtn: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 },
    addButton: { backgroundColor: '#6366F1', width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 4 },
    budgetCard: { backgroundColor: '#6366F1', borderRadius: 24, padding: 24, marginBottom: 25, elevation: 8, shadowColor: '#6366F1', shadowOpacity: 0.4, shadowRadius: 10 },
    budgetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    budgetLabel: { color: '#E0E7FF', fontSize: 13, fontWeight: '600' },
    budgetAmount: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    budgetSubtext: { color: '#E0E7FF', fontSize: 11, marginTop: 10, fontWeight: '700' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    card: { borderRadius: 20, padding: 16, marginBottom: 15, borderWidth: 1 },
    cardMain: { flexDirection: 'row', alignItems: 'center' },
    iconBg: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    cardContent: { flex: 1, marginLeft: 15 },
    merchantName: { fontSize: 16, fontWeight: '700' },
    cardMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    cardSub: { fontSize: 13 },
    dot: { color: '#CBD5E1' },
    statusText: { fontSize: 13, fontWeight: '800' },
    amountText: { fontSize: 18, fontWeight: '900' },
    flagBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 8, borderRadius: 10, marginTop: 12, gap: 6 },
    flagText: { color: '#B91C1C', fontSize: 11, fontWeight: '900' },
    managerActions: { flexDirection: 'row', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    actionButton: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    approveBtn: { backgroundColor: '#ECFDF5' },
    rejectBtn: { backgroundColor: '#FEF2F2' },
    approveText: { color: '#10B981', fontSize: 13, fontWeight: 'bold' },
    rejectText: { color: '#EF4444', fontSize: 13, fontWeight: 'bold' }
});
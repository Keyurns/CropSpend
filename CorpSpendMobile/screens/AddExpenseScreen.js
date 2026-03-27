import React, { useState, useContext } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
    ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, 
    Modal, FlatList, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import * as ImageManipulator from 'expo-image-manipulator';
import { ThemeContext } from '../constants/ThemeContext'; 
import { API_URL } from '../constants/Config';

export default function AddExpenseScreen({ navigation }) {
    const { colors, theme } = useContext(ThemeContext);
    
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [receiptUri, setReceiptUri] = useState(null); // 👈 Store the URI for submission

    const [category, setCategory] = useState('General');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    
    const [currency, setCurrency] = useState({ label: 'INR (₹)', value: 'INR', symbol: '₹' });
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

    const CATEGORIES = ['Food', 'Transport', 'Travel', 'Equipment', 'Marketing', 'General'];
    const CURRENCIES = [
        { label: 'INR (₹)', value: 'INR', symbol: '₹' },
        { label: 'USD ($)', value: 'USD', symbol: '$' },
        { label: 'EUR (€)', value: 'EUR', symbol: '€' }
    ];

    const handleSmartScan = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permission Required", "Camera access is needed.");

        let result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

        if (!result.canceled && result.assets[0].uri) {
            setIsScanning(true);
            const capturedUri = result.assets[0].uri;
            setReceiptUri(capturedUri); // Save for later upload

            try {
                // Resize for faster OCR processing
                const manipResult = await ImageManipulator.manipulateAsync(
                    capturedUri,
                    [{ resize: { width: 800 } }], 
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
                );

                let ocrFormData = new FormData();
                ocrFormData.append('file', { uri: manipResult.uri, name: 'receipt.jpg', type: 'image/jpeg' });
                ocrFormData.append('apikey', 'K82835331288957');
                ocrFormData.append('isTable', 'true');

                const response = await fetch('https://api.ocr.space/parse/image', {
                    method: 'POST',
                    body: ocrFormData
                });

                const data = await response.json();
                if (data.ParsedResults && data.ParsedResults.length > 0) {
                    const text = data.ParsedResults[0].ParsedText;
                    // ... (Your existing extraction logic for Title/Amount/Category is solid)
                    Alert.alert("Scan Complete", "Verify the details below.");
                }
            } catch (error) {
                Alert.alert("Scan Failed", "Manual entry required.");
            } finally {
                setIsScanning(false);
            }
        }
    };

    const submitExpense = async () => {
        if (!title || !amount) return Alert.alert('Missing Info', 'Please provide a title and amount.');
        
        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('originalAmount', amount);
        formData.append('category', category);
        formData.append('currency', currency.value);
        formData.append('date', new Date().toISOString());

        // Attach receipt if scanned
        if (receiptUri) {
            const filename = receiptUri.split('/').pop();
            const type = `image/${filename.split('.').pop()}`;
            formData.append('receipt', { uri: receiptUri, name: filename, type });
        }

        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(`${API_URL}/expenses`, formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data', // 👈 REQUIRED
                    'x-auth-token': token 
                }
            });

            Alert.alert('Success', 'Expense logged!');
            navigation.navigate('Dashboard'); 
        } catch (error) {
            Alert.alert('Upload Failed', error.response?.data?.msg || "Server error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
            <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={[styles.backBtn, {backgroundColor: colors.card}]} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, {color: colors.text}]}>New Expense</Text>
                        <View style={{width: 40}} />
                    </View>

                    {/* Scan Section */}
                    <TouchableOpacity 
                        style={[styles.scanBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]} 
                        onPress={handleSmartScan}
                        disabled={isScanning}
                    >
                        {isScanning ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <>
                                <View style={[styles.iconCircle, {backgroundColor: colors.card}]}>
                                    <Ionicons name="camera" size={30} color={colors.primary} />
                                </View>
                                <Text style={[styles.scanText, {color: colors.text}]}>
                                    {receiptUri ? "Receipt Captured ✓" : "Scan Receipt"}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Input Fields */}
                    <View style={styles.formRow}>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, {color: colors.subtext}]}>Currency</Text>
                            <TouchableOpacity style={[styles.input, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => setShowCurrencyPicker(true)}>
                                <Text style={{color: colors.text}}>{currency.value}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.flex1}>
                            <Text style={[styles.label, {color: colors.subtext}]}>Category</Text>
                            <TouchableOpacity style={[styles.input, {backgroundColor: colors.card, borderColor: colors.border}]} onPress={() => setShowCategoryPicker(true)}>
                                <Text style={{color: colors.text}}>{category}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGap}>
                        <Text style={[styles.label, {color: colors.subtext}]}>Amount ({currency.symbol})</Text>
                        <TextInput 
                            style={[styles.mainInput, {backgroundColor: colors.card, borderColor: colors.primary, color: colors.text}]}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                            placeholder="0.00"
                            placeholderTextColor={colors.subtext}
                        />
                    </View>

                    <View style={styles.inputGap}>
                        <Text style={[styles.label, {color: colors.subtext}]}>Merchant / Description</Text>
                        <TextInput 
                            style={[styles.input, {backgroundColor: colors.card, borderColor: colors.border, color: colors.text}]}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="E.g. Starbucks"
                            placeholderTextColor={colors.subtext}
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.submitBtn, {backgroundColor: colors.primary}]} 
                        onPress={submitExpense}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Expense</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* Modals for Pickers (Category/Currency) */}
            {/* ... keep your existing Modal code here ... */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    backBtn: { width: 44, height: 44, borderRadius: 15, justifyContent: 'center', alignItems: 'center', elevation: 2 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', letterSpacing: -0.5 },
    scanBox: { height: 160, borderRadius: 25, borderStyle: 'dashed', borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 4 },
    scanText: { fontWeight: '700', fontSize: 16 },
    formRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    flex1: { flex: 1 },
    label: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
    input: { height: 55, borderWidth: 1.5, borderRadius: 15, paddingHorizontal: 15, justifyContent: 'center' },
    inputGap: { marginBottom: 20 },
    mainInput: { height: 70, borderWidth: 2, borderRadius: 20, paddingHorizontal: 20, fontSize: 24, fontWeight: 'bold' },
    submitBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 5 },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
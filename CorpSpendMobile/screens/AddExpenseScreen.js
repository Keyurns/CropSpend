import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker'; 
import * as ImageManipulator from 'expo-image-manipulator';

const API_URL = 'http://10.30.63.75:5000/api'; // KEEP YOUR LAPTOP IP HERE

export default function AddExpenseScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [category, setCategory] = useState('General');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    
    const [currency, setCurrency] = useState({ label: 'INR (₹)', value: 'INR', symbol: '₹' });
    const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

    const CATEGORIES = ['Food', 'Transport', 'Travel', 'Equipment', 'Marketing', 'General'];
    const CURRENCIES = [
        { label: 'INR (₹) - Indian Rupee', value: 'INR', symbol: '₹' },
        { label: 'USD ($) - US Dollar', value: 'USD', symbol: '$' },
        { label: 'EUR (€) - Euro', value: 'EUR', symbol: '€' },
        { label: 'GBP (£) - British Pound', value: 'GBP', symbol: '£' }
    ];

 // ==========================================
    // PRODUCTION-READY REAL OCR SCANNER
    // ==========================================
    const handleSmartScan = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permission Required", "Please allow camera access.");

        // 1. Take the actual photo
        let result = await ImagePicker.launchCameraAsync({
            quality: 0.8, 
        });

        if (!result.canceled && result.assets[0].uri) {
            setIsScanning(true);
            try {
                // 2. MAGIC FIX: Resize the heavy photo to a lightweight size (800px width)
                // This makes the API request take 2 seconds instead of 15 seconds, preventing timeouts.
                const manipResult = await ImageManipulator.manipulateAsync(
                    result.assets[0].uri,
                    [{ resize: { width: 800 } }], 
                    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
                );

                let formData = new FormData();
                formData.append('file', {
                    uri: manipResult.uri,
                    name: 'receipt.jpg',
                    type: 'image/jpeg'
                });
                formData.append('language', 'eng');
                formData.append('isTable', 'true'); // Forces strict line-by-line reading

                // 3. Send the lightweight file to the real OCR API
                const ocrRes = await fetch('https://api.ocr.space/parse/image', {
                    method: 'POST',
                    headers: { 
                        'apikey': 'K82835331288957', // REPLACE WITH YOUR PERSONAL FREE KEY
                    },
                    body: formData
                });

                const ocrData = await ocrRes.json();

                if (ocrData.IsErroredOnProcessing) {
                    throw new Error(ocrData.ErrorMessage?.[0] || "API Error");
                }

                if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
                    const parsedText = ocrData.ParsedResults[0].ParsedText;
                    console.log("WHAT THE AI SAW: ", parsedText);
                    const textLower = parsedText.toLowerCase();
                    const lines = parsedText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

                  // 4. HIGHLY FORGIVING AMOUNT EXTRACTION
                  let extractedAmount = '';
                    
                  for (let i = 0; i < lines.length; i++) {
                      let line = lines[i].toLowerCase();
                      
                      // Find the line that mentions the final total
                      if (line.match(/(total|due|amount|net|pay)/)) {
                          
                          // Grab ALL numbers on this line (allows optional dots/commas)
                          let matches = line.match(/\d+[.,]?\d*/g);
                          
                          // If the OCR split the price onto the very next line, check there too
                          if (!matches && lines[i + 1]) {
                              matches = lines[i + 1].match(/\d+[.,]?\d*/g);
                          }

                          // If we found numbers, grab the LAST one on the line (avoids item counts like "Total 3 items:")
                          if (matches && matches.length > 0) {
                              extractedAmount = matches[matches.length - 1].replace(/,/g, ''); // Clean out commas
                              break; // Stop searching once we find it
                          }
                      }
                  }

                  // Fallback: If the word "Total" was completely unreadable, just grab the biggest number on the receipt
                  if (!extractedAmount || Number(extractedAmount) === 0) {
                      const allNumbers = parsedText.match(/\d+[.,]?\d*/g);
                      if (allNumbers) {
                          const numbers = allNumbers.map(n => Number(n.replace(/,/g, '')));
                          // Filter out zeros and massive receipt ID numbers (over 100k)
                          const validNumbers = numbers.filter(n => n < 100000 && n > 0); 
                          if (validNumbers.length > 0) {
                              extractedAmount = Math.max(...validNumbers).toString();
                          }
                      }
                  }
                  
                  if (extractedAmount) setAmount(extractedAmount);
                    // 5. ACCURATE VENDOR EXTRACTION
                    const garbageRegex = /^(file|edit|view|selection|window|help|go|format|run|terminal|chrome)/i;
                    const cleanLines = lines.filter(l => !garbageRegex.test(l));
                    
                    let vendorName = '';
                    const separatorIndex = cleanLines.findIndex(l => /^[=\-*_]{4,}/.test(l));
                    
                    if (separatorIndex !== -1 && cleanLines[separatorIndex + 1]) {
                        vendorName = cleanLines[separatorIndex + 1];
                    } else {
                        const validLines = cleanLines.filter(l => !l.match(/^[=\-*_#\s]+$/) && l.length > 2 && !l.toLowerCase().includes('date:'));
                        vendorName = validLines.length > 0 ? validLines[0] : 'Scanned Receipt';
                    }

                    vendorName = vendorName.replace(/[^a-zA-Z0-9\s&]/g, '').trim();
                    setTitle(vendorName.replace(/\b\w/g, char => char.toUpperCase()));

                    // 6. ACCURATE CATEGORIZATION
                    if (textLower.match(/cafe|coffee|restaurant|food|burger|pizza|tokai|dining|muffin|panini|zomato|swiggy|meal/)) {
                        setCategory('Food');
                    } else if (textLower.match(/taxi|uber|ola|flight|train|transport|transit|fare|parking|toll/)) {
                        setCategory('Transport');
                    } else if (textLower.match(/hotel|stay|room|booking|travel|marriott|taj|resort/)) {
                        setCategory('Travel');
                    } else if (textLower.match(/hardware|equipment|laptop|mouse|keyboard|reliance|croma|cable/)) {
                        setCategory('Equipment');
                    } else if (textLower.match(/ads|marketing|campaign|google|meta/)) {
                        setCategory('Marketing');
                    } else {
                        setCategory('General');
                    }

                    Alert.alert("Scan Success", "Data extracted from receipt.");
                } else {
                    Alert.alert("Scan Unclear", "Could not read text. Please enter manually.");
                }
            } catch (error) {
                console.log("OCR ERROR:", error.message);
                Alert.alert("Network Error", "Ensure your internet is stable and try again.");
            } finally {
                setIsScanning(false);
            }
        }
    };
    const submitExpense = async () => {
        if (!title || !amount) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('userToken');
            await axios.post(`${API_URL}/expenses`, { 
                title, 
                amount: Number(amount), 
                category, 
                currency: currency.value, 
                date: new Date()
            }, { headers: { 'x-auth-token': token } });

            Alert.alert('Success', 'Expense submitted!');
            navigation.navigate('Dashboard'); 
        } catch (error) {
            console.log("SUBMIT ERROR:", error.response?.data || error.message);
            Alert.alert('Error', error.response?.data?.msg || 'Failed to submit expense');
        } finally {
            setLoading(false);
        }
    };

    const renderDropdown = (label, value, onPress) => (
        <View style={styles.inputCard}>
            <Text style={styles.label}>{label} *</Text>
            <TouchableOpacity style={styles.dropdownInput} onPress={onPress}>
                <Text style={styles.dropdownText}>{value}</Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
        </View>
    );

    const renderPickerModal = (visible, setVisible, data, onSelect, isCurrency = false) => (
        <Modal visible={visible} transparent animationType="slide">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setVisible(false)}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Option</Text>
                        <TouchableOpacity onPress={() => setVisible(false)}>
                            <Ionicons name="close-circle" size={28} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                    <FlatList 
                        data={data}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({item}) => (
                            <TouchableOpacity style={styles.modalItem} onPress={() => { onSelect(item); setVisible(false); }}>
                                <Text style={styles.modalItemText}>{isCurrency ? item.label : item}</Text>
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
                    
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Dashboard')}>
                            <Ionicons name="arrow-back" size={24} color="#1E293B" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Add Expense</Text>
                        <View style={{width: 40}} />
                    </View>

                    <View style={styles.scanBox}>
                        <View style={styles.scanIconBg}>
                            <Ionicons name="camera-outline" size={32} color="#6366F1" />
                        </View>
                        <Text style={styles.scanTitle}>Smart Scan</Text>
                        
                        <TouchableOpacity style={styles.scanBtn} onPress={handleSmartScan} disabled={isScanning}>
                            {isScanning ? <ActivityIndicator color="#6366F1" /> : (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="scan-outline" size={20} color="#6366F1" style={{marginRight: 8}} />
                                    <Text style={styles.scanBtnText}>Open Camera</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={{flexDirection: 'row', gap: 10}}>
                        <View style={{flex: 1}}>
                            {renderDropdown("Currency", currency.value, () => setShowCurrencyPicker(true))}
                        </View>
                        <View style={{flex: 1}}>
                            {renderDropdown("Category", category, () => setShowCategoryPicker(true))}
                        </View>
                    </View>

                    <View style={styles.inputCard}>
                        <Text style={styles.label}>Amount *</Text>
                        <View style={styles.amountInputContainer}>
                            <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                            <TextInput 
                                style={styles.amountInput}
                                placeholder="0.00"
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />
                        </View>
                    </View>

                    <View style={styles.inputCard}>
                        <Text style={styles.label}>Description *</Text>
                        <TextInput 
                            style={styles.textInput}
                            placeholder="E.g., Client Dinner"
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>

                    <TouchableOpacity style={styles.submitBtn} onPress={submitExpense} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Expense</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>

            {renderPickerModal(showCategoryPicker, setShowCategoryPicker, CATEGORIES, setCategory)}
            {renderPickerModal(showCurrencyPicker, setShowCurrencyPicker, CURRENCIES, setCurrency, true)}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollContent: { padding: 20, flexGrow: 1, paddingBottom: 40 }, 
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, marginTop: 10 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E293B' },
    scanBox: { backgroundColor: '#EEF2FF', borderWidth: 2, borderColor: '#C7D2FE', borderStyle: 'dashed', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
    scanIconBg: { backgroundColor: '#FFFFFF', width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 2 },
    scanTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 15 },
    scanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: '#6366F1' },
    scanBtnText: { color: '#6366F1', fontWeight: '700', fontSize: 16 },
    inputCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 15, elevation: 1 },
    label: { fontSize: 14, fontWeight: '700', color: '#1E293B', marginBottom: 10 },
    dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
    dropdownText: { fontSize: 16, color: '#1E293B', fontWeight: '500' },
    amountInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#6366F1', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FAFAFA' },
    currencySymbol: { fontSize: 24, fontWeight: '700', color: '#94A3B8', marginRight: 8 },
    amountInput: { flex: 1, fontSize: 28, fontWeight: '800', color: '#1E293B' },
    textInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#F8FAFC', color: '#1E293B' },
    submitBtn: { backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10, elevation: 4 },
    submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '50%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
    modalItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalItemText: { fontSize: 16, color: '#1E293B', fontWeight: '500' }
});
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, X, ArrowLeft, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function VoiceInputScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [saving, setSaving] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recog = new SpeechRecognitionAPI();
      recog.lang = 'id-ID';
      recog.continuous = true;
      recog.interimResults = true;
      
      recog.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };
      
      recog.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recog.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recog);
    }
  }, []);

  const toggleRecording = () => {
    if (Platform.OS === 'web') {
      if (!recognition) {
        alert('Browser Anda tidak mendukung fitur suara.');
        return;
      }
      
      if (isRecording) {
        recognition.stop();
        setIsRecording(false);
      } else {
        setTranscript('');
        recognition.start();
        setIsRecording(true);
      }
    } else {
      // Native fallback (we don't have a native STT package installed yet)
      alert('Fitur suara native belum tersedia. Silakan ketik manual.');
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) return;
    setSaving(true);
    
    try {
      const text = transcript.toLowerCase();
      
      const txData = {
        user_id: user?.id,
        amount: 0,
        notes: transcript,
        transaction_date: new Date().toISOString()
      };
      
      const matchNumbers = text.match(/\d+/g);
      if (matchNumbers) {
        txData.amount = parseInt(matchNumbers.join(''), 10);
      }
      
      if (txData.amount === 0) {
        alert('Tidak bisa mendeteksi nominal. Menyimpan sebagai catatan.');
      } else {
        await supabase.from('transactions').insert(txData);
      }
      
      navigation.goBack();
    } catch (e) {
      console.error(e);
      alert('Gagal memproses data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgPrimary }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Catat Transaksi</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Ucapkan: "Beli makan siang 25 ribu pakai gopay"
        </Text>

        <View style={[styles.inputBox, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            multiline
            placeholder="Atau ketik manual di sini..."
            placeholderTextColor={colors.textMuted}
            value={transcript}
            onChangeText={setTranscript}
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.micBtn, 
            { backgroundColor: isRecording ? colors.red : colors.purple }
          ]} 
          onPress={toggleRecording}
        >
          {isRecording ? (
            <View style={styles.recordingIndicator}>
              <View style={[styles.dot, { backgroundColor: '#fff' }]} />
              <Text style={styles.recordingText}>Merekam...</Text>
            </View>
          ) : (
            <Mic size={40} color="#fff" />
          )}
        </TouchableOpacity>

        {transcript.length > 0 && !isRecording && (
          <TouchableOpacity 
            style={[styles.saveBtn, { backgroundColor: colors.green }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Simpan Transaksi</Text>
                <Send size={20} color="#fff" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  closeBtn: { padding: 8, marginRight: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  content: { flex: 1, padding: 24, alignItems: 'center' },
  hint: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
  inputBox: { width: '100%', minHeight: 150, borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 40 },
  input: { fontSize: 18, flex: 1, textAlignVertical: 'top' },
  micBtn: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 10 },
  recordingIndicator: { alignItems: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, marginBottom: 8 },
  recordingText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 100, marginTop: 40, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

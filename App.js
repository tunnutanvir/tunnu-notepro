import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Modal, 
  SafeAreaView, 
  StatusBar,
  Alert
} from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ডাটা স্থায়ীভাবে সেভ রাখার জন্য

export default function App() {
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentNote, setCurrentNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  const [searchModal, setSearchModal] = useState(false);
  const [indexModal, setIndexModal] = useState(false);
  const [editorModal, setEditorModal] = useState(false);

  // অ্যাপ ওপেন হওয়ার সাথে সাথে ফোন মেমোরি থেকে পুরনো নোটগুলো লোড করার ফাংশন
  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const savedNotes = await AsyncStorage.getItem('@tunnu_notes');
      if (savedNotes !== null) {
        setNotes(JSON.parse(savedNotes));
      } else {
        // প্রথমবার অ্যাপ ওপেন হলে ডেমো নোট দেখাবে
        setNotes([{ id: '1', title: 'স্বাগতম!', content: 'Tunnu NotePro-তে আপনার দরকারি লিংক বা নোট লিখুন। যেমন: https://google.com' }]);
      }
    } catch (e) {
      Alert.alert('দুঃখিত', 'নোট লোড করা যায়নি।');
    }
  };

  // ফোন মেমোরিতে নোট স্থায়ীভাবে সেভ করার ফাংশন
  const saveNotesToStorage = async (newNotesList) => {
    try {
      await AsyncStorage.setItem('@tunnu_notes', JSON.stringify(newNotesList));
    } catch (e) {
      Alert.alert('দুঃখিত', 'নোট স্থায়ীভাবে সংরক্ষণ করা যায়নি।');
    }
  };

  const renderContentWithLinks = (text) => {
    if (!text) return <Text style={styles.noteItemText}>কোনো বিবরণ নেই</Text>;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <Text 
            key={index} 
            style={styles.linkText} 
            onPress={() => Linking.openURL(part).catch(() => Alert.alert('দুঃখিত', 'এই লিঙ্কটি ওপেন করা যাচ্ছে না।'))}
          >
            {part}
          </Text>
        );
      }
      return <Text key={index} style={styles.noteItemText}>{part}</Text>;
    });
  };

  const handleNewNote = () => {
    setCurrentNote(null);
    setTitle('');
    setContent('');
    setEditorModal(true);
  };

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('সতর্কতা', 'খালি নোট সেভ করা যাবে না।');
      return;
    }

    let updatedNotes = [];
    if (currentNote) {
      updatedNotes = notes.map(n => n.id === currentNote.id ? { ...n, title, content } : n);
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: title || 'শিরোনামহীন নোট',
        content
      };
      updatedNotes = [newNote, ...notes];
    }
    
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes); // লোকাল স্টোরেজে সেভ
    setEditorModal(false);
    Alert.alert('সফল', 'নোট সেভ করা হয়েছে।');
  };

  const handleDelete = () => {
    if (!currentNote) {
      Alert.alert('দুঃখিত', 'ডিলিট করার জন্য কোনো নোট সিলেক্ট করা নেই। প্রথমে INDEX থেকে একটি নোট ওপেন করুন।');
      return;
    }
    const updatedNotes = notes.filter(n => n.id !== currentNote.id);
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes); // লোকাল স্টোরেজ থেকে ডিলিট আপডেট করা
    setEditorModal(false);
    Alert.alert('সফল', 'নোটটি ডিলিট করা হয়েছে।');
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const PremiumButton = ({ text, onPress }) => (
    <View style={styles.buttonShadowWrapper}>
      <View style={styles.yellowUnderlay} />
      <TouchableOpacity style={styles.premiumBtn} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.premiumBtnText}>{text}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.headerWrapper}>
        <View style={styles.headerSideWingLeft} />
        <View style={styles.headerMain}>
          <Text style={styles.headerText}>Tunnu NotePro</Text>
        </View>
        <View style={styles.headerSideWingRight} />
      </View>

      <View style={styles.buttonContainer}>
        <PremiumButton text="SEARCH" onPress={() => setSearchModal(true)} />
        <PremiumButton text="INDEX" onPress={() => setIndexModal(true)} />
        <PremiumButton text="NEW NOTE" onPress={handleNewNote} />
        <PremiumButton text="EDIT NOTE" onPress={() => setIndexModal(true)} />
        <PremiumButton text="DELETE NOTE" onPress={handleDelete} />
        <PremiumButton text="SAVE NOTE" onPress={handleSave} />
      </View>

      {/* সার্চ মোডাল */}
      <Modal animationType="fade" transparent={true} visible={searchModal} onRequestClose={() => setSearchModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <TextInput 
              style={styles.inputField} 
              placeholder="এখানে খুঁজুন..." 
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList 
              data={filteredNotes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.noteItem} onPress={() => { setCurrentNote(item); setTitle(item.title); setContent(item.content); setSearchModal(false); setEditorModal(true); }}>
                  <Text style={styles.noteItemTitle}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSearchModal(false)}>
              <Text style={styles.closeBtnText}>বন্ধ করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ইনডেক্স মোডাল */}
      <Modal animationType="slide" transparent={true} visible={indexModal} onRequestClose={() => setIndexModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>সব নোটের তালিকা</Text>
            <FlatList 
              data={notes}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View style={styles.noteItem}>
                  <TouchableOpacity onPress={() => { setCurrentNote(item); setTitle(item.title); setContent(item.content); setIndexModal(false); setEditorModal(true); }}>
                    <Text style={styles.noteItemTitle}>{item.title} ✏️</Text>
                  </TouchableOpacity>
                  <View style={{ marginTop: 8 }}>
                    {renderContentWithLinks(item.content)}
                  </View>
                </View>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIndexModal(false)}>
              <Text style={styles.closeBtnText}>বন্ধ করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* এডিটর মোডাল */}
      <Modal animationType="slide" visible={editorModal} onRequestClose={() => setEditorModal(false)}>
        <SafeAreaView style={[styles.container, { padding: 20 }]}>
          <Text style={styles.modalTitle}>{currentNote ? 'নোট এডিট করুন' : 'নতুন নোট লিখুন'}</Text>
          
          <TextInput 
            style={[styles.inputField, { color: '#000', backgroundColor: '#FFF' }]} 
            placeholder="শিরোনাম (Title)" 
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
          
          <TextInput 
            style={[styles.inputField, { color: '#000', backgroundColor: '#FFF', flex: 1, textAlignVertical: 'top' }]} 
            placeholder="বিস্তারিত বা ইউআরএল লিখুন (যেমন: https://google.com)" 
            placeholderTextColor="#9CA3AF"
            multiline
            value={content}
            onChangeText={setContent}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 10 }}>
            <TouchableOpacity style={styles.editorActionBtn} onPress={handleSave}>
              <Text style={styles.editorActionText}>সেভ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.editorActionBtn, { backgroundColor: '#EF4444' }]} onPress={() => setEditorModal(false)}>
              <Text style={[styles.editorActionText, { color: '#FFF' }]}>বাতিল</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  headerWrapper: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  headerMain: { backgroundColor: '#F3E9E9', paddingVertical: 12, paddingHorizontal: 35, borderRadius: 18, borderWidth: 1, borderColor: '#000', zIndex: 2 },
  headerText: { fontSize: 20, color: '#015B22', fontWeight: 'bold' },
  headerSideWingLeft: { backgroundColor: '#D1C4C4', width: 25, height: 18, marginRight: -10, borderTopLeftRadius: 5, borderBottomLeftRadius: 5 },
  headerSideWingRight: { backgroundColor: '#D1C4C4', width: 25, height: 18, marginLeft: -10, borderTopRightRadius: 5, borderBottomRightRadius: 5 },
  buttonContainer: { width: '100%', alignItems: 'center', paddingHorizontal: 50, gap: 14 },
  buttonShadowWrapper: { width: '85%', height: 48, position: 'relative' },
yellowUnderlay: { position: 'absolute', backgroundColor: '#EAE100', width: '100%', height: '100%', 
  borderRadius: 16, top: 0, left: -6 },premiumBtn: { position: 'absolute', backgroundColor: '#F3E9E9', width: 
    '100%', height: '100%', borderRadius: 16, borderWidth: 1.5, borderColor: '#000', justifyContent: 'center',
 alignItems: 'center', top: 0, left: 0 },premiumBtnText: { fontSize: 15, color: '#015B22', fontWeight: 'bold',
  letterSpacing: 1 },modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center',
 padding: 25 },modalContent: { backgroundColor: '#1C1C1E', padding: 20, borderRadius: 20, borderWidth: 1,
 borderColor: '#333', maxHeight: '80%' },modalTitle: { fontSize: 20, color: '#F3E9E9', fontWeight: 'bold',
 marginBottom: 15, textAlign: 'center' },inputField: { backgroundColor: '#2C2C2E', color: '#FFF', padding: 
14, borderRadius: 12, fontSize: 16, marginBottom: 15 },noteItem: { backgroundColor: '#2C2C2E', padding: 
 15, borderRadius: 10, marginBottom: 10 },noteItemTitle: { color: '#FFFF00', fontSize: 18, fontWeight: 
 'bold' },noteItemText: { color: '#FFF', fontSize: 15, lineHeight: 22 },linkText: { color: 
 '#38BDF8', fontSize: 15, textDecorationLine: 'underline', fontWeight: '500' },closeBtn: 
{ backgroundColor: '#F3E9E9', padding: 12, borderRadius: 12, alignItems: 'center',
  marginTop: 10 },closeBtnText: { color: '#000', fontWeight: 'bold' },editorActionBtn: { flex: 1,
backgroundColor: '#F3E9E9', padding: 14, borderRadius: 12, alignItems: 'center' },editorActionText: 
 { color: '#000', fontWeight: 'bold', fontSize: 16 }});
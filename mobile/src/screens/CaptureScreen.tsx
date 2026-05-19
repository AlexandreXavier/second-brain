import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { firestore, storage, auth } from '../lib/firebase';
import { buildCaptureDraft, patchDraftWithImage } from '../lib/capture';
import { buildIdeaPayload } from '../lib/save';
import type { IdeaDraft } from '../lib/types';

export function CaptureScreen() {
  const [source, setSource] = useState('');
  const [draft, setDraft] = useState<IdeaDraft | null>(null);
  const [categoryText, setCategoryText] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  async function handleFetchPreview() {
    setIsFetching(true);
    try {
      const idToken = (await auth().currentUser?.getIdToken()) ?? null;
      const preview = await buildCaptureDraft(source, idToken);
      setDraft(preview);
    } finally {
      setIsFetching(false);
    }
  }

  async function handlePickImage() {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setImageUri(asset.uri);
    setDraft(prev => patchDraftWithImage(prev, asset.fileName));
  }

  async function handleSave() {
    const user = auth().currentUser;
    if (!user) return;
    setIsSaving(true);
    try {
      let uploadedUrl: string | null = null;
      if (imageUri) {
        const filename = `ideas/${user.uid}/${Date.now()}.jpg`;
        const ref = storage().ref(filename);
        await ref.putFile(imageUri);
        uploadedUrl = await ref.getDownloadURL();
      }

      const payload = buildIdeaPayload(draft, source, categoryText, uploadedUrl, {
        uid: user.uid, name: user.displayName, email: user.email, photoURL: user.photoURL,
      });

      await firestore().collection('ideas').add({
        ...payload,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      setSource('');
      setDraft(null);
      setCategoryText('');
      setImageUri(null);
      Alert.alert('Guardado', 'Ideia guardada no cerebro.');
    } catch {
      Alert.alert('Erro', 'Nao foi possivel guardar. Tenta novamente.');
    } finally {
      setIsSaving(false);
    }
  }

  const canSave = !isSaving && (source.trim() || draft || imageUri);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Capturar</Text>
      <Text style={styles.subheading}>Adicionar algo util.</Text>

      <Text style={styles.label}>Link ou ideia solta</Text>
      <TextInput
        style={styles.textarea}
        value={source}
        onChangeText={setSource}
        placeholder="Cola um link de YouTube, X, Instagram ou escreve uma nota"
        placeholderTextColor="#999"
        multiline
        numberOfLines={3}
      />

      <Pressable style={[styles.secondaryBtn, (!source.trim() || isFetching) && styles.btnDisabled]}
        onPress={handleFetchPreview} disabled={!source.trim() || isFetching}>
        {isFetching
          ? <ActivityIndicator color="#1a1a1a" />
          : <Text style={styles.secondaryBtnText}>Obter pre-visualizacao</Text>}
      </Pressable>

      {draft ? (
        <View style={styles.preview}>
          {(draft.imageUrl || draft.thumbnailUrl) ? (
            <Image source={{ uri: draft.imageUrl || draft.thumbnailUrl }} style={styles.previewImage} />
          ) : null}
          <Text style={styles.previewType}>{draft.type}</Text>
          <Text style={styles.previewTitle}>{draft.title}</Text>
          {draft.author ? <Text style={styles.previewAuthor}>{draft.author}</Text> : null}
        </View>
      ) : null}

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.imagePreview} /> : null}

      <Pressable style={styles.secondaryBtn} onPress={handlePickImage}>
        <Text style={styles.secondaryBtnText}>Anexar imagem da galeria</Text>
      </Pressable>

      <Text style={styles.label}>Categorias</Text>
      <TextInput
        style={styles.input}
        value={categoryText}
        onChangeText={setCategoryText}
        placeholder="Separadas por virgulas"
        placeholderTextColor="#999"
      />

      <Pressable style={[styles.primaryBtn, !canSave && styles.btnDisabled]} onPress={handleSave} disabled={!canSave}>
        {isSaving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>Guardar no cerebro</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 12 },
  heading: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: '#999' },
  subheading: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15 },
  textarea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  secondaryBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, alignItems: 'center' },
  secondaryBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  primaryBtn: { backgroundColor: '#1a1a1a', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.4 },
  preview: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 12, gap: 4 },
  previewType: { fontSize: 11, textTransform: 'uppercase', color: '#999' },
  previewTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  previewAuthor: { fontSize: 13, color: '#666' },
  previewImage: { width: '100%', height: 140, borderRadius: 6, resizeMode: 'cover' },
  imagePreview: { width: '100%', height: 200, borderRadius: 8, resizeMode: 'cover' },
});

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { auth } from '../lib/firebase';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function SignInScreen() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSignIn() {
    setError('');
    setBusy(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { data } = await GoogleSignin.signIn();
      const credential = auth.GoogleAuthProvider.credential(data!.idToken);
      await auth().signInWithCredential(credential);
    } catch {
      setError('O login Google falhou. Tenta novamente.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Segundo Cerebro</Text>
      <Text style={styles.subtitle}>Ideias de Video</Text>
      <Pressable style={[styles.button, busy && styles.buttonDisabled]} onPress={handleSignIn} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar com Google</Text>}
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 48 },
  button: { backgroundColor: '#1a1a1a', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  error: { marginTop: 16, color: '#c00', textAlign: 'center' },
});

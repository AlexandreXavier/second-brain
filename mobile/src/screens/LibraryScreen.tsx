import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList, Text, View, TextInput, Pressable, ScrollView,
  Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { firestore, auth } from '../lib/firebase';
import { scopeIdeas, extractCategories, searchIdeas } from '../lib/library';
import { ideaMetaLabel } from '../lib/display';
import type { Idea } from '../lib/types';

type UserFilter = 'mine' | 'all';

export function LibraryScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [userFilter, setUserFilter] = useState<UserFilter>('mine');

  const user = auth().currentUser;

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('ideas')
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        setIdeas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Idea));
        setLoading(false);
      });
    return unsubscribe;
  }, []);

  const scopedIdeas = useMemo(
    () => scopeIdeas(ideas, userFilter, user?.uid ?? ''),
    [ideas, user, userFilter],
  );

  const categories = useMemo(
    () => ['Todas', ...extractCategories(scopedIdeas)],
    [scopedIdeas],
  );

  const filteredIdeas = useMemo(
    () => searchIdeas(scopedIdeas, queryText, activeCategory === 'Todas' ? '' : activeCategory),
    [scopedIdeas, queryText, activeCategory],
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator /></View>;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        value={queryText}
        onChangeText={setQueryText}
        placeholder="Pesquisar ideias"
        placeholderTextColor="#999"
      />

      <View style={styles.scopeRow}>
        <Pressable
          style={[styles.scopeBtn, userFilter === 'mine' && styles.scopeBtnActive]}
          onPress={() => { setUserFilter('mine'); setActiveCategory('Todas'); }}>
          <Text style={[styles.scopeText, userFilter === 'mine' && styles.scopeTextActive]}>Minhas ideias</Text>
        </Pressable>
        <Pressable
          style={[styles.scopeBtn, userFilter === 'all' && styles.scopeBtnActive]}
          onPress={() => { setUserFilter('all'); setActiveCategory('Todas'); }}>
          <Text style={[styles.scopeText, userFilter === 'all' && styles.scopeTextActive]}>Toda a equipa</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryStrip}>
        {categories.map(cat => (
          <Pressable
            key={cat}
            style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
            onPress={() => setActiveCategory(cat)}>
            <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={filteredIdeas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <IdeaCard idea={item} />}
        ListEmptyComponent={<Text style={styles.empty}>Sem ideias correspondentes.</Text>}
      />
    </View>
  );
}

function IdeaCard({ idea }: { idea: Idea }) {
  const image = idea.imageUrl || idea.thumbnailUrl;
  return (
    <View style={styles.card}>
      {image ? <Image source={{ uri: image }} style={styles.cardImage} /> : null}
      <View style={styles.cardBody}>
        <Text style={styles.cardMeta}>{ideaMetaLabel(idea)}</Text>
        <Text style={styles.cardTitle} numberOfLines={3}>{idea.title}</Text>
        {idea.author ? <Text style={styles.cardAuthor}>{idea.author}</Text> : null}
        {idea.categories?.length ? (
          <View style={styles.tagRow}>
            {idea.categories.map(cat => (
              <Text key={cat} style={styles.tag}>{cat}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  search: { margin: 12, padding: 10, backgroundColor: '#f4f4f4', borderRadius: 8, fontSize: 15 },
  scopeRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  scopeBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  scopeBtnActive: { backgroundColor: '#1a1a1a', borderColor: '#1a1a1a' },
  scopeText: { fontSize: 13, color: '#555' },
  scopeTextActive: { color: '#fff' },
  categoryStrip: { flexGrow: 0, paddingLeft: 12, marginBottom: 8 },
  categoryBtn: { marginRight: 8, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#f0f0f0' },
  categoryBtnActive: { backgroundColor: '#1a1a1a' },
  categoryText: { fontSize: 13, color: '#555' },
  categoryTextActive: { color: '#fff' },
  list: { padding: 12, gap: 12 },
  card: { backgroundColor: '#f9f9f9', borderRadius: 10, overflow: 'hidden' },
  cardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  cardBody: { padding: 12 },
  cardMeta: { fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  cardAuthor: { fontSize: 13, color: '#666' },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  tag: { fontSize: 11, backgroundColor: '#ebebeb', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, color: '#444' },
  empty: { textAlign: 'center', color: '#999', marginTop: 48 },
});

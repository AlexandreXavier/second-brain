import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList, Text, View, TextInput, Pressable, ScrollView,
  Image, StyleSheet, ActivityIndicator,
} from 'react-native';
import { firestore, auth } from '../lib/firebase';
import { scopeIdeas, extractCategories, searchIdeas, sortIdeas } from '../lib/library';
import { ideaMetaLabel, ideaCountLabel } from '../lib/display';
import { formatDate } from '../lib/format';
import { buildEditPayload } from '../lib/edit';
import { canDeleteIdea } from '../lib/delete';
import { formatCategories } from '../lib/metadata';
import type { Idea } from '../lib/types';

type UserFilter = 'mine' | 'all';
type SortOrder = 'newest' | 'oldest' | 'alpha';

export function LibraryScreen() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [userFilter, setUserFilter] = useState<UserFilter>('mine');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

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
    () => sortIdeas(
      searchIdeas(scopedIdeas, queryText, activeCategory === 'Todas' ? '' : activeCategory),
      sortOrder,
    ),
    [scopedIdeas, queryText, activeCategory, sortOrder],
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

      <View style={styles.scopeRow}>
        {(['newest', 'oldest', 'alpha'] as SortOrder[]).map((order, _, arr) => {
          const labels: Record<SortOrder, string> = { newest: 'Recentes', oldest: 'Antigas', alpha: 'A-Z' };
          return (
            <Pressable
              key={order}
              style={[styles.sortBtn, sortOrder === order && styles.sortBtnActive]}
              onPress={() => setSortOrder(order)}>
              <Text style={[styles.sortText, sortOrder === order && styles.sortTextActive]}>{labels[order]}</Text>
            </Pressable>
          );
        })}
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

      <Text style={styles.count}>{ideaCountLabel(filteredIdeas.length)}</Text>

      <FlatList
        data={filteredIdeas}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <IdeaCard idea={item} userId={user?.uid ?? ''} />}
        ListEmptyComponent={<Text style={styles.empty}>Sem ideias correspondentes.</Text>}
      />
    </View>
  );
}

function IdeaCard({ idea, userId }: { idea: Idea; userId: string }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editCategoryText, setEditCategoryText] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function openEdit() {
    setEditTitle(idea.title);
    setEditCategoryText(formatCategories(idea.categories ?? []));
    setEditNotes(idea.notes ?? '');
    setEditing(true);
  }

  async function handleDelete() {
    await firestore().collection('ideas').doc(idea.id).delete();
  }

  async function handleSaveEdit() {
    setIsSaving(true);
    try {
      const payload = buildEditPayload(idea, { title: editTitle, categoryText: editCategoryText, notes: editNotes });
      await firestore().collection('ideas').doc(idea.id).update({
        ...payload,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      setEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  const image = idea.imageUrl || idea.thumbnailUrl;
  return (
    <View style={styles.card}>
      {image ? <Image source={{ uri: image }} style={styles.cardImage} /> : null}
      <View style={styles.cardBody}>
        <Text style={styles.cardMeta}>{ideaMetaLabel(idea)}{idea.createdAt ? `  ·  ${formatDate(idea.createdAt)}` : ''}</Text>
        {editing ? (
          <>
            <TextInput style={styles.editInput} value={editTitle} onChangeText={setEditTitle} placeholder="Titulo" />
            <TextInput style={styles.editInput} value={editCategoryText} onChangeText={setEditCategoryText} placeholder="Categorias (separadas por virgulas)" />
            <TextInput style={styles.editInput} value={editNotes} onChangeText={setEditNotes} placeholder="Notas" multiline />
            <View style={styles.editRow}>
              <Pressable style={styles.editSaveBtn} onPress={handleSaveEdit} disabled={isSaving}>
                <Text style={styles.editSaveBtnText}>{isSaving ? 'A guardar…' : 'Guardar'}</Text>
              </Pressable>
              <Pressable onPress={() => setEditing(false)}>
                <Text style={styles.editCancelText}>Cancelar</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.cardTitle} numberOfLines={3}>{idea.title}</Text>
            {idea.author ? <Text style={styles.cardAuthor}>{idea.author}</Text> : null}
            {idea.categories?.length ? (
              <View style={styles.tagRow}>
                {idea.categories.map(cat => (
                  <Text key={cat} style={styles.tag}>{cat}</Text>
                ))}
              </View>
            ) : null}
            <View style={styles.editRow}>
              <Pressable onPress={openEdit} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Editar</Text>
              </Pressable>
              {canDeleteIdea(idea, userId) ? (
                <Pressable onPress={handleDelete} style={styles.editBtn}>
                  <Text style={styles.deleteBtnText}>Apagar</Text>
                </Pressable>
              ) : null}
            </View>
          </>
        )}
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
  sortBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#f0f0f0' },
  sortBtnActive: { backgroundColor: '#1a1a1a' },
  sortText: { fontSize: 12, color: '#555' },
  sortTextActive: { color: '#fff' },
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
  count: { fontSize: 11, color: '#999', paddingHorizontal: 12, marginBottom: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 48 },
  editInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, fontSize: 14, marginBottom: 6 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  editSaveBtn: { backgroundColor: '#1a1a1a', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 },
  editSaveBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  editCancelText: { fontSize: 13, color: '#999' },
  editBtn: { marginTop: 8, alignSelf: 'flex-start' },
  editBtnText: { fontSize: 12, color: '#888' },
  deleteBtnText: { fontSize: 12, color: '#c0392b' },
});

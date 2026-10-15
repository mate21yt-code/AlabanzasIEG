import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VectorIcon from 'react-native-vector-icons/Ionicons';
const Ionicons = VectorIcon as any;
import { supabase } from '../../supabase';
import { colors, radius, spacing } from '../theme';

export default function CalendarScreen({ navigation }: any) {
  const [planificacion, setPlanificacion] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    cargarPlanificacion();
  }, []);

  const cargarPlanificacion = async (esRefresh = false) => {
    try {
      if (esRefresh) setRefreshing(true);
      else setLoading(true);

      const { data, error } = await supabase.from('Planificacion').select('*');
      if (error) throw error;
      setPlanificacion(data || []);
    } catch (error: any) {
      console.error('Error cargando calendario:', error?.message);
      Alert.alert('No se pudo cargar el calendario', 'Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const renderHeader = () => {
    if (planificacion.length === 0) return null;
    return <Text style={styles.intro}>Quién dirige cada domingo</Text>;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendario</Text>
        <View style={{ width: 42 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={planificacion}
          keyExtractor={(item, index) => (item.id != null ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => cargarPlanificacion(true)}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardDate}>{item.fecha || item.Fecha}</Text>
                <Text style={styles.cardDirector}>
                  {item.director || item.Director || item.responsable || item.Responsable}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-clear-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No hay fechas planificadas</Text>
              <Text style={styles.emptyText}>Cuando se carguen, vas a verlas acá.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  list: { padding: spacing.md, paddingBottom: spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intro: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.md },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDate: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardDirector: { fontSize: 14, color: colors.textMuted, marginTop: 3 },

  empty: { alignItems: 'center', marginTop: 80, gap: 8, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
});
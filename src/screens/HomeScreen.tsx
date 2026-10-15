import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VectorIcon from 'react-native-vector-icons/Ionicons';
const Ionicons = VectorIcon as any;
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../supabase';
import { colors, radius, spacing } from '../theme';
import { formatearFecha } from '../utils'; // En vez de duplicar la misma función, importamos la versión de utils.ts

// Función para determinar si una fecha es la más cercana a partir de hoy (próximo domingo)
function esProximoDomingo(fechaStr: string, lista: any[]): boolean {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechasValidas = lista
      .map((item) => {
        const fStr = item.fecha || item.Fecha;
        const partes = fStr?.split('-');
        if (partes?.length === 3) {
          const d = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
          return { original: fStr, date: d };
        }
        return null;
      })
      .filter((x): x is { original: string; date: Date } => x !== null && x.date >= hoy);

    if (fechasValidas.length === 0) return false;

    // Ordenar por la fecha más cercana futura
    fechasValidas.sort((a, b) => a.date.getTime() - b.date.getTime());
    return fechasValidas[0].original === fechaStr;
  } catch {
    return false;
  }
}

export default function HomeScreen({ navigation }: any) {
  const [planificaciones, setPlanificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  useFocusEffect(
    useCallback(() => {
      cargarDomingos();
    }, [])
  );

  const cargarDomingos = async (esRefresh = false) => {
    try {
      if (esRefresh) setRefreshing(true);
      else setLoading(true);

      const { data, error } = await supabase.from('Domingos').select('*');
      if (error) throw error;
      setPlanificaciones(data || []);
    } catch (err: any) {
      console.error('Error cargando domingos:', err?.message || err);
      Alert.alert('No se pudieron cargar los domingos', 'Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const eliminarDomingo = (item: any) => {
    const fecha = item.fecha || item.Fecha;

    Alert.alert('Eliminar domingo', `¿Querés borrar el domingo ${formatearFecha(fecha)}? No se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('Domingos').delete().eq('fecha', fecha);
            if (error) throw error;
            cargarDomingos();
          } catch (err) {
            Alert.alert('No se pudo eliminar', 'Intentá de nuevo en unos segundos.');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="cover" />
          <View>
            <Text style={styles.title}>Alabanzas IEG</Text>
            <Text style={styles.subtitle}>Domingos programados</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Calendar')}
          accessibilityLabel="Abrir calendario"
        >
          <Ionicons name="calendar-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={planificaciones}
          keyExtractor={(item: any, index: number) => (item.id != null ? item.id.toString() : index.toString())}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => cargarDomingos(true)}
          renderItem={({ item }) => {
            const canciones = item.canciones || item.Canciones;
            const fechaRaw = item.fecha || item.Fecha;
            const esProximo = esProximoDomingo(fechaRaw, planificaciones);

            return (
              <View style={[styles.card, esProximo && styles.cardProximo]}>
                {esProximo && (
                  <View style={styles.badgeProximo}>
                    <Text style={styles.badgeProximoText}>Próximo domingo</Text>
                  </View>
                )}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardDate}>{formatearFecha(fechaRaw)}</Text>
                    <View style={styles.row}>
                      <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                      <Text style={styles.cardResponsible}>{item.responsable || item.Responsable}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => eliminarDomingo(item)}
                    hitSlop={10}
                    accessibilityLabel="Eliminar domingo"
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                {Array.isArray(canciones) && canciones.length > 0 && (
                  <View style={styles.songs}>
                    {canciones.map((cancion: string, index: number) => (
                      <View key={index} style={styles.songRow}>
                        <Text style={styles.songNumber}>{index + 1}</Text>
                        <Text style={styles.songName}>{cancion}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Todavía no hay domingos</Text>
              <Text style={styles.emptyText}>Tocá el botón + para cargar el primero.</Text>
            </View>
          }
        />
      )}

      {/* Botón flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Upload')}
        activeOpacity={0.85}
        accessibilityLabel="Agregar domingo"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 1 },
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

  list: { padding: spacing.md, paddingBottom: 110 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardProximo: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  badgeProximo: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  badgeProximoText: { fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase' },

  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardDate: { fontSize: 18, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  cardResponsible: { fontSize: 14, color: colors.textMuted },

  songs: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  songNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    color: colors.accent,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
  },
  songName: { flex: 1, fontSize: 15, color: colors.text },

  empty: { alignItems: 'center', marginTop: 80, gap: 8, paddingHorizontal: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 8 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
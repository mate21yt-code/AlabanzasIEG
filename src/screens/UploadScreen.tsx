import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VectorIcon from 'react-native-vector-icons/Ionicons';
const Ionicons = VectorIcon as any;
import { supabase } from '../../supabase';
import { colors, radius, spacing } from '../theme';
import { formatearFecha } from '../utils'; //En vez de duplicar la función (en Upload y HomeScreen), la importamos desde utils.ts

type TipoModal = 'domingo' | 'responsable' | 'cancion' | '';

const TOTAL_CANCIONES = 5;

export default function UploadScreen({ navigation }: any) {
  const [responsable, setResponsable] = useState('');
  const [domingo, setDomingo] = useState('');
  const [canciones, setCanciones] = useState<string[]>(Array(TOTAL_CANCIONES).fill(''));

  const [listaResponsables, setListaResponsables] = useState<string[]>([]);
  const [listaDomingos, setListaDomingos] = useState<string[]>([]);
  const [repertorio, setRepertorio] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [tipoModal, setTipoModal] = useState<TipoModal>('');
  const [slotActivo, setSlotActivo] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const [modalNuevaVisible, setModalNuevaVisible] = useState(false);
  const [nuevaTexto, setNuevaTexto] = useState('');
  const [guardandoCancion, setGuardandoCancion] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarCanciones = async () => {
    const { data, error } = await supabase.from('Canciones').select('*').order('nombre', { ascending: true });
    if (error) throw error;
    setRepertorio((data || []).map((c: any) => c.nombre || c.Nombre || c.titulo || c.Titulo));
  };

  const cargarDatos = async () => {
    try {
      setLoadingData(true);

      const { data: respData, error: respError } = await supabase.from('Responsables').select('*');
      if (respError) throw respError;
      setListaResponsables((respData || []).map((r: any) => r.nombre || r.Nombre));

      const { data: domData, error: domError } = await supabase.from('Planificacion').select('*');
      if (domError) throw domError;
      setListaDomingos((domData || []).map((d: any) => d.fecha || d.Fecha));

      await cargarCanciones();
    } catch (error: any) {
      console.error('Error cargando datos de Supabase:', error?.message);
      Alert.alert('No se pudieron cargar los datos', 'Revisá tu conexión e intentá de nuevo.');
    } finally {
      setLoadingData(false);
    }
  };

  const abrirSelector = (tipo: TipoModal, slot: number | null = null) => {
    setTipoModal(tipo);
    setSlotActivo(slot);
    setBusqueda('');
    setModalVisible(true);
  };

  const cerrarSelector = () => setModalVisible(false);

  const seleccionarItem = (valor: string) => {
    if (tipoModal === 'domingo') {
      setDomingo(valor);
    } else if (tipoModal === 'responsable') {
      setResponsable(valor);
    } else if (tipoModal === 'cancion' && slotActivo !== null) {
      setCanciones((prev) => prev.map((c, i) => (i === slotActivo ? valor : c)));
    }
    cerrarSelector();
  };

  const quitarCancion = (index: number) => {
    setCanciones((prev) => prev.map((c, i) => (i === index ? '' : c)));
  };

  const itemsModal = useMemo(() => {
    if (tipoModal === 'domingo') return listaDomingos;
    if (tipoModal === 'responsable') return listaResponsables;
    if (tipoModal === 'cancion') {
      const usadas = canciones.filter((c, i) => c && i !== slotActivo);
      return repertorio.filter((c) => !usadas.includes(c));
    }
    return [];
  }, [tipoModal, listaDomingos, listaResponsables, repertorio, canciones, slotActivo]);

  const itemsFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return itemsModal;
    return itemsModal.filter((i) => i?.toLowerCase().includes(q));
  }, [itemsModal, busqueda]);

  const valorActualModal =
    tipoModal === 'domingo'
      ? domingo
      : tipoModal === 'responsable'
      ? responsable
      : slotActivo !== null
      ? canciones[slotActivo]
      : '';

  const tituloModal =
    tipoModal === 'domingo'
      ? 'Elegí la fecha'
      : tipoModal === 'responsable'
      ? 'Elegí quién dirige'
      : `Canción ${(slotActivo ?? 0) + 1} de ${TOTAL_CANCIONES}`;

  const guardarNuevaCancion = async () => {
    const nombre = nuevaTexto.trim();
    if (!nombre) {
      Alert.alert('Falta el nombre', 'Escribí el nombre de la canción.');
      return;
    }
    if (repertorio.some((c) => c?.toLowerCase() === nombre.toLowerCase())) {
      Alert.alert('Ya existe', 'Esa canción ya está en el repertorio.');
      return;
    }

    try {
      setGuardandoCancion(true);
      const { error } = await supabase.from('Canciones').insert([{ nombre }]);
      if (error) throw error;

      setNuevaTexto('');
      setModalNuevaVisible(false);
      await cargarCanciones();
    } catch (error: any) {
      console.error('Error al guardar canción:', JSON.stringify(error, null, 2));
      Alert.alert('No se pudo guardar', error?.message || 'Error desconocido');
    } finally {
      setGuardandoCancion(false);
    }
  };

  const validarYGuardar = async () => {
    if (!domingo) return Alert.alert('Falta la fecha', 'Elegí la fecha del domingo.');
    if (!responsable) return Alert.alert('Falta el responsable', 'Elegí quién dirige.');
    if (canciones.some((c) => c === '')) {
      return Alert.alert('Canciones incompletas', `Tenés que elegir las ${TOTAL_CANCIONES} canciones.`);
    }

    try {
      setGuardando(true);

      // Validar si ya existe este domingo cargado
      const { data: existente, error: errBusqueda } = await supabase
        .from('Domingos')
        .select('fecha')
        .eq('fecha', domingo);

      if (errBusqueda) throw errBusqueda;
      if (existente && existente.length > 0) {
        setGuardando(false);
        Alert.alert('Domingo ya programado', 'Ya existe una alabanza guardada para esta fecha.');
        return;
      }

      const { error } = await supabase.from('Domingos').insert([
        {
          fecha: domingo,
          fecha_mostrada: domingo,
          responsable,
          canciones,
        },
      ]);
      if (error) throw error;

      Alert.alert('Guardado', 'La alabanza se guardó correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error('Error al guardar:', error?.message);
      Alert.alert('No se pudo guardar', 'Intentá de nuevo en unos segundos.');
    } finally {
      setGuardando(false);
    }
  };

  const completas = canciones.filter(Boolean).length;

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Cargando listas…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
        <Text style={styles.headerTitle}>Nueva alabanza</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.form}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Fecha */}
        <Text style={styles.label}>Fecha del domingo</Text>
        <SelectField
          icon="calendar-outline"
          value={domingo ? formatearFecha(domingo) : ''}
          placeholder="Elegir fecha"
          onPress={() => abrirSelector('domingo')}
        />

        {/* Responsable */}
        <Text style={styles.label}>Dirige</Text>
        <SelectField
          icon="person-outline"
          value={responsable}
          placeholder="Elegir responsable"
          onPress={() => abrirSelector('responsable')}
        />

        {/* Canciones */}
        <View style={styles.songsHeader}>
          <View>
            <Text style={[styles.label, { marginTop: 0, marginBottom: 2 }]}>Canciones</Text>
            <Text style={styles.counter}>
              {completas} de {TOTAL_CANCIONES} elegidas
            </Text>
          </View>
          <TouchableOpacity
            style={styles.ghostButton}
            onPress={() => setModalNuevaVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={18} color={colors.accent} />
            <Text style={styles.ghostButtonText}>Nueva canción</Text>
          </TouchableOpacity>
        </View>

        {canciones.map((cancion, index) => (
          <View key={index} style={styles.slotRow}>
            <View style={[styles.slotBadge, !!cancion && styles.slotBadgeActive]}>
              {cancion ? (
                <Ionicons name="checkmark" size={14} color="#fff" />
              ) : (
                <Text style={styles.slotBadgeText}>{index + 1}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <SelectField
                value={cancion}
                placeholder="Elegir canción"
                onPress={() => abrirSelector('cancion', index)}
                onClear={cancion ? () => quitarCancion(index) : undefined}
                compact
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, guardando && { opacity: 0.6 }]}
          onPress={validarYGuardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Guardar alabanza</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal Selector */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={cerrarSelector}>
        <Pressable style={styles.overlay} onPress={cerrarSelector}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{tituloModal}</Text>

            {itemsModal.length > 6 && (
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar"
                  placeholderTextColor={colors.textMuted}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  autoCorrect={false}
                />
              </View>
            )}

            <FlatList
              data={itemsFiltrados}
              keyExtractor={(item, i) => `${item}-${i}`}
              style={{ maxHeight: 340 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const activo = item === valorActualModal;
                const textoMostrar = tipoModal === 'domingo' ? formatearFecha(item) : item;
                return (
                  <TouchableOpacity
                    style={[styles.option, activo && styles.optionActive]}
                    onPress={() => seleccionarItem(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, activo && { color: colors.accent, fontWeight: '600' }]}>
                      {textoMostrar}
                    </Text>
                    {activo && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {busqueda ? 'No hay resultados para tu búsqueda.' : 'No hay opciones disponibles.'}
                </Text>
              }
            />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Nueva Canción */}
      <Modal
        visible={modalNuevaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalNuevaVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.overlayCenter}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Nueva canción</Text>
            <Text style={styles.dialogHint}>Se agrega al repertorio para usarla en cualquier domingo.</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Nombre de la canción"
              placeholderTextColor={colors.textMuted}
              value={nuevaTexto}
              onChangeText={setNuevaTexto}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={guardarNuevaCancion}
            />

            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setNuevaTexto('');
                  setModalNuevaVisible(false);
                }}
              >
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButtonSmall, guardandoCancion && { opacity: 0.6 }]}
                onPress={guardarNuevaCancion}
                disabled={guardandoCancion}
              >
                {guardandoCancion ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonSmallText}>Agregar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function SelectField({
  value,
  placeholder,
  onPress,
  onClear,
  icon,
  compact,
}: {
  value: string;
  placeholder: string;
  onPress: () => void;
  onClear?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.field, compact && styles.fieldCompact]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Ionicons name={icon} size={18} color={colors.textMuted} style={{ marginRight: 10 }} />}
      <Text style={[styles.fieldText, !value && { color: colors.textMuted }]} numberOfLines={1}>
        {value || placeholder}
      </Text>
      {onClear ? (
        <TouchableOpacity onPress={onClear} hitSlop={10} accessibilityLabel="Quitar canción">
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.textMuted, marginTop: spacing.sm, fontSize: 14 },

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

  form: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: spacing.md, marginBottom: 8 },
  songsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: spacing.lg,
    marginBottom: spacing.sm + 4,
  },
  counter: { fontSize: 13, color: colors.textMuted },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },
  fieldCompact: { paddingVertical: 13 },
  fieldText: { flex: 1, fontSize: 16, color: colors.text },

  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  slotBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotBadgeActive: { backgroundColor: colors.accent },
  slotBadgeText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },

  ghostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm + 4,
    backgroundColor: colors.accentSoft,
  },
  ghostButtonText: { fontSize: 14, fontWeight: '600', color: colors.accent },

  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg + 4,
    borderTopRightRadius: radius.lg + 4,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.sm + 4,
  },
  optionActive: { backgroundColor: colors.accentSoft },
  optionText: { fontSize: 16, color: colors.text, flex: 1, paddingRight: 8 },
  emptyText: { textAlign: 'center', color: colors.textMuted, paddingVertical: spacing.lg },

  overlayCenter: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg - 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dialogTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  dialogHint: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  textInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: spacing.md },
  secondaryButton: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: radius.sm + 4 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  primaryButtonSmall: {
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: radius.sm + 4,
    minWidth: 96,
    alignItems: 'center',
  },
  primaryButtonSmallText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
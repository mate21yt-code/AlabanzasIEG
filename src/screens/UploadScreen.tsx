import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { supabase } from '../../supabase';

export default function UploadScreen({ navigation }: any) {
  const [responsableSeleccionado, setResponsableSeleccionado] = useState('');
  const [domingoSeleccionado, setDomingoSeleccionado] = useState('');
  const [cancionesSlots, setCancionesSlots] = useState(['', '', '', '', '']);

  const [listaResponsables, setListaResponsables] = useState<string[]>([]);
  const [listaDomingos, setListaDomingos] = useState<string[]>([]);
  const [repertorioCanciones, setRepertorioCanciones] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados para los modales de selección y para el modal de nueva canción
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoModal, setTipoModal] = useState('');
  const [slotActivo, setSlotActivo] = useState<number | null>(null);

  // Estados para el modal de agregar nueva canción
  const [modalNuevaCancionVisible, setModalNuevaCancionVisible] = useState(false);
  const [nuevaCancionTexto, setNuevaCancionTexto] = useState('');
  const [guardandoCancion, setGuardandoCancion] = useState(false);

  useEffect(() => {
    cargarDatosSupabase();
  }, []);

  const cargarDatosSupabase = async () => {
    try {
      setLoadingData(true);

      // 1. Obtener Responsables
      const { data: respData, error: respError } = await supabase.from('Responsables').select('*');
      if (respError) throw respError;
      setListaResponsables((respData || []).map((r: any) => r.nombre || r.Nombre));

      // 2. Obtener Domingos
      const { data: domData, error: domError } = await supabase.from('Planificacion').select('*');
      if (domError) throw domError;
      setListaDomingos((domData || []).map((d: any) => d.fecha || d.Fecha));

      // 3. Obtener Canciones ordenadas alfabéticamente por 'nombre'
      const { data: cancData, error: cancError } = await supabase
        .from('Canciones')
        .select('*')
        .order('nombre', { ascending: true });
      if (cancError) throw cancError;

      setRepertorioCanciones((cancData || []).map((c: any) => c.nombre || c.Nombre || c.titulo || c.Titulo));

    } catch (error: any) {
      console.error('Error cargando datos de Supabase:', error?.message);
      Alert.alert('Error', 'No se pudieron cargar los datos de la base de datos.');
    } finally {
      setLoadingData(false);
    }
  };

  const abrirSelector = (tipo: string, slotIndex: number | null = null) => {
    setTipoModal(tipo);
    if (slotIndex !== null) setSlotActivo(slotIndex);
    setModalVisible(true);
  };

  const seleccionarItem = (valor: string) => {
    if (tipoModal === 'domingo') {
      setDomingoSeleccionado(valor);
    } else if (tipoModal === 'responsable') {
      setResponsableSeleccionado(valor);
    } else if (tipoModal === 'cancion' && slotActivo !== null) {
      const nuevasCanciones = [...cancionesSlots];
      nuevasCanciones[slotActivo] = valor;
      setCancionesSlots(nuevasCanciones);
    }
    setModalVisible(false);
  };

  // Función para guardar una nueva canción en Supabase
  const guardarNuevaCancion = async () => {
    if (!nuevaCancionTexto.trim()) {
      Alert.alert('Campo vacío', 'Por favor ingresa el nombre de la canción.');
      return;
    }

    try {
      setGuardandoCancion(true);
      // Asumiendo que tu columna en la tabla Canciones se llama 'nombre'
      const { error } = await supabase.from('Canciones').insert([
        { nombre: nuevaCancionTexto.trim() }
      ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Canción agregada al repertorio.');
      setNuevaCancionTexto('');
      setModalNuevaCancionVisible(false);
      
      // Recargamos las canciones para que aparezca ordenada al instante
      cargarDatosSupabase();
    } catch (error: any) {
      console.error('Error detallado de Supabase:', JSON.stringify(error, null, 2));
      Alert.alert('Error', `No se pudo guardar: ${error?.message || 'Error desconocido'}`);
    } finally {
      setGuardandoCancion(false);
    }
  };

  const validarYGuardar = async () => {
    if (!domingoSeleccionado) {
      Alert.alert('Falta fecha', 'Por favor selecciona la fecha del domingo.');
      return;
    }
    if (!responsableSeleccionado) {
      Alert.alert('Falta responsable', 'Por favor selecciona un responsable.');
      return;
    }
    if (cancionesSlots.some((c) => c === '')) {
      Alert.alert('Canciones incompletas', 'Debes seleccionar exactamente las 5 canciones.');
      return;
    }

    try {
      const { error } = await supabase.from('Domingos').insert([
        {
          fecha: domingoSeleccionado,
          fecha_mostrada: domingoSeleccionado,
          responsable: responsableSeleccionado,
          canciones: cancionesSlots,
        },
      ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Alabanza guardada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Error al guardar:', error?.message);
      Alert.alert('Error', 'No se pudo guardar en la base de datos.');
    }
  };

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.containerDark, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2ed573" />
        <Text style={{ color: '#ffffff', marginTop: 10 }}>Cargando listas desde Supabase...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.containerDark}>
      <View style={styles.headerDark}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.appTitleDark}>Asignar Alabanzas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.formContainerDark}>
        <Text style={styles.mainHeading}>Cargar Nueva Alabanza</Text>

        <Text style={styles.labelDark}>Fecha del Domingo:</Text>
        <TouchableOpacity style={styles.inputBox} onPress={() => abrirSelector('domingo')}>
          <Text style={[styles.inputText, !domingoSeleccionado && styles.placeholderText]}>
            {domingoSeleccionado || 'Seleccionar fecha'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.labelDark}>Responsable:</Text>
        <TouchableOpacity style={styles.inputBox} onPress={() => abrirSelector('responsable')}>
          <Text style={[styles.inputText, !responsableSeleccionado && styles.placeholderText]}>
            {responsableSeleccionado || 'Seleccionar responsable'}
          </Text>
        </TouchableOpacity>

        <View style={styles.songsHeaderRow}>
          <Text style={styles.labelDark}>Elegir canciones (5):</Text>
          <TouchableOpacity 
            style={styles.addSongButton} 
            onPress={() => setModalNuevaCancionVisible(true)}
          >
            <Text style={styles.addSongButtonText}>+ Nueva Canción</Text>
          </TouchableOpacity>
        </View>

        {cancionesSlots.map((cancionSlot, index) => (
          <View key={index} style={styles.slotRow}>
            <Text style={styles.slotNumber}>{index + 1}.</Text>
            <TouchableOpacity 
              style={styles.inputBoxSlot} 
              onPress={() => abrirSelector('cancion', index)}
            >
              <Text style={[styles.inputText, !cancionSlot && styles.placeholderText]}>
                {cancionSlot || 'Seleccionar canción'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={validarYGuardar}>
          <Text style={styles.saveButtonText}>Guardar Alabanza</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.undoButton} onPress={() => navigation.goBack()}>
          <Text style={styles.undoButtonText}>Deshacer</Text>
        </TouchableOpacity>
      </ScrollView>


      {/* Modal para seleccionar elementos (Domingo, Responsable, Canción) */}
      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {tipoModal === 'domingo' && 'Seleccionar Domingo'}
              {tipoModal === 'responsable' && 'Seleccionar Responsable'}
              {tipoModal === 'cancion' && `Seleccionar Canción (${(slotActivo ?? 0) + 1}/5)`}
            </Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {tipoModal === 'domingo' && listaDomingos.map((dom, idx) => (
                <TouchableOpacity key={idx} style={styles.modalItem} onPress={() => seleccionarItem(dom)}>
                  <Text style={styles.modalItemText}>{dom}</Text>
                </TouchableOpacity>
              ))}

              {tipoModal === 'responsable' && listaResponsables.map((resp, idx) => (
                <TouchableOpacity key={idx} style={styles.modalItem} onPress={() => seleccionarItem(resp)}>
                  <Text style={styles.modalItemText}>{resp}</Text>
                </TouchableOpacity>
              ))}

              {tipoModal === 'cancion' && repertorioCanciones.map((cancion, i) => (
                <TouchableOpacity key={i} style={styles.modalItem} onPress={() => seleccionarItem(cancion)}>
                  <Text style={styles.modalItemText}>{cancion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


      {/* Modal para agregar una nueva canción al repertorio */}
      <Modal visible={modalNuevaCancionVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar Nueva Canción</Text>
            
            <TextInput
              style={styles.textInputModal}
              placeholder="Nombre de la canción"
              placeholderTextColor="#6b96ce"
              value={nuevaCancionTexto}
              onChangeText={setNuevaCancionTexto}
              autoFocus={true}
            />

            <TouchableOpacity 
              style={[styles.saveButton, { marginTop: 16 }]} 
              onPress={guardarNuevaCancion}
              disabled={guardandoCancion}
            >
              {guardandoCancion ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar Canción</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.modalCloseButton, { marginTop: 10 }]} 
              onPress={() => setModalNuevaCancionVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerDark: { flex: 1, backgroundColor: '#21164c' },
  headerDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: 38,
    backgroundColor: '#7a1367',
  },


   backButton: { paddingVertical: 4, paddingHorizontal: 8, backgroundColor: '#570e49', borderRadius: 6, borderWidth: 1, borderColor: '#7a1367' },
  backButtonText: { fontSize: 16, color: '#ffffff', fontWeight: 'bold' },
  appTitleDark: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },//color y tamaño de "Asignar Alabanzas"
  formContainerDark: { padding: 20, paddingBottom: 40 },
  mainHeading: { fontSize: 22, fontWeight: 'bold', color: '#0dae50', marginBottom: 20 },//color y tamaño de "Cargar Nueva Alabanza"
  labelDark: { fontSize: 16, fontWeight: '600', color: '#22a0c0', marginBottom: 8, marginTop: 10 },//color y tamaño de los titulos "Fecha del Domingo", "Responsable" y "Elegir canciones"
  songsHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 8 },
  
  
  addSongButton: { backgroundColor: '#0984e3', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },//color de fondo del boton "+ Nueva Canción"
  addSongButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },//color y tamaño del texto del boton "+ Nueva Canción"
 
  inputBox: { backgroundColor: '#e5e7f1', padding: 14, borderRadius: 8, marginBottom: 14 },//color de fondo de los input (responsable y fecha)

  inputText: { fontSize: 16, color: '#1261d0', fontWeight: '500' },//color del texto de los input cuando hay valor
  
  placeholderText: { color: '#0b0c0c' },//color del texto de los input cuando no hay valor 
  slotRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  
  slotNumber: { fontSize: 18, fontWeight: 'bold', color: '#f5f2f2', width: 28 },//color de los numeros
  inputBoxSlot: { flex: 1, backgroundColor: '#f6f7fb', padding: 14, borderRadius: 8 },//color de fondo de los input de las canciones
 
 
  saveButton: { //Boton de "Guardar Alabanza"
    backgroundColor: '#039814',//color de fondo de "Guardar Alabanza"
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
    elevation: 4,
  },
  saveButtonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },//color de "Guardar Alabanza"
  
  
  undoButton: { //Boton de "Deshacer / Volver"
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#f72133',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  undoButtonText: { fontSize: 16, fontWeight: 'bold', color: '#ff4757' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }, 
  modalContent: {
    backgroundColor: '#21164c', //color de fondo de las pestanas de seleccion de responsable, domingo y canciones
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },


  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#f5f5f6', marginBottom: 16, textAlign: 'center' },//color y tamaño de los titulos de las pestanas "Seleccionar Domingo", "Seleccionar Responsable", "Seleccionar Canción" y "Agregar Nueva Canción"
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },//color de fondo de los items del modal de seleccion de responsable, domingo y canciones
  modalItemText: { fontSize: 16, color: '#eef0f3', textAlign: 'center' },//color del texto de los items de la pestana de seleccion de responsable, domingo y canciones
  
  modalCloseButton: { marginTop: 16, padding: 12, backgroundColor: '#ff4757', borderRadius: 8, alignItems: 'center' },
  modalCloseText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 }, //color del texto del boton "Cancelar" del modal
  textInputModal: {
    backgroundColor: '#f0eff3', //color de fondo del input de nueva canción
    borderWidth: 1,
    borderColor: '#dcdde1', //color del borde del input de nueva canción
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: '#2265c4', //color del texto del input de nueva canción
  },
});
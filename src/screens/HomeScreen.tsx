import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '../../supabase';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeScreen({ navigation }: any) {
  const [planificaciones, setPlanificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useFocusEffect(
    useCallback(() => {
      cargarDomingos();
    }, [])
  );

  const cargarDomingos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('Domingos').select('*');
      if (error) throw error;
      setPlanificaciones(data || []);
    } catch (err: any) {
      console.error('Error cargando domingos:', err?.message || err);
      Alert.alert('Error', 'No se pudieron cargar los registros de Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const eliminarDomingo = async (idOFecha: any) => {
    Alert.alert(
      'Eliminar planificación',
      '¿Estás seguro de que querés borrar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('Domingos').delete().eq('fecha', idOFecha);
              if (error) throw error;
              cargarDomingos();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el registro.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER MEJORADO CON LOGO CENTRADO */}
      <View style={styles.header}>
        
        {/* Fila superior: Botón Calendario y Botón Agregar */}
        <View style={styles.headerButtonsRow}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={() => navigation.navigate('Calendar')}
          >
            <Text style={styles.headerButtonText}>📅 Calendario</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.headerButtonPrimary} 
            onPress={() => navigation.navigate('Upload')}
          >
            <Text style={styles.headerButtonPrimaryText}>+ Agregar</Text>
          </TouchableOpacity>
        </View>

        {/* Contenedor del logo y título alineados al centro */}
        <View style={styles.logoAndTitleContainer}>
          <View style={styles.logoWrapper}>
            <Image 
              source={require('../../assets/logo.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.appTitle}>Alabanzas IEG</Text>
        </View>
        
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0984e3" />
          <Text style={{ marginTop: 10, color: '#718093' }}>Cargando datos...</Text>
        </View>
      ) : (
        <FlatList
          data={planificaciones}
          keyExtractor={(item: any, index: number) => item.id ? item.id.toString() : index.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardDate}>{item.fecha || item.Fecha}</Text>
                  <Text style={styles.cardResponsible}>
                    Dirige: <Text style={styles.boldText}>{item.responsable || item.Responsable}</Text>
                  </Text>
                </View>
                
                <TouchableOpacity onPress={() => eliminarDomingo(item.fecha || item.Fecha)} style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <Text style={styles.songsTitle}>Canciones:</Text>
              {Array.isArray(item.canciones || item.Canciones) && 
                (item.canciones || item.Canciones).map((cancion: string, index: number) => (
                  <Text key={index} style={styles.songItem}>
                    {index + 1}. {cancion}
                  </Text>
                ))
              }
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay domingos programados todavía.</Text>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#21164c' },//color de fondo de la pantalla
  header: {
    backgroundColor: '#7a1367',//color de fondo del header
    paddingTop: 45, //ajusta el padding superior del header para que el logo y título estén más cerca del borde superior
    paddingBottom: 1, //ajusta el padding inferior del header para que los botones estén más cerca del borde inferior
    paddingHorizontal: 15, //ajusta el padding horizontal del header para que los botones estén más cerca de los bordes
    paddingVertical: 1, // Ajusta el padding vertical para que el logo y título estén más cerca del borde superior
    borderBottomWidth: 1, //grosor del borde inferior del header
    borderBottomColor: '#dcdde1',
    elevation: 4, //agrega sombra al header
  },
  headerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 10, //posiciona los botones (mas chico, menos espacio desde arriba)
    zIndex: 1, // Asegura que los botones estén por encima del logo
  },
  headerButton: {
    paddingVertical: 7, //tamaño vertical de boton Calendario
    paddingHorizontal: 10, //tamaño horizontal de boton Calendario
    backgroundColor: '#f5f6fa',
    borderRadius: 5, //curvatura de los bordes del boton Calendario
    borderWidth: 1, //grosor del borde del boton Calendario
    borderColor: '#dcdde1',
  },
  headerButtonText: { fontSize: 14, color: '#0f0f10', fontWeight: '600' }, //color y tamaño del texto del boton Calendario
  headerButtonPrimary: {
    paddingVertical: 7, //tamaño vertical de boton Agregar
    paddingHorizontal: 10, //tamaño horizontal de boton Agregar
    backgroundColor: '#1567a7',
    borderRadius: 5,//curvatura de los bordes del boton Agregar
  },
  headerButtonPrimaryText: { fontSize: 14, color: '#ffffff', fontWeight: 'bold' }, //color y tamaño del texto del boton Agregar
  
  logoAndTitleContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: -33, // Ajusta la posición vertical del logo y título
  },
  logoWrapper: {
    position: 'absolute',
    left: 0, // Alinea el logo a la izquierda
    right: 0, // Alinea el logo a la derecha
    alignItems: 'center', // Centra el logo horizontalmente
    top: 0, // Ajusta la posición vertical del logo con respecto a AlabanzasIEG (mas grande mas cerca)
  },
  logoImage: {
    width: 65, // Ajusta el tamaño del logo
    height: 65, // Ajusta el tamaño del logo
    borderRadius: 32.5, // Hace que el logo sea circular
    borderWidth: 2, //grosor del borde del logo
    borderColor: '#e7ebef',
  },
  appTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#dce7f3', //color del texto AlabanzasIEG
    textAlign: 'center',
    marginTop: 60,// Ajusta la posición vertical del título con respecto al logo (mas grande mas cerca)
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  listContainer: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#82a4ed', //color de fondo de las cards
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardDate: { fontSize: 16, fontWeight: 'bold', color: '#080909' },//color de la fecha
  cardResponsible: { fontSize: 14, color: '#0f0f10', marginTop: 4 }, //color de "Dirige"
  boldText: { fontWeight: 'bold', color: '#eeecec' }, //color de los nombres de los responsables 
  deleteButton: { padding: 6 },
  deleteButtonText: { backgroundColor: '#f0efef', fontSize: 18 }, //color del boton de eliminar
  divider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 12 },
  songsTitle: { fontSize: 16, fontWeight: 'bold', color: '#072f64', marginBottom: 6, textTransform: 'uppercase' }, //color de "Canciones elegidas"
  songItem: { fontSize: 16, color: '#f6f3f3', paddingVertical: 2 }, //color de las canciones elegidas y numero
  emptyContainer: { marginTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 20, color: '#b72411' }, //color del texto "No hay domingos programados todavía."
});
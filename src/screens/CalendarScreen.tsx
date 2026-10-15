import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { supabase } from '../../supabase';

export default function CalendarScreen({ navigation }: any) {
  const [planificacion, setPlanificacion] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPlanificacion();
  }, []);

  const cargarPlanificacion = async () => {
    try {
      setLoading(true);
      // Consulta a la tabla 'Planificacion' (o 'Domingos' si prefieres mostrar los domingos cargados)
      const { data, error } = await supabase.from('Planificacion').select('*');
      if (error) throw error;
      setPlanificacion(data || []);
    } catch (error: any) {
      console.error('Error cargando calendario:', error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.appTitle}>Calendario de Responsables</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#0984e3" />
          <Text style={{ marginTop: 10, color: '#718093' }}>Cargando calendario...</Text>
        </View>
      ) : (
        <FlatList
          data={planificacion}
          keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.calendarCard}>
              {/* Fecha arriba */}
              <Text style={styles.cardDate}>📅 {item.fecha || item.Fecha}</Text>
              
              <View style={styles.divider} />

              {/* Director abajo */}
              <Text style={styles.cardDirector}>
                Director: <Text style={styles.boldText}>{item.director || item.Director || item.responsable || item.Responsable}</Text>
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.content}>
              <Text style={styles.text}>No hay fechas cargadas en la planificación.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#21164c' },//color de fondo de la pantalla
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10, // Ajusta el padding (separación) superior e inferior
    paddingTop: 45, // Ajusta el padding (separación) superior  
    backgroundColor: '#7a1367',//color de fondo del header
    borderBottomWidth: 1,
    borderBottomColor: '#dcdde1',
    elevation: 4,
  },
  appTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },//color y tamaño de "Calendario de Responsables"
  backButton: { paddingVertical: 4, paddingHorizontal: 12, backgroundColor: '#570e49', borderRadius: 6, borderWidth: 1, borderColor: '#7a1367' },
  backButtonText: { fontSize: 16, color: '#2f3640', fontWeight: '600' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { fontSize: 16, color: '#718093', textAlign: 'center' },
  calendarCard: {
    backgroundColor: '#82a4ed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },


  cardDate: { fontSize: 16, fontWeight: 'bold', color: '#0e0e0f', marginBottom: 6 },//color de la fecha
  cardDirector: { fontSize: 16, color: '#e9ecf1' },//color de "Director"
  boldText: { fontWeight: 'bold', color: '#1228b7' },
  divider: { height: 1, backgroundColor: '#f1f2f6', marginVertical: 8 },
});
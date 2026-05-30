import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import Parse from '../services/parseConfig';

const RISCO_COR = {
  Alto: '#e53935',
  Médio: '#FDD835',
  Baixo: '#43A047',
};

const REGIAO_INICIAL = {
  latitude: -8.0476,
  longitude: -34.877,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapaScreen({ navigation }) {
  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const buscarOcorrencias = async () => {
    try {
      setCarregando(true);
      const query = new Parse.Query('Ocorrencia');
      query.descending('createdAt');
      const resultados = await query.find();
      setOcorrencias(resultados);
    } catch (erro) {
      console.error('Erro ao buscar ocorrências:', erro);
    } finally {
      setCarregando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      buscarOcorrencias();
    }, [])
  );

  return (
    <View style={styles.container}>
      {carregando ? (
        <ActivityIndicator size="large" color="#2196F3" style={styles.loading} />
      ) : (
        <MapView style={styles.mapa} initialRegion={REGIAO_INICIAL}>
          {ocorrencias.map((item) => {
            const lat = item.get('latitude');
            const lng = item.get('longitude');
            if (!lat || !lng) return null;

            const risco = item.get('risco');

            return (
              <Marker
                key={item.id}
                coordinate={{ latitude: lat, longitude: lng }}
                pinColor={RISCO_COR[risco] || '#2196F3'}
              >
                <Callout
                  onPress={() =>
                    navigation.navigate('Detalhe', { ocorrenciaId: item.id })
                  }
                >
                  <View style={styles.callout}>
                    <Text style={styles.calloutTipo}>{item.get('tipo')}</Text>
                    <Text style={styles.calloutRisco}>
                      Risco:{' '}
                      <Text style={{ color: RISCO_COR[risco] }}>{risco}</Text>
                    </Text>
                    <Text style={styles.calloutStatus}>
                      {item.get('status')}
                    </Text>
                    <Text style={styles.calloutLink}>Ver detalhes →</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('Registrar')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabTexto}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapa: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callout: {
    padding: 10,
    minWidth: 160,
    maxWidth: 220,
  },
  calloutTipo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutRisco: {
    fontSize: 14,
    marginBottom: 2,
  },
  calloutStatus: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  calloutLink: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    backgroundColor: '#2196F3',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabTexto: {
    color: '#fff',
    fontSize: 34,
    lineHeight: 38,
    includeFontPadding: false,
  },
});

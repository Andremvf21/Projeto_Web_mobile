import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function GestorScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>🗺️ Gestor de Ocorrências</Text>
      <TouchableOpacity
        style={styles.botao}
        onPress={() => navigation.navigate('Registrar')}
      >
        <Text style={styles.botaoTexto}>+ Registrar Problema</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 22, marginBottom: 24 },
  botao: { backgroundColor: '#2196F3', padding: 16, borderRadius: 8 },
  botaoTexto: { color: '#fff', fontSize: 16 },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Parse from '../services/parseConfig';

const TIPOS = ['Buraco', 'Bueiro', 'Afundamento', 'Calçada', 'Iluminação'];
const RISCOS = ['Alto', 'Médio', 'Baixo'];

const RISCO_COR = {
  Alto: '#e53935',
  Médio: '#F9A825',
  Baixo: '#43A047',
};

export default function RegistrarScreen({ navigation }) {
  const [tipo, setTipo] = useState(null);
  const [risco, setRisco] = useState(null);
  const [descricao, setDescricao] = useState('');
  const [fotoURI, setFotoURI] = useState(null);
  const [localizacao, setLocalizacao] = useState(null);
  const [enderecoTexto, setEnderecoTexto] = useState('Buscando localização...');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    obterLocalizacao();
  }, []);

  const obterLocalizacao = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Precisamos da localização para registrar o problema.');
        setEnderecoTexto('Localização não disponível');
        return;
      }

      const coords = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocalizacao(coords.coords);

      const [endereco] = await Location.reverseGeocodeAsync({
        latitude: coords.coords.latitude,
        longitude: coords.coords.longitude,
      });

      if (endereco) {
        const partes = [endereco.street, endereco.district, endereco.city].filter(Boolean);
        setEnderecoTexto(partes.join(', '));
      } else {
        setEnderecoTexto(`${coords.coords.latitude.toFixed(5)}, ${coords.coords.longitude.toFixed(5)}`);
      }
    } catch (erro) {
      console.error('Erro ao obter localização:', erro);
      setEnderecoTexto('Erro ao obter localização');
    }
  };

  const escolherFoto = () => {
    Alert.alert('Foto', 'Escolha a origem da foto', [
      { text: 'Câmera', onPress: abrirCamera },
      { text: 'Galeria', onPress: abrirGaleria },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const abrirCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da câmera para tirar fotos.');
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!resultado.canceled) {
      setFotoURI(resultado.assets[0].uri);
    }
  };

  const abrirGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos acessar sua galeria.');
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!resultado.canceled) {
      setFotoURI(resultado.assets[0].uri);
    }
  };

  const validar = () => {
    if (!tipo) { Alert.alert('Atenção', 'Selecione o tipo do problema.'); return false; }
    if (!risco) { Alert.alert('Atenção', 'Selecione o nível de risco.'); return false; }
    if (!localizacao) { Alert.alert('Atenção', 'Aguarde a localização ser obtida.'); return false; }
    return true;
  };

  const registrar = async () => {
    if (!validar()) return;

    setSalvando(true);
    try {
      const Ocorrencia = Parse.Object.extend('Ocorrencia');
      const ocorrencia = new Ocorrencia();

      ocorrencia.set('tipo', tipo);
      ocorrencia.set('risco', risco);
      ocorrencia.set('descricao', descricao.trim());
      ocorrencia.set('latitude', localizacao.latitude);
      ocorrencia.set('longitude', localizacao.longitude);
      ocorrencia.set('fotoURL', fotoURI || '');
      ocorrencia.set('status', 'Registrado');
      ocorrencia.set('confirmacoes', 0);
      ocorrencia.set('dataCriacao', new Date());

      await ocorrencia.save();

      Alert.alert('Sucesso!', 'Ocorrência registrada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (erro) {
      console.error('Erro ao salvar:', erro);
      Alert.alert('Erro', 'Não foi possível salvar a ocorrência. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>

      {/* Localização */}
      <View style={styles.secao}>
        <Text style={styles.label}>📍 Localização detectada</Text>
        <View style={styles.enderecoBox}>
          <Text style={styles.enderecoTexto}>{enderecoTexto}</Text>
          <TouchableOpacity onPress={obterLocalizacao} style={styles.botaoAtualizar}>
            <Text style={styles.botaoAtualizarTexto}>Atualizar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tipo do problema */}
      <View style={styles.secao}>
        <Text style={styles.label}>Tipo do problema</Text>
        <View style={styles.opcoes}>
          {TIPOS.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, tipo === t && styles.chipSelecionado]}
              onPress={() => setTipo(t)}
            >
              <Text style={[styles.chipTexto, tipo === t && styles.chipTextoSelecionado]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Nível de risco */}
      <View style={styles.secao}>
        <Text style={styles.label}>Nível de risco</Text>
        <View style={styles.opcoes}>
          {RISCOS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.chipRisco,
                risco === r && { backgroundColor: RISCO_COR[r], borderColor: RISCO_COR[r] },
              ]}
              onPress={() => setRisco(r)}
            >
              <Text style={[styles.chipTexto, risco === r && styles.chipTextoSelecionado]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Foto */}
      <View style={styles.secao}>
        <Text style={styles.label}>Foto</Text>
        {fotoURI ? (
          <TouchableOpacity onPress={escolherFoto}>
            <Image source={{ uri: fotoURI }} style={styles.preview} />
            <Text style={styles.trocarFoto}>Toque para trocar a foto</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.botaoFoto} onPress={escolherFoto}>
            <Text style={styles.botaoFotoIcone}>📷</Text>
            <Text style={styles.botaoFotoTexto}>Adicionar foto</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Descrição */}
      <View style={styles.secao}>
        <Text style={styles.label}>Descrição (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Descreva brevemente o problema..."
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={3}
          maxLength={200}
        />
        <Text style={styles.contador}>{descricao.length}/200</Text>
      </View>

      {/* Botão registrar */}
      <TouchableOpacity
        style={[styles.botaoRegistrar, salvando && styles.botaoDesabilitado]}
        onPress={registrar}
        disabled={salvando}
      >
        {salvando ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.botaoRegistrarTexto}>Registrar Ocorrência</Text>
        )}
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conteudo: {
    padding: 16,
    paddingBottom: 40,
  },
  secao: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  enderecoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  enderecoTexto: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  botaoAtualizar: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
  },
  botaoAtualizarTexto: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#bbb',
    backgroundColor: '#fff',
  },
  chipSelecionado: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  chipRisco: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#bbb',
    backgroundColor: '#fff',
  },
  chipTexto: {
    fontSize: 14,
    color: '#444',
  },
  chipTextoSelecionado: {
    color: '#fff',
    fontWeight: '600',
  },
  botaoFoto: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 10,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botaoFotoIcone: {
    fontSize: 32,
    marginBottom: 6,
  },
  botaoFotoTexto: {
    fontSize: 14,
    color: '#888',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  trocarFoto: {
    textAlign: 'center',
    fontSize: 12,
    color: '#2196F3',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    color: '#333',
  },
  contador: {
    textAlign: 'right',
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
  },
  botaoRegistrar: {
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  botaoDesabilitado: {
    backgroundColor: '#90CAF9',
  },
  botaoRegistrarTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

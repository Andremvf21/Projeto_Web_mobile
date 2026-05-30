import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Parse from '../services/parseConfig';

const RISCO_COR = {
  Alto: '#e53935',
  Médio: '#F9A825',
  Baixo: '#43A047',
};

const STATUS_COR = {
  Registrado: '#2196F3',
  'Em análise': '#FB8C00',
  Resolvido: '#43A047',
};

const STATUS_ICONE = {
  Registrado: '📋',
  'Em análise': '🔍',
  Resolvido: '✅',
};

export default function DetalheScreen({ route }) {
  const { ocorrenciaId } = route.params;

  const [ocorrencia, setOcorrencia] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    buscarOcorrencia();
  }, []);

  const buscarOcorrencia = async () => {
    try {
      setCarregando(true);
      const query = new Parse.Query('Ocorrencia');
      const resultado = await query.get(ocorrenciaId);
      setOcorrencia(resultado);
    } catch (erro) {
      console.error('Erro ao buscar ocorrência:', erro);
      Alert.alert('Erro', 'Não foi possível carregar os detalhes.');
    } finally {
      setCarregando(false);
    }
  };

  const confirmarProblema = async () => {
    if (confirmando) return;
    setConfirmando(true);
    try {
      ocorrencia.increment('confirmacoes');
      await ocorrencia.save();
      setOcorrencia(ocorrencia.clone ? ocorrencia : ocorrencia);
      // força re-render atualizando o objeto
      const atualizado = await new Parse.Query('Ocorrencia').get(ocorrenciaId);
      setOcorrencia(atualizado);
      Alert.alert('Obrigado!', 'Sua confirmação foi registrada.');
    } catch (erro) {
      console.error('Erro ao confirmar:', erro);
      Alert.alert('Erro', 'Não foi possível confirmar. Tente novamente.');
    } finally {
      setConfirmando(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return '—';
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (carregando) {
    return (
      <View style={styles.centralize}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.carregandoTexto}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!ocorrencia) {
    return (
      <View style={styles.centralize}>
        <Text style={styles.erroTexto}>Ocorrência não encontrada.</Text>
      </View>
    );
  }

  const risco = ocorrencia.get('risco');
  const status = ocorrencia.get('status');
  const fotoURL = ocorrencia.get('fotoURL');
  const confirmacoes = ocorrencia.get('confirmacoes') || 0;
  const lat = ocorrencia.get('latitude');
  const lng = ocorrencia.get('longitude');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>

      {/* Foto */}
      {fotoURL ? (
        <Image source={{ uri: fotoURL }} style={styles.foto} resizeMode="cover" />
      ) : (
        <View style={styles.semFoto}>
          <Text style={styles.semFotoIcone}>📷</Text>
          <Text style={styles.semFotoTexto}>Sem foto registrada</Text>
        </View>
      )}

      {/* Badges: risco e status */}
      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: RISCO_COR[risco] }]}>
          <Text style={styles.badgeTexto}>⚠️ Risco {risco}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: STATUS_COR[status] }]}>
          <Text style={styles.badgeTexto}>
            {STATUS_ICONE[status]} {status}
          </Text>
        </View>
      </View>

      {/* Informações principais */}
      <View style={styles.card}>
        <InfoLinha icone="🔧" label="Tipo" valor={ocorrencia.get('tipo')} />
        <Separador />
        <InfoLinha
          icone="📍"
          label="Localização"
          valor={`${lat?.toFixed(5) ?? '—'}, ${lng?.toFixed(5) ?? '—'}`}
        />
        <Separador />
        <InfoLinha
          icone="📅"
          label="Registrado em"
          valor={formatarData(ocorrencia.get('dataCriacao') || ocorrencia.createdAt)}
        />
      </View>

      {/* Descrição */}
      {!!ocorrencia.get('descricao') && (
        <View style={styles.card}>
          <Text style={styles.descricaoLabel}>📝 Descrição</Text>
          <Text style={styles.descricaoTexto}>{ocorrencia.get('descricao')}</Text>
        </View>
      )}

      {/* Confirmações */}
      <View style={styles.confirmacaoCard}>
        <View style={styles.confirmacaoInfo}>
          <Text style={styles.confirmacaoNumero}>{confirmacoes}</Text>
          <Text style={styles.confirmacaoLabel}>
            {confirmacoes === 1 ? 'cidadão confirmou' : 'cidadãos confirmaram'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.botaoConfirmar, confirmando && styles.botaoDesabilitado]}
          onPress={confirmarProblema}
          disabled={confirmando}
        >
          {confirmando ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.botaoConfirmarTexto}>👍 Confirmo este problema</Text>
          )}
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

function InfoLinha({ icone, label, valor }) {
  return (
    <View style={styles.infoLinha}>
      <Text style={styles.infoIcone}>{icone}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValor}>{valor ?? '—'}</Text>
      </View>
    </View>
  );
}

function Separador() {
  return <View style={styles.separador} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conteudo: {
    paddingBottom: 40,
  },
  centralize: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  carregandoTexto: {
    color: '#888',
    fontSize: 14,
  },
  erroTexto: {
    color: '#e53935',
    fontSize: 16,
  },

  // Foto
  foto: {
    width: '100%',
    height: 240,
  },
  semFoto: {
    width: '100%',
    height: 160,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  semFotoIcone: {
    fontSize: 40,
    marginBottom: 8,
  },
  semFotoTexto: {
    fontSize: 14,
    color: '#888',
  },

  // Badges
  badges: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 0,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // Card info
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  infoLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  infoIcone: {
    fontSize: 20,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValor: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
    marginTop: 1,
  },
  separador: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 10,
  },

  // Descrição
  descricaoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
  },
  descricaoTexto: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },

  // Confirmações
  confirmacaoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  confirmacaoInfo: {
    alignItems: 'center',
    marginBottom: 14,
  },
  confirmacaoNumero: {
    fontSize: 40,
    fontWeight: '800',
    color: '#2196F3',
    lineHeight: 46,
  },
  confirmacaoLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  botaoConfirmar: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    elevation: 2,
  },
  botaoDesabilitado: {
    backgroundColor: '#90CAF9',
  },
  botaoConfirmarTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

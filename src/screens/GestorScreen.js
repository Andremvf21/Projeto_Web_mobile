import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Parse from '../services/parseConfig';

const SENHA_GESTOR = 'admin123';

const STATUS_OPCOES = ['Registrado', 'Em análise', 'Resolvido'];

const STATUS_COR = {
  Registrado: '#2196F3',
  'Em análise': '#FB8C00',
  Resolvido: '#43A047',
};

const RISCO_COR = {
  Alto: '#e53935',
  Médio: '#F9A825',
  Baixo: '#43A047',
};

export default function GestorScreen() {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erroSenha, setErroSenha] = useState(false);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregando, setCarregando] = useState(false);

  const [modalVisivel, setModalVisivel] = useState(false);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);

  useFocusEffect(
    useCallback(() => {
      if (autenticado) buscarOcorrencias();
    }, [autenticado])
  );

  const entrar = () => {
    if (senhaDigitada === SENHA_GESTOR) {
      setAutenticado(true);
      setErroSenha(false);
      buscarOcorrencias();
    } else {
      setErroSenha(true);
    }
  };

  const buscarOcorrencias = async () => {
    try {
      setCarregando(true);
      const query = new Parse.Query('Ocorrencia');
      query.descending('createdAt');
      const resultados = await query.find();
      setOcorrencias(resultados);
    } catch (erro) {
      console.error('Erro ao buscar:', erro);
      Alert.alert('Erro', 'Não foi possível carregar as ocorrências.');
    } finally {
      setCarregando(false);
    }
  };

  const abrirModalStatus = (ocorrencia) => {
    setOcorrenciaSelecionada(ocorrencia);
    setModalVisivel(true);
  };

  const alterarStatus = async (novoStatus) => {
    if (!ocorrenciaSelecionada) return;
    setModalVisivel(false);
    try {
      ocorrenciaSelecionada.set('status', novoStatus);
      await ocorrenciaSelecionada.save();
      await buscarOcorrencias();
    } catch (erro) {
      console.error('Erro ao alterar status:', erro);
      Alert.alert('Erro', 'Não foi possível alterar o status.');
    }
  };

  const excluirOcorrencia = (ocorrencia) => {
    Alert.alert(
      'Excluir registro',
      `Deseja excluir a ocorrência "${ocorrencia.get('tipo')}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await ocorrencia.destroy();
              await buscarOcorrencias();
            } catch (erro) {
              console.error('Erro ao excluir:', erro);
              Alert.alert('Erro', 'Não foi possível excluir o registro.');
            }
          },
        },
      ]
    );
  };

  const formatarData = (data) => {
    if (!data) return '—';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // --- Tela de login ---
  if (!autenticado) {
    return (
      <View style={styles.loginContainer}>
        <Text style={styles.loginIcone}>🔧</Text>
        <Text style={styles.loginTitulo}>Painel do Gestor</Text>
        <Text style={styles.loginSubtitulo}>Acesso restrito</Text>

        <TextInput
          style={[styles.loginInput, erroSenha && styles.loginInputErro]}
          placeholder="Digite a senha"
          value={senhaDigitada}
          onChangeText={(t) => { setSenhaDigitada(t); setErroSenha(false); }}
          secureTextEntry
          onSubmitEditing={entrar}
          returnKeyType="done"
        />
        {erroSenha && <Text style={styles.erroTexto}>Senha incorreta. Tente novamente.</Text>}

        <TouchableOpacity style={styles.loginBotao} onPress={entrar}>
          <Text style={styles.loginBotaoTexto}>Entrar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Painel do gestor ---
  return (
    <View style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.cabecalhoTitulo}>Painel do Gestor</Text>
          <Text style={styles.cabecalhoSub}>
            {ocorrencias.length} ocorrência{ocorrencias.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.botaoAtualizar} onPress={buscarOcorrencias}>
          <Text style={styles.botaoAtualizarTexto}>↻ Atualizar</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ocorrencias}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Text style={styles.vazioTexto}>Nenhuma ocorrência registrada.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Linha superior: tipo + risco */}
              <View style={styles.cardTopo}>
                <Text style={styles.cardTipo}>{item.get('tipo')}</Text>
                <View style={[styles.badgeRisco, { backgroundColor: RISCO_COR[item.get('risco')] }]}>
                  <Text style={styles.badgeTexto}>{item.get('risco')}</Text>
                </View>
              </View>

              {/* Data e confirmações */}
              <Text style={styles.cardMeta}>
                📅 {formatarData(item.get('dataCriacao') || item.createdAt)}
                {'   '}👍 {item.get('confirmacoes') || 0} confirmação{(item.get('confirmacoes') || 0) !== 1 ? 'ões' : ''}
              </Text>

              {/* Descrição */}
              {!!item.get('descricao') && (
                <Text style={styles.cardDescricao} numberOfLines={2}>
                  {item.get('descricao')}
                </Text>
              )}

              {/* Status + ações */}
              <View style={styles.cardRodape}>
                <TouchableOpacity
                  style={[styles.badgeStatus, { backgroundColor: STATUS_COR[item.get('status')] }]}
                  onPress={() => abrirModalStatus(item)}
                >
                  <Text style={styles.badgeTexto}>{item.get('status')} ▾</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoExcluir}
                  onPress={() => excluirOcorrencia(item)}
                >
                  <Text style={styles.botaoExcluirTexto}>🗑️ Excluir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal de alteração de status */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalFundo}
          activeOpacity={1}
          onPress={() => setModalVisivel(false)}
        >
          <View style={styles.modalConteudo}>
            <Text style={styles.modalTitulo}>Alterar status</Text>
            <Text style={styles.modalSub}>
              {ocorrenciaSelecionada?.get('tipo')}
            </Text>

            {STATUS_OPCOES.map((s) => {
              const atual = ocorrenciaSelecionada?.get('status') === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.modalOpcao, atual && styles.modalOpcaoAtual]}
                  onPress={() => alterarStatus(s)}
                >
                  <View style={[styles.modalDot, { backgroundColor: STATUS_COR[s] }]} />
                  <Text style={[styles.modalOpcaoTexto, atual && styles.modalOpcaoTextoAtual]}>
                    {s}
                  </Text>
                  {atual && <Text style={styles.modalAtualLabel}>atual</Text>}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={styles.modalCancelar} onPress={() => setModalVisivel(false)}>
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  // Login
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  loginIcone: {
    fontSize: 52,
    marginBottom: 12,
  },
  loginTitulo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#222',
  },
  loginSubtitulo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  loginInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 8,
  },
  loginInputErro: {
    borderColor: '#e53935',
  },
  erroTexto: {
    color: '#e53935',
    fontSize: 13,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  loginBotao: {
    width: '100%',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
    elevation: 2,
  },
  loginBotaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Painel
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cabecalhoTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
  },
  cabecalhoSub: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  botaoAtualizar: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  botaoAtualizarTexto: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 14,
  },
  lista: {
    padding: 16,
  },
  vazio: {
    alignItems: 'center',
    marginTop: 60,
  },
  vazioTexto: {
    fontSize: 15,
    color: '#aaa',
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardTopo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTipo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  cardMeta: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
  },
  cardDescricao: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
    lineHeight: 20,
  },
  cardRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  badgeRisco: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  botaoExcluir: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
    backgroundColor: '#fff8f8',
  },
  botaoExcluirTexto: {
    color: '#e53935',
    fontSize: 13,
    fontWeight: '600',
  },

  // Modal
  modalFundo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalConteudo: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  modalOpcao: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  modalOpcaoAtual: {
    backgroundColor: '#e3f2fd',
  },
  modalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalOpcaoTexto: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalOpcaoTextoAtual: {
    fontWeight: '700',
    color: '#2196F3',
  },
  modalAtualLabel: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '600',
  },
  modalCancelar: {
    marginTop: 8,
    alignItems: 'center',
    padding: 14,
  },
  modalCancelarTexto: {
    fontSize: 15,
    color: '#888',
  },
});

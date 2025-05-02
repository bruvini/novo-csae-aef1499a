
import { collection, getDocs, query, where, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ModuloDisponivel } from '@/types/modulos';

export interface ModuloDashboard extends ModuloDisponivel {
  dataCadastro: any;
  dataAtualizacao: any;
}

export async function buscarModulosAtivos(uid?: string): Promise<ModuloDisponivel[]> {
  try {
    // This is a mock implementation for testing
    const mockModulos: ModuloDisponivel[] = [
      {
        id: '1',
        titulo: 'Processo de Enfermagem',
        descricao: 'Registrar e acompanhar processos de enfermagem',
        nome: 'Processo',
        link: '/processo-enfermagem',
        icone: 'Clipboard',
        ativo: true,
        visibilidade: 'todos',
        ordem: 1,
        categoria: 'clinico',
        exibirNavbar: true,
        exibirDashboard: true,
        linkAcesso: '/processo-enfermagem'
      },
      {
        id: '2',
        titulo: 'POPs',
        descricao: 'Procedimentos Operacionais Padrão',
        nome: 'POPs',
        link: '/pops',
        icone: 'FileType',
        ativo: true,
        visibilidade: 'todos',
        ordem: 2,
        categoria: 'clinico',
        exibirNavbar: true,
        exibirDashboard: true,
        linkAcesso: '/pops'
      },
      {
        id: '3',
        titulo: 'Protocolos',
        descricao: 'Protocolos de Enfermagem',
        nome: 'Protocolos',
        link: '/protocolos',
        icone: 'FileText',
        ativo: true,
        visibilidade: 'todos',
        ordem: 3,
        categoria: 'clinico',
        exibirNavbar: true,
        exibirDashboard: true,
        linkAcesso: '/protocolos'
      }
    ];

    return mockModulos;
  } catch (error) {
    console.error("Erro ao buscar módulos ativos:", error);
    return [];
  }
}

export async function verificarModuloAtivo(
  moduloNome: string, 
  ehAdmin: boolean, 
  atuaSMS: boolean
): Promise<boolean> {
  try {
    // In a real application, this would check if the module is active
    // For now, it's a mock implementation that always returns true
    return true;
  } catch (error) {
    console.error("Erro ao verificar se módulo está ativo:", error);
    return false;
  }
}

export async function criarModulo(modulo: ModuloDisponivel): Promise<string> {
  // Mock implementation
  console.log("Creating module:", modulo);
  return "mock-id-" + Date.now();
}

export async function atualizarModulo(id: string, modulo: Partial<ModuloDisponivel>): Promise<boolean> {
  // Mock implementation
  console.log("Updating module:", id, modulo);
  return true;
}

export async function excluirModulo(id: string): Promise<boolean> {
  // Mock implementation
  console.log("Deleting module:", id);
  return true;
}

export async function buscarTodosModulos(): Promise<ModuloDisponivel[]> {
  // Mock implementation
  return buscarModulosAtivos();
}

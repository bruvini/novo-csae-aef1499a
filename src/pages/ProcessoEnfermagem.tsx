
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, ExternalLink, AlertCircle, Users, FileText, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';

const ProcessoEnfermagem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  const handleLogout = () => {
    console.log('Logout functionality to be implemented');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <Header 
            userName="Enf. Maria Silva"
            onLogout={handleLogout}
          />
          
          <main className="flex-1 bg-gray-50">
            {/* Seção Explicativa */}
            <section className="bg-white border-b border-gray-200 py-8">
              <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-csae-green-800 mb-4">
                    Processo de Enfermagem
                  </h1>
                  <p className="text-lg text-gray-600">
                    Ferramenta digital para sistematização da assistência de enfermagem
                  </p>
                </div>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-csae-green-800">
                      <FileText className="w-5 h-5" />
                      <span>O que é o Processo de Enfermagem?</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-700 leading-relaxed">
                      Conforme a <strong>Resolução COFEN nº 736/2024</strong>, o Processo de Enfermagem (PE) 
                      deve ser realizado de forma deliberada e sistemática em todo contexto onde ocorre o cuidado. 
                      Ele precisa estar fundamentado em suporte teórico, como teorias e modelos de cuidado, 
                      linguagens padronizadas, instrumentos de predição de risco e protocolos baseados em evidências.
                    </p>
                    
                    <div className="bg-csae-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-csae-green-800 mb-3">
                        As cinco etapas inter-relacionadas e cíclicas:
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start space-x-2">
                          <span className="bg-csae-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                          <span><strong>Avaliação:</strong> Coleta de dados subjetivos e objetivos</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="bg-csae-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                          <span><strong>Diagnóstico de Enfermagem:</strong> Identificação de problemas e vulnerabilidades</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="bg-csae-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                          <span><strong>Planejamento:</strong> Elaboração do plano assistencial com priorização</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="bg-csae-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                          <span><strong>Implementação:</strong> Execução das intervenções e atividades</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="bg-csae-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">5</span>
                          <span><strong>Evolução:</strong> Avaliação dos resultados e revisão de todo o processo</span>
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center justify-center pt-4">
                      <a
                        href="https://www.cofen.gov.br/resolucao-cofen-no-736-de-17-de-janeiro-de-2024"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-csae-green-700 hover:text-csae-green-800 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span className="text-sm font-medium">Consultar Resolução COFEN nº 736/2024</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Dashboard e Área Funcional */}
            <section className="py-8">
              <div className="container mx-auto px-4">
                {/* Dashboard */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-csae-green-800 mb-6">Dashboard</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-r from-csae-green-50 to-csae-green-100 border-csae-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-csae-green-600">Total de Pacientes</p>
                            <p className="text-2xl font-bold text-csae-green-800">-</p>
                          </div>
                          <Users className="w-8 h-8 text-csae-green-600" />
                        </div>
                        <div className="mt-4 flex items-center text-xs text-csae-green-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Em desenvolvimento
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Processos Ativos</p>
                            <p className="text-2xl font-bold text-blue-800">-</p>
                          </div>
                          <Clock className="w-8 h-8 text-blue-600" />
                        </div>
                        <div className="mt-4 flex items-center text-xs text-blue-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Em desenvolvimento
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">Concluídos Hoje</p>
                            <p className="text-2xl font-bold text-purple-800">-</p>
                          </div>
                          <FileText className="w-8 h-8 text-purple-600" />
                        </div>
                        <div className="mt-4 flex items-center text-xs text-purple-600">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Em desenvolvimento
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Área de Ações */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-bold text-csae-green-800">Gerenciar Pacientes</h2>
                    <Button className="csae-btn-primary" disabled>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Paciente
                    </Button>
                  </div>

                  {/* Filtros e Busca */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          type="text"
                          placeholder="Buscar paciente pelo nome..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="sm:w-48">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrar por status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todos">Todos os Status</SelectItem>
                          <SelectItem value="nao-iniciado">Não Iniciado</SelectItem>
                          <SelectItem value="em-andamento">Em Andamento</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Lista de Pacientes */}
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700 mb-2">
                        Nenhum paciente cadastrado ainda
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Comece adicionando seu primeiro paciente para iniciar o Processo de Enfermagem.
                      </p>
                      <Button className="csae-btn-primary" disabled>
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Primeiro Paciente
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
          
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProcessoEnfermagem;


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, AlertCircle, Users, FileText, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProcessoEnfermagemExplicacao from '@/components/ProcessoEnfermagemExplicacao';
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
            <ProcessoEnfermagemExplicacao />

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

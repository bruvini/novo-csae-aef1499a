
import React, { useState } from 'react';
import Header from '@/components/Header';
import NavigationMenu from '@/components/NavigationMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import CadastrarPacienteModal from '@/components/processo-enfermagem/CadastrarPacienteModal';
import ListaPacientes from '@/components/processo-enfermagem/ListaPacientes';

const ProcessoEnfermagem = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Header />
        <NavigationMenu activeItem="processo-enfermagem" />
        
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="flex flex-col gap-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-csae-green-700">O que é o Processo de Enfermagem?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-csae-green-700">Gerenciar Pacientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Buscar paciente por nome..."
                      className="pl-10"
                    />
                  </div>
                  <Button 
                    className="w-full sm:w-auto bg-csae-green-600 hover:bg-csae-green-700"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Paciente
                  </Button>
                </div>
              </CardContent>
            </Card>
            <ListaPacientes />
          </div>
        </main>
      </div>
      <CadastrarPacienteModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
};

export default ProcessoEnfermagem;

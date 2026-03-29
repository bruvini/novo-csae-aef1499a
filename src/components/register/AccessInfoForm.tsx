import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RegistrationSchema } from '@/lib/validators/registrationSchema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';

interface AccessInfoFormProps {
  form: UseFormReturn<RegistrationSchema>;
  isLoading: boolean;
}

const AccessInfoForm: React.FC<AccessInfoFormProps> = ({ form, isLoading }) => {
  return (
    <Card className="border-none shadow-none bg-transparent pt-6 border-t border-gray-100 rounded-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-csae-green-600" />
          <CardTitle className="text-xl font-bold text-gray-800">Dados de Acesso</CardTitle>
        </div>
        <CardDescription>
          Estes serão seus dados oficiais de login. Utilize um e-mail institucional ou um e-mail pessoal que você acesse com frequência.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    E-mail
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500 transition-all font-medium" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="senha"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                  Nova Senha
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 6 caracteres" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500 transition-all font-medium" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmarSenha"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700 font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                  Confirmar Senha
                </FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Repita a senha digitada" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500 transition-all font-medium" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-6">
          <div className="flex gap-3 text-blue-900 text-sm">
            <Info className="h-5 w-5 shrink-0 text-blue-500" />
            <div className="space-y-1">
              <p className="font-bold">Próxima Etapa: Termo de Responsabilidade</p>
              <p className="text-blue-700/80 leading-relaxed">
                Ao clicar em "Criar Conta", um documento jurídico será gerado com seus dados. Você precisará aceitá-lo para concluir o cadastro.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Adição de ícone Info que faltou no import inicial da subagent
import { Info } from 'lucide-react';

export default AccessInfoForm;

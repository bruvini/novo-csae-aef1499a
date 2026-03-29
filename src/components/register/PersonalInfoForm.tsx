import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RegistrationSchema } from '@/lib/validators/registrationSchema';
import { estadosBrasileiros } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, MapPin } from 'lucide-react';

interface PersonalInfoFormProps {
  form: UseFormReturn<RegistrationSchema>;
  isLoading: boolean;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ form, isLoading }) => {
  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2 mb-1">
          <User className="h-5 w-5 text-csae-green-600" />
          <CardTitle className="text-xl font-bold text-gray-800">Dados Pessoais</CardTitle>
        </div>
        <CardDescription>
          Insira suas informações básicas. Estes dados são fundamentais para a identificação única do profissional e validade jurídica do termo.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-700 font-semibold">Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Como consta no seu documento oficial" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-gray-700 font-semibold">RG</FormLabel>
                  <span className="text-[10px] text-gray-400 font-medium">Apenas números</span>
                </div>
                <FormControl>
                  <Input placeholder="0.000.000" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-gray-700 font-semibold">CPF</FormLabel>
                  <span className="text-[10px] text-gray-400 font-medium">Apenas números</span>
                </div>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} maxLength={11} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-csae-green-500" />
            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Endereço Residencial</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-4">
              <FormField
                control={form.control}
                name="rua"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Rua/Logradouro</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Rua das Flores" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Número</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 123" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu bairro" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Cidade</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Florianópolis" {...field} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Estado (UF)</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 bg-white text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-500 transition-all font-medium" disabled={isLoading}>
                        <option value="">Selecione</option>
                        {estadosBrasileiros.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-gray-700 font-semibold">CEP</FormLabel>
                      <span className="text-[10px] text-gray-400 font-medium">Apenas números</span>
                    </div>
                    <FormControl>
                      <Input placeholder="00000-000" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} maxLength={8} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;

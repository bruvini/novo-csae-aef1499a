
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RegistrationSchema } from '@/lib/validators/registrationSchema';
import { estadosBrasileiros } from '@/lib/constants';

interface PersonalInfoFormProps {
  form: UseFormReturn<RegistrationSchema>;
  isLoading: boolean;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ form, isLoading }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-csae-green-700 pb-2 border-b border-csae-green-200">
        Informações Pessoais
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FormField
            control={form.control}
            name="nomeCompleto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome completo" {...field} disabled={isLoading} />
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
              <FormLabel>RG (apenas números)</FormLabel>
              <FormControl>
                <Input placeholder="000000000" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} disabled={isLoading} />
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
              <FormLabel>CPF (apenas números)</FormLabel>
              <FormControl>
                <Input placeholder="00000000000" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} maxLength={11} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="md:col-span-2">
            <FormField
            control={form.control}
            name="rua"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Rua</FormLabel>
                <FormControl>
                    <Input placeholder="Nome da sua rua" {...field} disabled={isLoading} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="numero"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número</FormLabel>
              <FormControl>
                <Input placeholder="123" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="bairro"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bairro</FormLabel>
              <FormControl>
                <Input placeholder="Seu bairro" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="cidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade</FormLabel>
              <FormControl>
                <Input placeholder="Sua cidade" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="uf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>UF</FormLabel>
                <FormControl>
                  <select {...field} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={isLoading}>
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

        <FormField
          control={form.control}
          name="cep"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CEP (apenas números)</FormLabel>
              <FormControl>
                <Input placeholder="00000000" {...field} onChange={e => field.onChange(e.target.value.replace(/\D/g, ''))} maxLength={8} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;

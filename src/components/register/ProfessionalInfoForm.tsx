
import React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationSchema } from '@/lib/validators/registrationSchema';
import { estadosBrasileiros, lotacoesSMS, formacoes } from '@/lib/constants';

interface ProfessionalInfoFormProps {
  form: UseFormReturn<RegistrationSchema>;
  isLoading: boolean;
}

const ProfessionalInfoForm: React.FC<ProfessionalInfoFormProps> = ({ form, isLoading }) => {
  const formacao = useWatch({ control: form.control, name: 'formacao' });
  const atuaSMS = useWatch({ control: form.control, name: 'atuaSMS' });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-csae-green-700 pb-2 border-b border-csae-green-200">
        Informações Profissionais
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
            <FormField
            control={form.control}
            name="formacao"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Formação</FormLabel>
                <FormControl>
                    <select {...field} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={isLoading}>
                        <option value="">Selecione</option>
                        {formacoes.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        {(formacao === 'Enfermeiro' || formacao === 'Residente de Enfermagem' || formacao === 'Técnico de Enfermagem') && (
          <>
            <FormField
              control={form.control}
              name="numeroCoren"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do COREN</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ufCoren"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF do COREN</FormLabel>
                  <FormControl>
                    <select {...field} value={field.value ?? ''} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={isLoading}>
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
          </>
        )}

        {formacao === 'Residente de Enfermagem' && (
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="dataInicioResidencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início da Residência</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {formacao === 'Acadêmico de Enfermagem' && (
          <div className="md:col-span-2">
            <FormField
              control={form.control}
              name="iesEnfermagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instituição de Ensino Superior</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        <div className="md:col-span-2 flex items-center space-x-2 pt-2">
            <FormField
              control={form.control}
              name="atuaSMS"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isLoading}
                      id="atuaSMS"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <label
                        htmlFor="atuaSMS"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Atuo na Secretaria Municipal de Saúde de Florianópolis
                    </label>
                  </div>
                </FormItem>
              )}
            />
        </div>

        {atuaSMS ? (
          <>
            <FormField
              control={form.control}
              name="lotacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lotação</FormLabel>
                  <FormControl>
                    <select {...field} value={field.value ?? ''} className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={isLoading}>
                      <option value="">Selecione</option>
                      {lotacoesSMS.map((unidade) => (
                        <option key={unidade} value={unidade}>
                          {unidade}
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
              name="matricula"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Matrícula</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : formacao ? (
          <>
            <FormField
              control={form.control}
              name="cidadeTrabalho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade que Trabalha</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="localCargo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local/Cargo</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default ProfessionalInfoForm;

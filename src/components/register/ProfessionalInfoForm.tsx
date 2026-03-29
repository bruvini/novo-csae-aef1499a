import React from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RegistrationSchema } from '@/lib/validators/registrationSchema';
import { estadosBrasileiros, lotacoesSMS, formacoes } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Building2, Info } from 'lucide-react';

interface ProfessionalInfoFormProps {
  form: UseFormReturn<RegistrationSchema>;
  isLoading: boolean;
}

const ProfessionalInfoForm: React.FC<ProfessionalInfoFormProps> = ({ form, isLoading }) => {
  const formacao = useWatch({ control: form.control, name: 'formacao' });
  const atuaSMS = useWatch({ control: form.control, name: 'atuaSMS' });

  return (
    <Card className="border-none shadow-none bg-transparent pt-6 border-t border-gray-100 rounded-none">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2 mb-1">
          <Briefcase className="h-5 w-5 text-csae-green-600" />
          <CardTitle className="text-xl font-bold text-gray-800">Vida Profissional</CardTitle>
        </div>
        <CardDescription>
          Estes dados definem seu nível de permissão e autonomia clínica dentro dos módulos do portal.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
              <FormField
                control={form.control}
                name="formacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Formação / Perfil</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 bg-white text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-500 transition-all font-medium" disabled={isLoading}>
                        <option value="">Selecione sua formação</option>
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
                    <FormLabel className="text-gray-700 font-semibold">Número do COREN</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 123.456" {...field} value={field.value ?? ''} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
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
                    <FormLabel className="text-gray-700 font-semibold">UF do Registro</FormLabel>
                    <FormControl>
                      <select {...field} value={field.value ?? ''} className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 bg-white text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-500 transition-all font-medium" disabled={isLoading}>
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
                    <FormLabel className="text-gray-700 font-semibold">Início da Residência</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ''} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
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
                    <FormLabel className="text-gray-700 font-semibold">Instituição de Ensino (IES)</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da Faculdade/Universidade" {...field} value={field.value ?? ''} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          <div className="md:col-span-2 pt-2">
              <FormField
                control={form.control}
                name="atuaSMS"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 bg-csae-green-100/30 p-4 rounded-xl border border-csae-green-100 transition-colors hover:bg-csae-green-100/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                        id="atuaSMS"
                        className="h-5 w-5 border-csae-green-300 data-[state=checked]:bg-csae-green-600 data-[state=checked]:border-csae-green-600"
                      />
                    </FormControl>
                    <div className="space-y-1">
                      <label
                          htmlFor="atuaSMS"
                          className="text-sm font-bold text-csae-green-900 cursor-pointer"
                      >
                        Atuo na Secretaria Municipal de Saúde de Florianópolis
                      </label>
                      <p className="text-xs text-csae-green-700">O Portal CSAE é exclusivo para a rede municipal SMS Floripa.</p>
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
                    <FormLabel className="text-gray-700 font-semibold">Unidade de Lotação</FormLabel>
                    <FormControl>
                      <select {...field} value={field.value ?? ''} className="w-full h-11 px-3 py-2 rounded-md border border-gray-200 bg-white text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csae-green-500 transition-all font-medium" disabled={isLoading}>
                        <option value="">Selecione sua unidade</option>
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
                    <FormLabel className="text-gray-700 font-semibold">Número da Matrícula</FormLabel>
                    <FormControl>
                      <Input placeholder="Sua matrícula PMF" {...field} value={field.value ?? ''} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : formacao ? (
            <div className="md:col-span-2">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 text-amber-800 text-sm animate-pulse mb-2">
                <Info className="h-5 w-5 shrink-0" />
                <p><strong>Atenção:</strong> O acesso é liberado apenas para quem atua na SMS Florianópolis. Verifique sua declaração acima.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="cidadeTrabalho"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">Cidade que Trabalha</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: São José" {...field} value={field.value ?? ''} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
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
                      <FormLabel className="text-gray-700 font-semibold">Local / Cargo</FormLabel>
                      <FormControl>
                        <Input placeholder="Onde você atua hoje?" {...field} value={field.value ?? ''} disabled={isLoading} className="h-11 focus-visible:ring-csae-green-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalInfoForm;

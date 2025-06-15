
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Paciente, Evolucao, SinalVital } from '@/types';
import { useSinaisVitais } from '@/hooks/use-sinais-vitais';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle } from 'lucide-react';
import { differenceInYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SinaisVitaisFormProps {
  paciente: Paciente;
  dadosEvolucao: Partial<Evolucao>;
  onDadosChange: (novosDados: Partial<Evolucao>) => void;
  onAlterationsChange: (alterations: { id: string; titulo: string }[]) => void;
}

const SinaisVitaisForm: React.FC<SinaisVitaisFormProps> = ({ paciente, dadosEvolucao, onDadosChange, onAlterationsChange }) => {
    const { sinaisVitais, isLoading } = useSinaisVitais();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [alterations, setAlterations] = useState<Record<string, { titulo: string }>>({});

    const activeSinaisVitais = useMemo(() => {
        return sinaisVitais.filter(sv => sv.ativo).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }, [sinaisVitais]);

    useEffect(() => {
        const alterationsList = Object.entries(alterations)
            .filter(([, value]) => value && value.titulo)
            .map(([id, value]) => ({ id, titulo: value.titulo }));
        onAlterationsChange(alterationsList);
    }, [alterations, onAlterationsChange]);

    const calculateAge = (dataNascimento: string): number => {
        try {
            return differenceInYears(new Date(), new Date(dataNascimento));
        } catch (error) {
            console.error("Erro ao calcular idade:", error);
            return 0;
        }
    };
    
    const pacienteAge = useMemo(() => calculateAge(paciente.dataNascimento), [paciente.dataNascimento]);

    const validateAndCheckAlerts = useCallback((sinalVital: SinalVital, value: string) => {
        if (!value) {
            setErrors(prev => ({ ...prev, [sinalVital.id!]: '' }));
            setAlterations(prev => ({ ...prev, [sinalVital.id!]: { titulo: '' } }));
            return;
        }
        
        const numericValue = parseFloat(value.replace(',', '.'));

        if (isNaN(numericValue)) {
            setErrors(prev => ({ ...prev, [sinalVital.id!]: "Valor inválido." }));
            setAlterations(prev => ({ ...prev, [sinalVital.id!]: { titulo: '' } }));
            return;
        }

        let isWithinAnyRange = false;
        let foundAlert: string | null = null;

        if (sinalVital.valoresReferencia) {
            for (const ref of sinalVital.valoresReferencia) {
                let patientMatches = false;
                if (ref.variacaoPor === 'Nenhum') {
                    patientMatches = true;
                } else if (ref.variacaoPor === 'Idade' && ref.idadeMinima != null && ref.idadeMaxima != null) {
                    patientMatches = pacienteAge >= ref.idadeMinima && pacienteAge <= ref.idadeMaxima;
                } else if (ref.variacaoPor === 'Sexo' && ref.sexo) {
                    patientMatches = ref.sexo === 'Todos' || ref.sexo === paciente.sexo;
                } else if (ref.variacaoPor === 'Ambos' && ref.idadeMinima != null && ref.idadeMaxima != null && ref.sexo) {
                    const ageMatch = pacienteAge >= ref.idadeMinima && pacienteAge <= ref.idadeMaxima;
                    const sexMatch = ref.sexo === 'Todos' || ref.sexo === paciente.sexo;
                    patientMatches = ageMatch && sexMatch;
                }
                
                if (!patientMatches) continue;

                let isWithinThisRange = false;
                if (ref.condicao === 'entre' && ref.valorMinimo != null && ref.valorMaximo != null) {
                    if (numericValue >= ref.valorMinimo && numericValue <= ref.valorMaximo) {
                       isWithinThisRange = true;
                    }
                }
                
                if (isWithinThisRange) {
                    isWithinAnyRange = true;
                    if (ref.representaAlteracao && ref.tituloAlteracao) {
                        foundAlert = ref.tituloAlteracao;
                    }
                    break;
                }
            }
        }

        if (!isWithinAnyRange) {
            setErrors(prev => ({ ...prev, [sinalVital.id!]: "Valor fora do intervalo permitido." }));
            setAlterations(prev => ({ ...prev, [sinalVital.id!]: { titulo: '' } }));
        } else {
            setErrors(prev => ({ ...prev, [sinalVital.id!]: '' }));
            if (foundAlert) {
                setAlterations(prev => ({ ...prev, [sinalVital.id!]: { titulo: foundAlert } }));
            } else {
                setAlterations(prev => ({ ...prev, [sinalVital.id!]: { titulo: '' } }));
            }
        }
    }, [pacienteAge, paciente.sexo]);


    const handleInputChange = (sinalVital: SinalVital, value: string) => {
        const newSinaisVitaisData = {
            ...(dadosEvolucao.dadosAvaliacao?.sinaisVitais || {}),
            [sinalVital.id!]: value,
        };

        onDadosChange({
            dadosAvaliacao: {
                ...dadosEvolucao.dadosAvaliacao,
                sinaisVitais: newSinaisVitaisData,
            },
        });

        validateAndCheckAlerts(sinalVital, value);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="grid gap-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            {activeSinaisVitais.map(sv => {
                const svId = sv.id!;
                const currentValue = dadosEvolucao.dadosAvaliacao?.sinaisVitais?.[svId] || '';
                const alteration = alterations[svId]?.titulo;
                
                return (
                    <div key={svId} className="grid gap-2">
                        <Label htmlFor={svId}>{sv.nome} {sv.unidade && `(${sv.unidade})`}</Label>
                        <div className="relative">
                            <Input
                                id={svId}
                                type="text"
                                inputMode="decimal"
                                value={currentValue}
                                onChange={(e) => handleInputChange(sv, e.target.value)}
                                className={cn(
                                    errors[svId] ? 'border-destructive' : '',
                                    alteration ? 'border-red-500 pr-10' : ''
                                )}
                                placeholder="-"
                            />
                            {alteration && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer">
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{alteration}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {errors[svId] && <p className="text-sm text-destructive">{errors[svId]}</p>}
                    </div>
                );
            })}
        </div>
    );
};

export default SinaisVitaisForm;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { SubconjuntoDiagnostico } from '@/types';
import { AlertCircle } from 'lucide-react';

interface NecessidadesHumanasTabProps {
    isLoadingSubconjuntos: boolean;
    affectedNhbs: SubconjuntoDiagnostico[];
    selectedNhbIds: string[];
    handleNhbSelectionChange: (nhbId: string, checked: boolean) => void;
}

const NecessidadesHumanasTab: React.FC<NecessidadesHumanasTabProps> = ({
    isLoadingSubconjuntos,
    affectedNhbs,
    selectedNhbIds,
    handleNhbSelectionChange
}) => {
    return (
        <div className="space-y-4 pt-4">
            <Card className="border-gray-200">
                <CardHeader>
                    <CardTitle className="text-base font-semibold">Necessidades Humanas Básicas Afetadas</CardTitle>
                    <CardDescription className="pt-2">
                        Durante a coleta de dados de enfermagem, foram identificadas alterações que afetam Necessidades Humanas Básicas (NHBs). Segundo a teoria de Wanda Horta, essas necessidades representam os fundamentos para uma assistência integral, sendo indispensável sua avaliação no processo de enfermagem.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoadingSubconjuntos ? (
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-6 w-2/3" />
                        </div>
                    ) : affectedNhbs.length > 0 ? (
                        <div className="space-y-3">
                            {affectedNhbs.map(nhb => (
                                <div key={nhb.id} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`nhb-${nhb.id}`}
                                        checked={selectedNhbIds.includes(nhb.id!)}
                                        onCheckedChange={(checked) => handleNhbSelectionChange(nhb.id!, !!checked)}
                                    />
                                    <Label htmlFor={`nhb-${nhb.id}`} className="font-normal text-sm cursor-pointer">
                                        {nhb.nome}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-lg bg-gray-50 border">
                            <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                            <p className="text-gray-700 font-medium text-base">Nenhuma Necessidade Humana Básica foi afetada.</p>
                            <p className="text-sm text-gray-500 mt-2">Preencha os Sinais Vitais na aba "Exame Físico" para identificar automaticamente as necessidades que podem requerer atenção.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default NecessidadesHumanasTab;

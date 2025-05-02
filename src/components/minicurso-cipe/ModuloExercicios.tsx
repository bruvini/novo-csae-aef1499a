import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { TermoCipe } from '@/types/cipe';

interface ModuloExerciciosProps {
  termos: TermoCipe[];
}

const ModuloExercicios: React.FC<ModuloExerciciosProps> = ({ termos }) => {
  const [casoClinico, setCasoClinico] = useState<string>('');
  const [foco, setFoco] = useState<string>('');
  const [julgamento, setJulgamento] = useState<string>('');
  const [meio, setMeio] = useState<string>('');
  const [acao, setAcao] = useState<string>('');
  const [tempo, setTempo] = useState<string>('');
  const [localizacao, setLocalizacao] = useState<string>('');
  const [cliente, setCliente] = useState<string>('');

  const termosFoco = termos.filter(t => t.tipo === "Foco").map(t => t.termo);
  const termosJulgamento = termos.filter(t => t.tipo === "Julgamento").map(t => t.termo);
  const termosMeio = termos.filter(t => t.tipo === "Meio").map(t => t.termo);
  const termosAcao = termos.filter(t => t.tipo === "Ação").map(t => t.termo);
  const termosTempo = termos.filter(t => t.tipo === "Tempo").map(t => t.termo);
  const termosLocalizacao = termos.filter(t => t.tipo === "Localização").map(t => t.termo);
  const termosCliente = termos.filter(t => t.tipo === "Cliente").map(t => t.termo);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Monte seu Caso Clínico</CardTitle>
          <CardDescription>Selecione os termos para montar o caso clínico</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="foco">Foco</Label>
              <Select onValueChange={setFoco}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o foco" />
                </SelectTrigger>
                <SelectContent>
                  {termosFoco.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="julgamento">Julgamento</Label>
              <Select onValueChange={setJulgamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o julgamento" />
                </SelectTrigger>
                <SelectContent>
                  {termosJulgamento.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="meio">Meio</Label>
              <Select onValueChange={setMeio}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o meio" />
                </SelectTrigger>
                <SelectContent>
                  {termosMeio.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="acao">Ação</Label>
              <Select onValueChange={setAcao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a ação" />
                </SelectTrigger>
                <SelectContent>
                  {termosAcao.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tempo">Tempo</Label>
              <Select onValueChange={setTempo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tempo" />
                </SelectTrigger>
                <SelectContent>
                  {termosTempo.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="localizacao">Localização</Label>
              <Select onValueChange={setLocalizacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a localização" />
                </SelectTrigger>
                <SelectContent>
                  {termosLocalizacao.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <Select onValueChange={setCliente}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {termosCliente.map((termo) => (
                    <SelectItem key={termo} value={termo}>{termo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="casoClinico">Caso Clínico</Label>
            <Input
              id="casoClinico"
              value={`${foco} ${julgamento} ${meio} ${acao} ${tempo} ${localizacao} ${cliente}`}
              readOnly
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button>Salvar</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ModuloExercicios;

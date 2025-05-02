
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { TimelineEvent } from "@/types/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { doc, serverTimestamp, setDoc, updateDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebase";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import Image from "../ui/image";

interface TimelineEventFormProps {
  initialData?: TimelineEvent;
  onSuccess: () => void;
}

const formSchema = z.object({
  titulo: z.string().min(3, { message: "Título deve ter pelo menos 3 caracteres" }),
  subtitulo: z.string().min(3, { message: "Subtítulo deve ter pelo menos 3 caracteres" }),
  textoRedacao: z.string().min(10, { message: "Texto deve ter pelo menos 10 caracteres" }),
  foto: z.string().url({ message: "URL da imagem inválida" }),
  legendaFoto: z.string().min(3, { message: "Legenda da foto é obrigatória" }),
  autoriaFoto: z.string().min(2, { message: "Autoria da foto é obrigatória" }),
  dataEvento: z.date({ required_error: "Data do evento é obrigatória" }),
});

const TimelineEventForm: React.FC<TimelineEventFormProps> = ({ initialData, onSuccess }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!initialData?.id;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      dataEvento: initialData.dataEvento ? initialData.dataEvento.toDate() : new Date(),
    } : {
      titulo: "",
      subtitulo: "",
      textoRedacao: "",
      foto: "",
      legendaFoto: "",
      autoriaFoto: "",
      dataEvento: new Date(),
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && initialData?.id) {
        // Atualizar evento existente
        await updateDoc(doc(db, "timelineEvents", initialData.id), {
          ...data,
          dataEvento: Timestamp.fromDate(data.dataEvento),
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "Evento atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        // Criar novo evento
        await addDoc(collection(db, "timelineEvents"), {
          ...data,
          dataEvento: Timestamp.fromDate(data.dataEvento),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        toast({
          title: "Evento criado",
          description: "O novo evento foi adicionado à linha do tempo.",
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o evento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="dataEvento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do Evento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd 'de' MMMM 'de' yyyy", {
                              locale: ptBR,
                            })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subtitulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subtítulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Subtítulo do evento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="textoRedacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Texto descritivo do evento" 
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="foto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem</FormLabel>
                  <FormControl>
                    <Input placeholder="URL da imagem (https://...)" {...field} />
                  </FormControl>
                  <FormMessage />
                  {field.value && (
                    <div className="mt-2 h-40 border rounded overflow-hidden">
                      <Image 
                        src={field.value} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="legendaFoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legenda da Foto</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição da imagem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="autoriaFoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Autoria da Foto</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome de quem forneceu a imagem" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="submit"
            className="bg-csae-green-600 hover:bg-csae-green-700"
            disabled={isSubmitting}
          >
            {isEditing ? "Atualizar Evento" : "Criar Evento"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TimelineEventForm;

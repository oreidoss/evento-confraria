import React, { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventFormFieldsProps {
  title: string;
  setTitle: (title: string) => void;
  location: string;
  setLocation: (location: string) => void;
  description: string;
  setDescription: (description: string) => void;
}

const EventFormFields = ({
  title,
  setTitle,
  location,
  setLocation,
  description,
  setDescription,
}: EventFormFieldsProps) => {
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title" className="text-lg font-medium">Nome do Evento</Label>
        <Input
          id="title"
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Digite o nome do evento"
          required
          className="bg-[#F8F9FD] dark:bg-gray-700 border-2 border-[#E2E8F0] dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-700 dark:text-gray-200"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-lg font-medium">Local do Evento</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Digite o local do evento"
          required
          className="bg-[#F8F9FD] dark:bg-gray-700 border-2 border-[#E2E8F0] dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-700 dark:text-gray-200"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-lg font-medium">Descrição (opcional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Digite uma descrição para o evento"
          className="resize-none h-24 bg-[#F8F9FD] dark:bg-gray-700 border-2 border-[#E2E8F0] dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-700 dark:text-gray-200"
        />
      </div>
    </>
  );
};

export default EventFormFields;
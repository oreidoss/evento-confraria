import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const EventHistoryHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full px-4 sm:px-0">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => navigate("/")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="text-center space-y-4 mb-12 animate-fadeIn">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Histórico de Eventos
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 sm:px-0">
          Veja todos os eventos realizados e seus detalhes.
        </p>
        <Button
          onClick={() => navigate("/criar-evento")}
          className="mt-4 w-full sm:w-auto"
        >
          <Plus className="mr-2" />
          Criar Novo Evento
        </Button>
      </div>
    </div>
  );
};
import React from "react";
import { useNavigate } from "react-router-dom";

function Index() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F1F0FB]">
      <div className="container py-12 px-4 mx-auto">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-[#0EA5E9]">
            Organizar Evento
          </h1>
          <p className="text-lg text-gray-600">
            Escolha uma das opções abaixo para começar
          </p>
        </div>

        <div className="mt-8 max-w-md mx-auto space-y-4">
          <button
            onClick={() => navigate("/criar-evento")}
            className="w-full py-4 bg-[#10B981] text-white rounded-lg text-lg font-semibold hover:bg-[#059669] transition-colors"
          >
            Criar Novo Evento
          </button>

          <button
            onClick={() => navigate("/historico")}
            className="w-full py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Ver Histórico de Eventos
          </button>
        </div>
      </div>
    </div>
  );
}

export default Index;

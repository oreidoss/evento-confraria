import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function CreateEvent() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    local: '',
    descricao: '',
    data: '',
    hora: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Primeiro, buscar o último número de evento
      const { data: lastEvent, error: countError } = await supabase
        .from('events')
        .select('Numero_evento')
        .order('Numero_evento', { ascending: false })
        .limit(1)
        .single()

      const nextNumber = lastEvent?.Numero_evento ? lastEvent.Numero_evento + 1 : 1

      // Criar o novo evento com o próximo número
      const { data, error } = await supabase
        .from('events')
        .insert([
          {
            title: formData.nome,
            description: formData.descricao,
            date: `${formData.data}T${formData.hora}`,
            Numero_evento: nextNumber,
            status: 'active'
          }
        ])
        .select()

      if (error) throw error

      alert('Evento criado com sucesso!')
      navigate('/')
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F1F0FB] p-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-center text-[#0EA5E9] mb-8">
          Criar Novo Evento
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Nome do Evento
            </label>
            <input
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Digite o nome do evento"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Local do Evento
            </label>
            <input
              type="text"
              name="local"
              value={formData.local}
              onChange={handleChange}
              placeholder="Digite o local do evento"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Descrição (opcional)
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              placeholder="Digite uma descrição para o evento"
              rows={4}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-lg font-medium text-gray-700">
              Data e Hora do Evento
            </label>
            <div className="flex gap-4">
              <input
                type="date"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                required
              />
              <input
                type="time"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-32 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#10B981] text-white rounded-lg text-lg font-semibold hover:bg-[#059669] transition-colors disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateEvent
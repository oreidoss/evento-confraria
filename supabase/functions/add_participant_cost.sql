CREATE OR REPLACE FUNCTION add_participant_cost(
  p_event_id UUID,
  p_participant_id UUID,
  p_valor DECIMAL,
  p_descricao TEXT
) RETURNS UUID AS $$
DECLARE
  v_cost_id UUID;
BEGIN
  -- Verificar se o participante está confirmado no evento
  IF NOT EXISTS (
    SELECT 1 
    FROM event_participants 
    WHERE event_id = p_event_id 
    AND participant_id = p_participant_id 
    AND status = 'confirmed'
  ) THEN
    RAISE EXCEPTION 'Participante não está confirmado no evento';
  END IF;

  -- Inserir o custo
  INSERT INTO detalhe_de_custo (
    event_id,
    participant_id,
    valor_por_participante,
    descricao
  ) VALUES (
    p_event_id,
    p_participant_id,
    p_valor,
    p_descricao
  ) RETURNING id INTO v_cost_id;

  RETURN v_cost_id;
END;
$$ LANGUAGE plpgsql; 
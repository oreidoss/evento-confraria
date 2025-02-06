CREATE OR REPLACE FUNCTION get_participants_with_costs(event_id UUID)
RETURNS TABLE (
  id UUID,
  participant_id UUID,
  participant_name TEXT,
  email TEXT,
  total_costs DECIMAL,
  balance DECIMAL
) AS $$
DECLARE
  total_event_cost DECIMAL;
  participant_count INTEGER;
  average_cost DECIMAL;
BEGIN
  -- Calcular o custo total do evento
  SELECT COALESCE(SUM(valor_por_participante), 0)
  INTO total_event_cost
  FROM detalhe_de_custo
  WHERE event_id = $1;

  -- Contar participantes confirmados
  SELECT COUNT(*)
  INTO participant_count
  FROM event_participants
  WHERE event_id = $1 AND status = 'confirmed';

  -- Calcular média por participante
  average_cost := CASE 
    WHEN participant_count > 0 THEN total_event_cost / participant_count
    ELSE 0
  END;

  RETURN QUERY
  SELECT 
    ep.id,
    ep.participant_id,
    ep.participant_name,
    p.email,
    COALESCE(SUM(dc.valor_por_participante), 0) as total_costs,
    COALESCE(SUM(dc.valor_por_participante), 0) - average_cost as balance
  FROM event_participants ep
  LEFT JOIN participants p ON p.id = ep.participant_id
  LEFT JOIN detalhe_de_custo dc ON dc.event_id = ep.event_id AND dc.participant_id = ep.participant_id
  WHERE ep.event_id = $1 AND ep.status = 'confirmed'
  GROUP BY ep.id, ep.participant_id, ep.participant_name, p.email;
END;
$$ LANGUAGE plpgsql; 
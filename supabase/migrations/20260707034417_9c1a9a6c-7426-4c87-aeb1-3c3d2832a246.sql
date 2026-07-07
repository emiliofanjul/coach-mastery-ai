
-- Managers can read all seller_events for sellers in their company
CREATE POLICY "managers read company events"
  ON public.seller_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sellers s
      WHERE s.id = seller_events.seller_id
        AND s.company_id = public.current_company_id()
        AND public.is_manager()
    )
  );

-- Add UPDATE policy for evaluations table (needed for marking as completed)
CREATE POLICY "Users can update their own evaluations"
ON public.evaluations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
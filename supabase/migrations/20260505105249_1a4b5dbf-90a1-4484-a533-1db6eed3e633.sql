ALTER TABLE public.bills 
ADD COLUMN installments_total integer,
ADD COLUMN installments_paid integer NOT NULL DEFAULT 0;
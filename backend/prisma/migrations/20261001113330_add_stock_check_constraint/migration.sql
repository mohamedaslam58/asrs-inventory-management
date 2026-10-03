ALTER TABLE "StockLevel" 
ADD CONSTRAINT "check_quantity_non_negative" 
CHECK (quantity >= 0);
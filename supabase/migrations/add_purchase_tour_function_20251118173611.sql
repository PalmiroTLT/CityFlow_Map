CREATE OR REPLACE FUNCTION public.purchase_tour(tour_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance NUMERIC;
  tour_price NUMERIC;
  current_user_id UUID := auth.uid();
  already_purchased BOOLEAN;
BEGIN
  -- Check if the user has already purchased the tour
  SELECT EXISTS (
    SELECT 1 FROM public.purchased_tours
    WHERE user_id = current_user_id AND tour_id = tour_id_input
  ) INTO already_purchased;

  IF already_purchased THEN
    RETURN json_build_object('success', false, 'message', 'Вы уже купили этот тур.');
  END IF;

  -- Get user balance
  SELECT balance INTO user_balance FROM public.profiles WHERE id = current_user_id;

  -- Get tour price
  SELECT price INTO tour_price FROM public.tours WHERE id = tour_id_input;

  -- Check if tour exists and has a price
  IF tour_price IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Тур не найден или цена не установлена.');
  END IF;

  -- Check if balance is sufficient
  IF user_balance < tour_price THEN
    RETURN json_build_object('success', false, 'message', 'Недостаточно средств.');
  END IF;

  -- Deduct price from balance
  UPDATE public.profiles SET balance = balance - tour_price WHERE id = current_user_id;

  -- Record the transaction
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (current_user_id, -tour_price, 'tour_purchase', 'Покупка тура ' || (SELECT name FROM tours WHERE id = tour_id_input));

  -- Record the tour purchase
  INSERT INTO public.purchased_tours (user_id, tour_id)
  VALUES (current_user_id, tour_id_input);

  RETURN json_build_object('success', true, 'message', 'Тур успешно куплен!');
END;
$$;

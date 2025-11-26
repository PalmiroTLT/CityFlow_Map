CREATE OR REPLACE FUNCTION public.purchase_tour(tour_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance NUMERIC;
  tour_price NUMERIC;
  current_user_id UUID := auth.uid();
BEGIN
  -- Get user balance
  SELECT balance INTO user_balance FROM public.profiles WHERE id = current_user_id;

  -- Get tour price
  SELECT price INTO tour_price FROM public.tours WHERE id = tour_id_input;

  -- Check if tour exists and has a price
  IF tour_price IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Tour not found or price is not set.');
  END IF;

  -- Check if balance is sufficient
  IF user_balance < tour_price THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient funds.');
  END IF;

  -- Deduct price from balance
  UPDATE public.profiles SET balance = balance - tour_price WHERE id = current_user_id;

  -- Record the transaction
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (current_user_id, -tour_price, 'tour_purchase', 'Purchase of tour ' || tour_id_input);

  -- Record the tour purchase
  INSERT INTO public.purchased_tours (user_id, tour_id)
  VALUES (current_user_id, tour_id_input);

  RETURN json_build_object('success', true, 'message', 'Tour purchased successfully.');
END;
$$;

CREATE OR REPLACE FUNCTION public.add_place(
    name TEXT,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    category_id UUID,
    city_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance NUMERIC;
  subscription_price NUMERIC := 10.00; -- Monthly price for adding a place
  current_user_id UUID := auth.uid();
  user_role public.user_type;
  new_place_id UUID;
BEGIN
  -- Check user role
  SELECT user_type INTO user_role FROM public.profiles WHERE id = current_user_id;
  IF user_role != 'business' THEN
    RETURN json_build_object('success', false, 'message', 'Only business users can add places.');
  END IF;

  -- Get user balance
  SELECT balance INTO user_balance FROM public.profiles WHERE id = current_user_id;

  -- Check if balance is sufficient
  IF user_balance < subscription_price THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient funds for monthly subscription.');
  END IF;

  -- Deduct price from balance
  UPDATE public.profiles SET balance = balance - subscription_price WHERE id = current_user_id;

  -- Record the transaction
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (current_user_id, -subscription_price, 'place_subscription', 'Initial subscription for new place');

  -- Insert the new place
  INSERT INTO public.places (name, description, latitude, longitude, category_id, city_id, owner_id, subscribed_until)
  VALUES (name, description, latitude, longitude, category_id, city_id, current_user_id, now() + interval '1 month')
  RETURNING id INTO new_place_id;

  RETURN json_build_object('success', true, 'message', 'Place added successfully.', 'place_id', new_place_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.upgrade_place_to_premium(place_id_input UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_balance NUMERIC;
  premium_price NUMERIC := 15.00; -- Monthly price for premium status
  current_user_id UUID := auth.uid();
  place_owner_id UUID;
BEGIN
  -- Verify ownership
  SELECT owner_id INTO place_owner_id FROM public.places WHERE id = place_id_input;
  IF place_owner_id IS NULL OR place_owner_id != current_user_id THEN
    RETURN json_build_object('success', false, 'message', 'You do not own this place or it does not exist.');
  END IF;

  -- Get user balance
  SELECT balance INTO user_balance FROM public.profiles WHERE id = current_user_id;

  -- Check if balance is sufficient
  IF user_balance < premium_price THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient funds for premium subscription.');
  END IF;

  -- Deduct price from balance
  UPDATE public.profiles SET balance = balance - premium_price WHERE id = current_user_id;

  -- Record the transaction
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (current_user_id, -premium_price, 'premium_subscription', 'Premium subscription for place ' || place_id_input);

  -- Update the place to be premium
  UPDATE public.places
  SET 
    is_premium = TRUE,
    premium_until = now() + interval '1 month'
  WHERE id = place_id_input;

  RETURN json_build_object('success', true, 'message', 'Place upgraded to premium successfully.');
END;
$$;

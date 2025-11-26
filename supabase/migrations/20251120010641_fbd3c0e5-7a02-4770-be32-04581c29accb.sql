-- Add fields to track subscription cancellation and place visibility
ALTER TABLE user_subscriptions 
ADD COLUMN cancel_at_period_end boolean DEFAULT false,
ADD COLUMN cancelled_at timestamp with time zone;

-- Add field to track hidden places (when subscription expires)
ALTER TABLE places 
ADD COLUMN is_hidden boolean DEFAULT false;

-- Add field to track when premium expires
ALTER TABLE places
ADD COLUMN premium_expires_at timestamp with time zone;

COMMENT ON COLUMN user_subscriptions.cancel_at_period_end IS 'If true, subscription will be cancelled at the end of current billing period';
COMMENT ON COLUMN user_subscriptions.cancelled_at IS 'When the cancellation was requested';
COMMENT ON COLUMN places.is_hidden IS 'Place is hidden from map when subscription payment fails';
COMMENT ON COLUMN places.premium_expires_at IS 'When premium status expires (for current paid period)';

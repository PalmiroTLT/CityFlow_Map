-- ============================================
-- RLS Policies: Push Subscriptions, Scheduled Notifications, Notification Statistics
-- ============================================

-- Push Subscriptions
CREATE POLICY "Users can view their own subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create their own subscriptions"
ON public.push_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
ON public.push_subscriptions
FOR DELETE
USING (auth.uid() = user_id);

-- Scheduled Notifications
CREATE POLICY "Admins can manage scheduled notifications"
ON public.scheduled_notifications
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Notification Statistics
CREATE POLICY "Admins can view all notification statistics"
ON public.notification_statistics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert notification statistics"
ON public.notification_statistics
FOR INSERT
WITH CHECK (true); -- For service role only
-- SECURITY: Transactional Payment Processing Functions
-- These functions ensure atomic operations for payment processing to prevent:
-- - Money lost (payment marked paid but credits not added)
-- - Double-crediting (credits added but payment not marked)
-- - Inconsistent state from partial failures

-- Function to process a payment and add credits atomically
CREATE OR REPLACE FUNCTION process_payment_add_credits(
    p_session_id TEXT,
    p_provider_payment_id TEXT,
    p_method TEXT,
    p_paid_at TIMESTAMPTZ,
    p_raw_event JSONB,
    p_user_id UUID,
    p_org_id UUID,
    p_credits_to_add INT,
    p_package_name TEXT,
    p_package_id TEXT,
    p_amount_php INT
)
RETURNS TABLE(
    payment_updated BOOLEAN,
    credits_added BOOLEAN,
    new_balance INT,
    old_balance INT,
    error_message TEXT
) AS $$
DECLARE
    v_old_balance INT;
    v_new_balance INT;
    v_payment_id UUID;
BEGIN
    -- Start transaction (already in one from function call)
    
    -- Step 1: Lock and update the payment record
    UPDATE payment_records
    SET 
        status = 'paid',
        method = p_method,
        paid_at = p_paid_at,
        raw_event = p_raw_event,
        updated_at = NOW()
    WHERE session_id = p_session_id
      AND status = 'pending'  -- Only update pending payments
    RETURNING id INTO v_payment_id;
    
    IF v_payment_id IS NULL THEN
        -- Payment not found or already processed
        RETURN QUERY SELECT FALSE, FALSE, 0, 0, 'Payment not found or already processed'::TEXT;
        RETURN;
    END IF;
    
    -- Step 2: Lock the user profile and get current balance
    SELECT credits_balance INTO v_old_balance
    FROM profiles
    WHERE id = p_user_id AND org_id = p_org_id
    FOR UPDATE;
    
    IF v_old_balance IS NULL THEN
        -- User profile not found - rollback by raising exception
        RAISE EXCEPTION 'User profile not found: %', p_user_id;
    END IF;
    
    v_new_balance := COALESCE(v_old_balance, 0) + p_credits_to_add;
    
    -- Step 3: Update the user's credit balance
    UPDATE profiles
    SET 
        credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id AND org_id = p_org_id;
    
    -- Step 4: Create a credit transaction record
    INSERT INTO credit_transactions (
        user_id,
        org_id,
        transaction_type,
        amount,
        credits_before,
        credits_after,
        description,
        reference_id,
        metadata
    ) VALUES (
        p_user_id,
        p_org_id,
        'purchase',
        p_credits_to_add,
        v_old_balance,
        v_new_balance,
        p_package_name || ' - Payment Completed',
        p_session_id,
        jsonb_build_object(
            'type', 'credit_purchase',
            'package_id', p_package_id,
            'payment_session_id', p_session_id,
            'provider_payment_id', p_provider_payment_id,
            'amount_php', p_amount_php
        )
    );
    
    -- All operations successful
    RETURN QUERY SELECT TRUE, TRUE, v_new_balance, v_old_balance, NULL::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Any error will cause automatic rollback
        -- Return error information
        RETURN QUERY SELECT FALSE, FALSE, 0, 0, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark payment failed atomically
CREATE OR REPLACE FUNCTION mark_payment_failed_atomic(
    p_session_id TEXT,
    p_provider_payment_id TEXT,
    p_reason TEXT,
    p_raw_event JSONB
)
RETURNS TABLE(
    success BOOLEAN,
    payment_id UUID,
    error_message TEXT
) AS $$
DECLARE
    v_payment_id UUID;
BEGIN
    -- Update the payment record
    UPDATE payment_records
    SET 
        status = 'failed',
        reason = p_reason,
        raw_event = p_raw_event,
        updated_at = NOW()
    WHERE (session_id = p_session_id OR provider_payment_id = p_provider_payment_id)
      AND status = 'pending'  -- Only update pending payments
    RETURNING id INTO v_payment_id;
    
    IF v_payment_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, 'Payment not found or already processed'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT TRUE, v_payment_id, NULL::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION process_payment_add_credits TO service_role;
GRANT EXECUTE ON FUNCTION mark_payment_failed_atomic TO service_role;

-- Comments
COMMENT ON FUNCTION process_payment_add_credits IS 'Atomically processes a payment and adds credits in a single transaction';
COMMENT ON FUNCTION mark_payment_failed_atomic IS 'Atomically marks a payment as failed';

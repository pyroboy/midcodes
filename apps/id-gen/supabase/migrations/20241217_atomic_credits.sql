-- SECURITY: Atomic credit update functions
-- These functions use row-level locking to prevent race conditions
-- in credit balance updates, ensuring data consistency under concurrent load

-- Function to atomically add credits to a user's balance
-- Uses FOR UPDATE locking to prevent concurrent modifications
CREATE OR REPLACE FUNCTION add_credits_atomic(
    p_user_id UUID,
    p_org_id UUID,
    p_credits_to_add INT
)
RETURNS TABLE(new_balance INT, old_balance INT) AS $$
DECLARE
    v_old_balance INT;
    v_new_balance INT;
BEGIN
    -- Lock the row and get current balance
    SELECT credits_balance INTO v_old_balance
    FROM profiles
    WHERE id = p_user_id AND org_id = p_org_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    -- Calculate new balance
    v_new_balance := COALESCE(v_old_balance, 0) + p_credits_to_add;
    
    -- Prevent negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits. Current: %, Requested: %', v_old_balance, p_credits_to_add;
    END IF;
    
    -- Update the balance
    UPDATE profiles
    SET 
        credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id AND org_id = p_org_id;
    
    RETURN QUERY SELECT v_new_balance, v_old_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to atomically deduct credits (with balance check)
-- Returns NULL if insufficient balance, preventing over-spending
CREATE OR REPLACE FUNCTION deduct_credits_atomic(
    p_user_id UUID,
    p_org_id UUID,
    p_credits_to_deduct INT
)
RETURNS TABLE(new_balance INT, old_balance INT, success BOOLEAN) AS $$
DECLARE
    v_old_balance INT;
    v_new_balance INT;
BEGIN
    -- Validate input
    IF p_credits_to_deduct <= 0 THEN
        RAISE EXCEPTION 'Credits to deduct must be positive';
    END IF;
    
    -- Lock the row and get current balance
    SELECT credits_balance INTO v_old_balance
    FROM profiles
    WHERE id = p_user_id AND org_id = p_org_id
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User not found: %', p_user_id;
    END IF;
    
    v_old_balance := COALESCE(v_old_balance, 0);
    
    -- Check if sufficient balance
    IF v_old_balance < p_credits_to_deduct THEN
        -- Return failure without updating
        RETURN QUERY SELECT v_old_balance, v_old_balance, FALSE;
        RETURN;
    END IF;
    
    -- Calculate and apply new balance
    v_new_balance := v_old_balance - p_credits_to_deduct;
    
    UPDATE profiles
    SET 
        credits_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id AND org_id = p_org_id;
    
    RETURN QUERY SELECT v_new_balance, v_old_balance, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to transfer credits between users atomically
-- Both operations happen in same transaction with proper locking
CREATE OR REPLACE FUNCTION transfer_credits_atomic(
    p_from_user_id UUID,
    p_from_org_id UUID,
    p_to_user_id UUID,
    p_to_org_id UUID,
    p_amount INT
)
RETURNS TABLE(from_new_balance INT, to_new_balance INT, success BOOLEAN) AS $$
DECLARE
    v_from_balance INT;
    v_to_balance INT;
BEGIN
    -- Validate input
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be positive';
    END IF;
    
    -- Lock both rows in consistent order to prevent deadlocks
    -- Always lock lower ID first
    IF p_from_user_id < p_to_user_id THEN
        SELECT credits_balance INTO v_from_balance
        FROM profiles WHERE id = p_from_user_id AND org_id = p_from_org_id FOR UPDATE;
        
        SELECT credits_balance INTO v_to_balance
        FROM profiles WHERE id = p_to_user_id AND org_id = p_to_org_id FOR UPDATE;
    ELSE
        SELECT credits_balance INTO v_to_balance
        FROM profiles WHERE id = p_to_user_id AND org_id = p_to_org_id FOR UPDATE;
        
        SELECT credits_balance INTO v_from_balance
        FROM profiles WHERE id = p_from_user_id AND org_id = p_from_org_id FOR UPDATE;
    END IF;
    
    v_from_balance := COALESCE(v_from_balance, 0);
    v_to_balance := COALESCE(v_to_balance, 0);
    
    -- Check sufficient balance
    IF v_from_balance < p_amount THEN
        RETURN QUERY SELECT v_from_balance, v_to_balance, FALSE;
        RETURN;
    END IF;
    
    -- Perform transfer
    UPDATE profiles SET credits_balance = credits_balance - p_amount, updated_at = NOW()
    WHERE id = p_from_user_id AND org_id = p_from_org_id;
    
    UPDATE profiles SET credits_balance = credits_balance + p_amount, updated_at = NOW()
    WHERE id = p_to_user_id AND org_id = p_to_org_id;
    
    RETURN QUERY SELECT v_from_balance - p_amount, v_to_balance + p_amount, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION add_credits_atomic TO service_role;
GRANT EXECUTE ON FUNCTION deduct_credits_atomic TO service_role;
GRANT EXECUTE ON FUNCTION transfer_credits_atomic TO service_role;

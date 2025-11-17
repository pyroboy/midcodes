-- Add batch penalty calculation function for improved performance
-- This eliminates N+1 query patterns when calculating penalties for multiple billings

CREATE OR REPLACE FUNCTION public.calculate_penalties_batch(p_billing_ids integer[])
RETURNS TABLE(billing_id integer, penalty_amount numeric)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_billing record;
    v_config record;
    v_days_late INTEGER;
    v_penalty_amount DECIMAL;
    v_compound_cycles INTEGER;
BEGIN
    -- Process each billing ID in the array
    FOR v_billing IN
        SELECT b.*
        FROM billings b
        WHERE b.id = ANY(p_billing_ids)
    LOOP
        -- Get penalty config for this billing type
        SELECT * INTO v_config
        FROM penalty_configs
        WHERE type = v_billing.type;

        -- Skip if paid or no config
        IF v_billing.status = 'PAID' OR v_config IS NULL THEN
            billing_id := v_billing.id;
            penalty_amount := 0;
            RETURN NEXT;
            CONTINUE;
        END IF;

        -- Calculate days late
        v_days_late := EXTRACT(DAY FROM NOW() - v_billing.due_date) - v_config.grace_period;

        -- No penalty if within grace period
        IF v_days_late <= 0 THEN
            billing_id := v_billing.id;
            penalty_amount := 0;
            RETURN NEXT;
            CONTINUE;
        END IF;

        -- Calculate base penalty
        v_penalty_amount := v_billing.balance * (v_config.penalty_percentage / 100);

        -- Apply compounding if configured
        IF v_config.compound_period IS NOT NULL AND v_days_late > v_config.compound_period THEN
            v_compound_cycles := FLOOR(v_days_late::DECIMAL / v_config.compound_period::DECIMAL);
            v_penalty_amount := v_billing.balance * (POWER(1 + v_config.penalty_percentage / 100, v_compound_cycles) - 1);
        END IF;

        -- Apply maximum penalty cap if configured
        IF v_config.max_penalty_percentage IS NOT NULL THEN
            v_penalty_amount := LEAST(
                v_penalty_amount,
                v_billing.balance * (v_config.max_penalty_percentage / 100)
            );
        END IF;

        -- Return the result for this billing
        billing_id := v_billing.id;
        penalty_amount := ROUND(v_penalty_amount, 2);
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.calculate_penalties_batch(integer[]) IS
'Batch version of calculate_penalty for improved performance. Calculates penalties for multiple billings in a single call, eliminating N+1 query patterns.';
#!/bin/bash

# Classification mapping for docs vs specs
# Returns "spec" or "doc" based on file content/purpose

classify_file() {
    local filename="$1"
    
    case "$filename" in
        # SPECIFICATIONS (Instructions/Plans)
        *"PLAN"*|*"INSTRUCTIONS"*|*"IMPROVEMENTS"*|*"CHECKLIST"*)
            echo "spec"
            ;;
        "REFACTORING_PLAN_PHASE_1.md"|"MOBILE_OPTIMIZATION_PLAN.md"|"DASHBOARD_UI_IMPROVEMENTS.md")
            echo "spec"
            ;;
        "ID_GEN_ROLE_INSTRUCTIONS.md"|"QA_CHECKLIST_AND_ROLLOUT.md")
            echo "spec"
            ;;
        "ROUTE_DOCUMENTATION.md"|"PAYMENT_STRUCTURE.md"|"PAYMENT_BYPASS_IMPLEMENTATION.md")
            echo "spec"
            ;;
        
        # DOCUMENTATION (Reports/Summaries)
        *"REPORT"*|*"SUMMARY"*|*"ANALYSIS"*|*"README"*|*"SETUP"*|*"COMPLETE"*)
            echo "doc"
            ;;
        "BUG_ANALYSIS_REPORT.md"|"VERIFICATION_REPORT.md"|"STEP_9_COMPLETION_SUMMARY.md")
            echo "doc"
            ;;
        "FIX_SUMMARY.md"|"PAYMONGO_CLIENT_SUMMARY.md"|"PAYMENTS_README.md")
            echo "doc"
            ;;
        "PAYMONGO_SETUP.md"|"PAYMONGO_ENV_SETUP_COMPLETE.md"|"MIGRATION README.md")
            echo "doc"
            ;;
        "BACKGROUND_POSITION_FIX.md"|"diagnose-template-upload.md")
            echo "doc"
            ;;
        
        # Default to doc if unsure
        *)
            echo "doc"
            ;;
    esac
}

# Test classification
if [[ "$1" == "test" ]]; then
    echo "Testing classification..."
    for file in /data/data/com.termux/files/home/midcodes/apps/id-gen/docs/*.md; do
        filename=$(basename "$file")
        classification=$(classify_file "$filename")
        echo "$classification: $filename"
    done
else
    classify_file "$1"
fi
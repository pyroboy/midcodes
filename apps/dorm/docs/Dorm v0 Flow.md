flowchart TD
    A[Property Admin Login] --> B[Dashboard]
    B --> C[Utility Readings Entry]
    C --> D{Select Utility Type}
    D -->|Electricity| E[Batch Reading Entry]
    D -->|Water| F[Batch Reading Entry]
    E --> G[System Calculates Consumption]
    F --> G
    G --> H{Consumption Check}
    H -->|Normal| I[Generate Bills]
    H -->|Unusual| J[Flag for Review]
    J --> I
    I --> K[Monthly Report Generation]
    K --> L[View Floor-wise Summary]
    L --> M[Total Occupancy]
    L --> N[Utility Consumption]
    L --> O[Overall Balance]
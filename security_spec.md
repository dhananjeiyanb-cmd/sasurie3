# Security Spec for SCE Firestore Database

## Data Invariants
1. `staff`, `classes`, `tasks`, `observations`, `monitoring`, `attendance`, `lessonPlans`, `hodReports`, `notifications`, `skillBankStudents` are managed collections.
2. System connection test documents are readable and writable.

## Security Rules Definition
The security rules allow read and write access to application collections for authorized faculty and system operation.

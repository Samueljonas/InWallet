"""
Signals for wallet app.
Business-critical ledger balance logic has been moved to TransactionService
to adhere to SRP (Single Responsibility Principle) and prevent signal recursion/race conditions.
"""
# Future Enhancements

Sim-Pesa provides a robust local environment for M-Pesa STK Push. This page outlines the roadmap for expanding Sim-Pesa into a comprehensive M-Pesa ecosystem simulator.

## Vision

Sim-Pesa aims to be the standard local development appliance for M-Pesa integrations, providing mocks and stateful simulations for every major Daraja endpoint.

## Planned Features

### 1. Expanded Daraja Endpoints
- **B2C (Business to Customer)** -- Simulate salary disbursements and promotional payments to users.
- **C2B (Customer to Business)** -- Mock Paybill and Buy Goods flows where the user initiates the payment from their handset.
- **B2B (Business to Business)** -- Simulate transfers between different ShortCodes.
- **Transaction Status Query** -- Mock the polling of transaction results for long-running processes.
- **Account Balance Query** -- Simulate checking real-time merchant balances.
- **Reversals** -- Test application logic for handling reversed transactions.

### 2. Developer Experience (DX)
- **Multi-Merchant Support** -- Manage multiple ShortCodes with distinct CallbackURLs and balance pools.
- **Custom Failure Injection** -- A "Chaos" mode to force random timeouts, network drops, or specific M-Pesa error codes.
- **Scenario Import/Export** -- Save and share complex test scenarios (e.g., "locked user with high balance") as JSON files.

### 3. Community Contributions

Sim-Pesa is open source and driven by developer needs in East Africa. We welcome contributions for:
- Mapping more obscure Daraja error codes.
- Improving the Virtual Smartphone UI aesthetics.
- Creating client libraries for common languages (Python, PHP, Go).

If you want to help build these features, check out the [Contributing Guide](/guide/contributing).

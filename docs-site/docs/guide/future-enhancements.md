# Future Enhancements

Sim-Pesa has achieved its primary goal of providing a robust local simulator for M-Pesa STK Push. However, the vision for this project extends far beyond just one API.

## 🚀 The Vision
We want Sim-Pesa to be the ultimate developer companion for the entire M-Pesa ecosystem. This project could evolve into a full-featured mock environment for every Daraja endpoint.

## 💡 Potential Features

### 1. Expanded Daraja Endpoints
- **B2C (Business to Customer)**: Simulate disbursements to users.
- **C2B (Customer to Business)**: Mock the Paybill and Buy Goods transaction flows.
- **B2B (Business to Business)**: Simulate transfers between different shortcodes.
- **Transaction Status Query**: Mock the polling of transaction results.
- **Account Balance Query**: Simulate checking a merchant's current balance.
- **Reversals**: Test your application's handling of transaction reversals.

### 2. Developer Experience (DX)
- **Multi-Merchant Support**: Allow managing multiple merchants with different configurations simultaneously.
- **Custom Failure Injection**: A "Chaos" mode where you can force random network failures or specific error codes to test your app's resilience.
- **Import/Export Data**: Easily share test scenarios and user seeds with teammates.

### 3. Community Contributions
This is an open-source project, and we welcome ideas from the community!
- What M-Pesa features do you struggle to test?
- How can we make the simulation even more realistic?
- Are there specific edge cases in Daraja that Sim-Pesa should mirror?

If you're interested in building any of these features, check out the [Contributing Guide](/guide/contributing).

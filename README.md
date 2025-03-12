# FluidFunds Dapp

**A Decentralized Investment Pool Platform with Real-Time Streaming Contributions**

FluidFund enables investors to contribute continuously to a fund manager's pool via Superfluid streams. The fund manager invests the pooled USDC on behalf of the investors.

![FluidFunds](https://github.com/fluidfunds/fluidfunds-app-v0/blob/main/design/fluidfunds.png)

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

## Installation

1. Clone the repo install and run in local:
   ```bash
   git clone https://github.com/fluidfunds/fluidfunds-app-v0
   cd fluidfunds-app-v0
  
   npm install
   npm run dev
   
   ```

2. Create your .env.local file:

- NEXT_PUBLIC_ALCHEMY_API_KEY="your RPC Api key"
- NEXT_PUBLIC_COVALENT_API_KEY="your covalent Api key"
- NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your WalletConnect Api key"
- NEXT_PUBLIC_SUPERFLUID_SUBGRAPH_URL=https://subgraph-endpoints.superfluid.dev/base-sepolia/protocol-v1




Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.



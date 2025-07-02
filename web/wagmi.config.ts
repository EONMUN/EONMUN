import { defineConfig } from '@wagmi/cli'
import { actions, hardhat,react } from '@wagmi/cli/plugins'

const chainIds = { 
  sepolia: 11155111,
  mainnet: 1,
}

export default defineConfig({
  out: 'src/abis.ts',
  contracts: [],
  plugins: [
    actions(),
    react(),
    hardhat({
      project: '../hardhat',
      deployments: {
        EMN: {
          [chainIds.sepolia]: '0x2E650Bc3C306018bFD3a652D704d07d07A46067a',
          [chainIds.mainnet]: '0x89849A41a2063B721EC31ba4A3260f93BcF5fEF2',
        },
      },
    })
  ],
})
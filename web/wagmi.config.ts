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
          [chainIds.sepolia]: '0xDA2fe88fDdaa300570cA823F834a2638C16Fc30c',
          [chainIds.mainnet]: '0xF5521D34Bd29f942523a7c125FFe0e06b6D41836',
        },
      },
    })
  ],
})
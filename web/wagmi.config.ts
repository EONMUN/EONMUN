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
          [chainIds.sepolia]: '0x6e3547adECFC090188b3E16d796fC380a3074Aa1',
          [chainIds.mainnet]: '0x0687470Cb1Af4C776185Fd4dA360501c40f6Ca28',
        },
      },
    })
  ],
})
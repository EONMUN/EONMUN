import { defineConfig } from '@wagmi/cli'
import { actions, hardhat,react } from '@wagmi/cli/plugins'

const chainIds = {
  sepolia: 11155111,
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
          [chainIds.sepolia]: '0xda4017302981F377a067c9390AC46B6177DbAd2c',
        },
      },
    })
  ],
})
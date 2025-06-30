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
          [chainIds.sepolia]: '0xD05c16c813a802c64359e6331590D4d810e59099',
        },
      },
    })
  ],
})
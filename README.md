# Stargate Crosschain Swap

This repo contains Typescript code that allow you to make cross chain swaps 
using Stargate Finance. 

You can learn more about how to use it by reading the thread on my [Twitter](https://twitter.com/sir_fedos)

## Setup
1. Install dependencies, generate typechain types
```shell
npm i
npm run generate-typechain
```
2. Create ```.env``` file and set private key there

## How to Swap
Script takes fromNetwork, toNetwork, amount and token CLI args. 

Here is example of calling script for initiating cross chain swap of 5 USDC from Fantom to Polygon
```shell
npx ts-node ./scripts/crossChainSwap.ts --fromNetwork=Fantom --toNetwork=Polygon --token=USDC --amount=5
```

**Please, note: Currently, supports only USDC on Fantom, Polygon, BSC networks.**
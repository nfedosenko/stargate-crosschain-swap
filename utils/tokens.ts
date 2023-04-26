import {StargateBlockchainType} from "./providers";

export enum TokenType {
    USDC = 'USDC'
}

export const BlockchainToToken: any = {
    [StargateBlockchainType.Fantom]: {
        [TokenType.USDC]: {
            address: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
            poolId: 1,
            decimals: 6
        }
    },
    [StargateBlockchainType.Polygon]: {
        [TokenType.USDC]: {
            address: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
            poolId: 1,
            decimals: 6
        }
    },
    [StargateBlockchainType.Avalanche]: {
        [TokenType.USDC]: {
            address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
            poolId: 1,
            decimals: 6
        }
    }
};

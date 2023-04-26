import dotenv from 'dotenv'
import {ethers} from 'ethers'
import {
    initAll,
    StargateBlockchainType,
    BlockchainToRouterAddress,
    BlockchainToChainId,
    BlockchainToScannerUrl
} from '../utils/providers'
import {TokenType, BlockchainToToken} from '../utils/tokens'
import {StargateRouterAbi__factory, ERC20Abi__factory} from "../typechain";

dotenv.config();

const argv = require('minimist')(process.argv.slice(2));

async function main() {
    const fromNetwork = StargateBlockchainType[argv.fromNetwork as keyof typeof StargateBlockchainType];
    const toNetwork = StargateBlockchainType[argv.toNetwork as keyof typeof StargateBlockchainType];

    const token = TokenType[argv.token as keyof typeof TokenType];
    const tokenDecimals = BlockchainToToken[fromNetwork][token].decimals;

    const amount = ethers.utils.parseUnits(`${argv.amount}`, tokenDecimals);
    const amountOutMin = ethers.BigNumber.from(amount)
        .sub(ethers.BigNumber.from(amount)
            .div(1000)
            .mul(Number(process.env.SLIPPAGE))
        )

    console.log(`Starting Crosschain Swap from ${fromNetwork} to ${toNetwork}`)

    if (!fromNetwork || !toNetwork || !token) {
        return new Error('Arguments missing');
    }

    const providers = initAll();
    const providerFeeData = await providers[fromNetwork].getFeeData()
    console.log('Fee Data: ', providerFeeData)

    const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, providers[fromNetwork])

    // Check if we have enough balance for specified amount for swap
    const tokenFromContract = ERC20Abi__factory.connect(BlockchainToToken[fromNetwork][token].address, signer)
    const balance = await tokenFromContract.balanceOf(signer.address);

    console.log(`Current Wallet Balance on ${fromNetwork}: ${ethers.utils.formatUnits(balance, tokenDecimals)}`)
    console.log(`Amount for Swap: ${ethers.utils.formatUnits(amount, tokenDecimals)}`)

    if (balance.lt(amount)) {
        return new Error(`Not enough balance of $${token} found on ${argv.fromNetwork}`);
    }

    // Check if we have enough allowance for Router contract
    // Approving spend if needed
    const allowance = await tokenFromContract.allowance(signer.address, BlockchainToRouterAddress[fromNetwork])

    console.log(`Allowance: ${ethers.utils.formatUnits(allowance, tokenDecimals)}`)

    if (allowance.lt(amount)) {
        await tokenFromContract.approve(BlockchainToRouterAddress[fromNetwork], amount, {
            gasPrice: providerFeeData.gasPrice,
            nonce: await providers[fromNetwork].getTransactionCount(signer.address)
        })
    }

    // We initialize router on fromNetwork, as we will specify destination network during swap
    const router = StargateRouterAbi__factory.connect(BlockchainToRouterAddress[fromNetwork], signer);

    const quoteData = await router.quoteLayerZeroFee(
        BlockchainToChainId[toNetwork],
        1,
        signer.address,
        "0x",
        ({
            dstGasForCall: 0,
            dstNativeAmount: 0,
            dstNativeAddr: "0x"
        })
    )
    const feeWei = quoteData[0];

    console.log('Quote data: ', quoteData)

    const tx = await router.swap(
        BlockchainToChainId[toNetwork],
        BlockchainToToken[fromNetwork][token].poolId,
        BlockchainToToken[toNetwork][token].poolId,
        signer.address,
        amount,
        amountOutMin,
        {dstGasForCall: 0, dstNativeAmount: 0, dstNativeAddr: "0x"},
        signer.address,
        "0x",
        {
            value: feeWei,
            gasLimit: 600000,
            gasPrice: providerFeeData.gasPrice,
            nonce: await providers[fromNetwork].getTransactionCount(signer.address)
        }
    )

    await tx.wait(1)

    console.log(`Transaction successfully sent: ${BlockchainToScannerUrl[fromNetwork]}/tx/${tx.hash}`)
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

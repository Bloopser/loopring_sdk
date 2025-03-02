import { ChainId } from "../defs/web3_defs";
import * as contract from "../api/contract_api";

import { DEFAULT_TIMEOUT } from "../defs/loopring_constants";

import { loopring_exported_account as acc, web3 } from "./utils";

import { ExchangeAPI } from "../api/exchange_api";
import { sleep } from "../utils";
import { deposit } from "../api/contract_api";
import { JSONOutput } from "typedoc";
import { TokenInfo } from "../defs";

// start ganache-cli before
// ganache-cli --debug --chainId=5 --account="0xadc22517f2de0093429e5365b042da0ec9299353943db0f0cc104743c69104cf,1000e+18" --secure --unlock "0xfF7d59D9316EBA168837E3eF924BCDFd64b237D8"

//const url = 'http://127.0.0.1:8545'

//const web3 = new Web3(new Web3.providers.HttpProvider(url))

let api: ExchangeAPI;

// lrc
const lrc = {
  type: "ERC20",
  tokenId: 1,
  symbol: "LRC",
  name: "Loopring",
  address: "0xfc28028d9b1f6966fe74710653232972f50673be",
  decimals: 18,
  precision: 6,
  precisionForOrder: 6,
  orderAmounts: {
    minimum: "1000000000000000000",
    maximum: "100000000000000000000000",
    dust: "10000000000000000000",
  },
  luckyTokenAmounts: {
    minimum: "1000000000000000000",
    maximum: "100000000000000000000000",
    dust: "10000000000000000000",
  },
  fastWithdrawLimit: "20000000000000000000000",
  gasAmounts: {
    distribution: "1230000",
    deposit: "200000",
  },
  enabled: true,
  isLpToken: false,
};

const eth = {
  type: "ETH",
  tokenId: 0,
  symbol: "ETH",
  name: "Ethereum",
  address: "0x0000000000000000000000000000000000000000",
  decimals: 18,
  precision: 7,
  precisionForOrder: 6,
  orderAmounts: {
    minimum: "1000000000000000",
    maximum: "10000000000000000000",
    dust: "10000000000000000",
  },
  luckyTokenAmounts: {
    minimum: "1000000000000000000",
    maximum: "100000000000000000000000",
    dust: "10000000000000000000",
  },
  fastWithdrawLimit: "20000000000000000000",
  gasAmounts: {
    distribution: "30000",
    deposit: "100000",
  },
  enabled: true,
  isLpToken: false,
};

const gasPrice = 30;

const gasLimit = 200000;

describe("contract test", function () {
  beforeEach(() => {
    api = new ExchangeAPI({ chainId: ChainId.GOERLI });
  });

  it(
    "approveMax_LRC",
    async () => {
      const nonce = await contract.getNonce(web3, acc.address);
      await sleep(200);
      const response = await contract.approveMax(
        web3,
        acc.address,
        lrc.address,
        acc.depositAddr,
        gasPrice,
        gasLimit,
        ChainId.GOERLI,
        nonce,
        true
      );

      console.log(`nonce: ${nonce} approveMax: ${JSON.stringify(response)}`);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "deposit_LRC2",
    async () => {
      const nonce = await contract.getNonce(web3, acc.address);
      await sleep(200);
      const response = await contract.deposit(
        web3,
        acc.address,
        acc.exchangeAddr,
        lrc,
        11,
        0,
        gasPrice,
        gasLimit,
        ChainId.GOERLI,
        nonce,
        true
      );

      console.log(`nonce: ${nonce} deposit_LRC: `, response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "approveMax_ETH test",
    async () => {
      const nonce = await contract.getNonce(web3, acc.address);
      await sleep(200);
      const response = await contract.approveMax(
        web3,
        acc.address,
        eth.address,
        acc.depositAddr,
        gasPrice,
        gasLimit,
        ChainId.GOERLI,
        nonce,
        true
      );

      console.log(`nonce: ${nonce} approveMax: ${response}`);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "deposit_LRC1",
    async () => {
      const nonce = await contract.getNonce(web3, acc.address);
      await sleep(200);
      const response = await contract.deposit(
        web3,
        acc.address,
        acc.exchangeAddr,
        lrc,
        1,
        0,
        gasPrice,
        gasLimit,
        ChainId.GOERLI,
        nonce,
        true
      );

      console.log(`nonce: ${nonce} deposit_LRC: `, response);
    },
    DEFAULT_TIMEOUT
  );

  //TODO: test for hardware wallet
  // it('deposit_ETH test', async () => {
  //     const nonce = await contract.getNonce(web3, acc.address)
  //     await sleep(200)
  //     const response = await contract.deposit(web3, acc.address, acc.exchangeAddr,
  //         eth, 0.1, 0, gasPrice, parseInt(eth.gasAmounts.deposit), ChainId.GOERLI, nonce, false)
  //
  //     console.log(`nonce: ${nonce} deposit_ETH: ${response}`)
  // }, DEFAULT_TIMEOUT)
  it(
    "forceWithdrawal test",
    async () => {
      const nonce = await contract.getNonce(web3, acc.address);
      await sleep(200);
      const response = await contract.forceWithdrawal(
        web3,
        acc.address,
        acc.accountId,
        acc.exchangeAddr,
        eth,
        0,
        gasPrice,
        gasLimit,
        ChainId.GOERLI,
        nonce,
        true
      );

      console.log(`nonce: ${nonce} deposit_ETH: ${response}`);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "approveZero_LRC",
    async () => {
      const nonce = await contract.getNonce(web3, acc.address);
      await sleep(200);
      const response = await contract.approveZero(
        web3,
        acc.address,
        lrc.address,
        acc.depositAddr,
        gasPrice,
        gasLimit,
        ChainId.GOERLI,
        nonce,
        true
      );

      console.log(`nonce: ${nonce} approveZero: ${response}`);
    },
    DEFAULT_TIMEOUT
  );
});

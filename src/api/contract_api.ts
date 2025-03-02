import Web3 from "web3";
import { Transaction } from "@ethereumjs/tx";

import { ChainId } from "../defs/web3_defs";

import { TokenInfo } from "../defs/loopring_defs";

import * as fm from "../utils/formatter";

import Contracts from "./ethereum/contracts/Contracts";

import Common from "@ethereumjs/common";

import BN from "bn.js";

export enum ERC20Method {
  Approve = "approve",
  Deposit = "deposit",
  ForceWithdraw = "forceWithdraw",
}

export const ApproveVal = {
  Zero: "0x0",
  Max: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
};

function checkWeb3(web3: any) {
  if (!web3) throw new Error("got undefined web3");
}

/**
 * @description sign hash
 * @param web3
 * @param account
 * @param hash
 * @returns {Promise.<*>}
 */
export async function sign(web3: Web3, account: string, hash: string) {
  checkWeb3(web3);
  return new Promise((resolve) => {
    try {
      web3.eth.sign(hash, account, function (err: any, result: any) {
        if (!err) {
          const r = result.slice(0, 66);
          const s = fm.addHexPrefix(result.slice(66, 130));
          let v = fm.toNumber(fm.addHexPrefix(result.slice(130, 132)));
          if (v === 0 || v === 1) v = v + 27; // 修复ledger的签名
          resolve({ result: { r, s, v } });
        } else {
          const errorMsg = err.message.substring(
            0,
            err.message.indexOf(" at ")
          );
          resolve({ error: { message: errorMsg } });
        }
      });
    } catch (reason) {
      resolve({ error: { message: reason } });
    }
  });
}

/**
 * @description Sends ethereum tx through MetaMask
 * @param web3
 * @param tx
 * @returns {*}
 */
export async function sendTransaction(web3: any, tx: any) {
  const response: any = await new Promise((resolve) => {
    try {
      web3.eth.sendTransaction(
        tx,
        function (err: any, transactionHash: string) {
          if (!err) {
            resolve({ result: transactionHash });
          } else {
            resolve({ error: { message: err.message } });
          }
        }
      );
    } catch (reason) {
      resolve({ error: { message: reason } });
    }
  });

  if (response["result"]) {
    return response;
  } else {
    const error = response["error"];
    throw new Error(error);
  }
}

/**
 * @description Signs ethereum tx
 * @param web3
 * @param account
 * @param rawTx
 * @returns {Promise.<*>}
 */
export async function signEthereumTx(
  web3: any,
  account: any,
  rawTx: any,
  chainId: ChainId
) {
  const common = new Common({ chain: chainId });

  // console.log('rawTx:', rawTx)
  const ethTx = Transaction.fromTxData(rawTx, { common });

  // console.log('ethTx:', ethTx)

  const hash = fm.toHex(ethTx.hash());

  let error: any = undefined;

  try {
    const response: any = await sign(web3, account, hash);

    if (!response["error"]) {
      const signature = response["result"];
      signature.v += chainId * 2 + 8;

      const jsonTx = Object.assign(ethTx.toJSON(), signature);

      jsonTx.from = rawTx.from;
      // console.log('account:', account)
      // console.log('jsonTx:', jsonTx)

      return { result: fm.toHex(JSON.stringify(jsonTx)), rawTx: jsonTx };
    } else {
      error = response["error"]["message"];
    }
  } catch (reason) {
    error = reason;
  }

  return { error };
}

export async function getNonce(web3: Web3, addr: string) {
  if (web3) return await web3.eth.getTransactionCount(addr);
  return -1;
}

export async function sendRawTx(
  web3: any,
  from: string,
  to: string,
  value: string,
  data: any,
  chainId: ChainId,
  nonce: number,
  gasPrice: any,
  gasLimit: number,
  sendByMetaMask = true
) {
  checkWeb3(web3);

  gasPrice = fm.fromGWEI(gasPrice).toNumber();

  const _value = new BN(value);
  const rawTx = {
    from,
    to,
    value: _value.toString(),
    data,
    chainId,
    nonce,
    gasPrice,
    gasLimit,
  };

  if (sendByMetaMask) {
    return await sendTransaction(web3, rawTx);
  }

  const res = await signEthereumTx(web3, from, rawTx, chainId);

  if (res?.rawTx) {
    return await sendTransaction(web3, res.rawTx);
  }

  return res;
}

function _genContractData(Contract: any, method: string, data: any) {
  return Contract.encodeInputs(method, data);
}

function genERC20Data(method: string, data: any) {
  return _genContractData(Contracts.ERC20Token, method, data);
}

export function genExchangeData(method: string, data: any) {
  return _genContractData(Contracts.ExchangeContract, method, data);
}

export async function approve(
  web3: Web3,
  from: string,
  to: string,
  depositAddress: string,
  _value: string,
  chainId: ChainId,
  nonce: number,
  gasPrice: number,
  gasLimit: number,
  sendByMetaMask: boolean
) {
  const data = genERC20Data(ERC20Method.Approve, {
    _spender: depositAddress,
    _value,
  });

  return await sendRawTx(
    web3,
    from,
    to,
    "0",
    data,
    chainId,
    nonce,
    gasPrice,
    gasLimit,
    sendByMetaMask
  );
}

// 3.6
/**
 * Approve Zero
 * @param tokenAddress: approve token symbol to zero
 * @param nonce: Ethereum nonce of this address
 * @param gasPrice: gas price in gwei
 * @param sendByMetaMask
 */
export async function approveZero(
  web3: any,
  owner: string,
  tokenAddress: string,
  depositAddress: string,
  gasPrice: number,
  gasLimit: number,
  chainId: ChainId = ChainId.GOERLI,
  nonce: number,
  sendByMetaMask = false
) {
  return await approve(
    web3,
    owner,
    tokenAddress,
    depositAddress,
    ApproveVal.Zero,
    chainId,
    nonce,
    gasPrice,
    gasLimit,
    sendByMetaMask
  );
}

// 3.6
/**
 * Approve Max
 * @param tokenAddress: approve token symbol to max
 * @param nonce: Ethereum nonce of this address
 * @param gasPrice: gas price in gwei
 * @param sendByMetaMask
 */
export async function approveMax(
  web3: any,
  owner: string,
  tokenAddress: string,
  depositAddress: string,
  gasPrice: number,
  gasLimit: number,
  chainId: ChainId = ChainId.GOERLI,
  nonce: number,
  sendByMetaMask = false
) {
  return await approve(
    web3,
    owner,
    tokenAddress,
    depositAddress,
    ApproveVal.Max,
    chainId,
    nonce,
    gasPrice,
    gasLimit,
    sendByMetaMask
  );
}

// 3.6
/**
 * deposit
 */
export async function deposit(
  web3: any,
  from: string,
  exchangeAddress: string,
  token: TokenInfo,
  value: number,
  fee: number,
  gasPrice: number,
  gasLimit: number,
  chainId: ChainId = ChainId.GOERLI,
  nonce: number,
  sendByMetaMask = true
) {
  let valueC = fm.toBig(value).times("1e" + token.decimals);

  const amount = fm.toHex(valueC);

  const data = genExchangeData(ERC20Method.Deposit, {
    tokenAddress: token.address,
    amount,
    from,
    to: from,
    extraData: "",
  });

  if (token.type === "ETH") {
    valueC = valueC.plus(fee);
  } else {
    valueC = fm.toBig(fee);
  }

  return await sendRawTx(
    web3,
    from,
    exchangeAddress,
    valueC.toFixed(),
    data,
    chainId,
    nonce,
    gasPrice,
    gasLimit,
    sendByMetaMask
  );
}

/**
 * forceWithdrawal
 */
export async function forceWithdrawal(
  web3: any,
  from: string,
  accountID: number,
  exchangeAddress: string,
  token: TokenInfo,
  fee: number,
  gasPrice: number,
  gasLimit: number,
  chainId: ChainId = ChainId.GOERLI,
  nonce: number,
  sendByMetaMask = false
) {
  const valueC = fm.toBig(fee);
  const data = genExchangeData(ERC20Method.ForceWithdraw, {
    owner: from,
    tokenAddress: token.address,
    accountID,
  });
  return await sendRawTx(
    web3,
    from,
    exchangeAddress,
    valueC.toFixed(),
    data,
    chainId,
    nonce,
    gasPrice,
    gasLimit,
    sendByMetaMask
  );
}

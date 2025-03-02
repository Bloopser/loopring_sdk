import { ChainId, ConnectorNames } from "../defs/web3_defs";
import { ExchangeAPI, UserAPI, WhitelistedUserAPI } from "../api";

import { dumpError400 } from "../utils/network_tools";

import {
  GetAccountRequest,
  GetNextStorageIdRequest,
  GetUserApiKeyRequest,
  OriginTransferRequestV3,
} from "../defs/loopring_defs";

import { DEFAULT_TIMEOUT, VALID_UNTIL } from "../defs/loopring_constants";

import * as sign_tools from "../api/sign/sign_tools";
import Web3 from "web3";
import { loopring_exported_account } from "./utils";

const PrivateKeyProvider = require("truffle-privatekey-provider");

let userApi: UserAPI;

let whitelistedUserApi: WhitelistedUserAPI;

let exchange: ExchangeAPI;

// let address = '0xff7d59d9316eba168837e3ef924bcdfd64b237d8'

///-----------------

const eddkeyWhitelisted =
  "0x27a5b716c7309a30703ede3f1a218cdec857e424a31543f8a658e7d2208db33";

describe("UserAPI test", function () {
  beforeEach(async () => {
    userApi = new UserAPI({ chainId: ChainId.GOERLI });
    exchange = new ExchangeAPI({ chainId: ChainId.GOERLI });
    whitelistedUserApi = new WhitelistedUserAPI({ chainId: ChainId.GOERLI });
  });

  it(
    "getAccountWhitelisted",
    async () => {
      const request: GetAccountRequest = {
        owner: loopring_exported_account.addressWhitlisted,
      };
      const response = await exchange.getAccount(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getUserApiKeyWhitelisted",
    async () => {
      // try {
      // } catch (reason) {
      //   dumpError400(reason);
      // }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "full_transfer_case",
    async () => {
      try {
        // step 0. init web3
        const provider = new PrivateKeyProvider(
          loopring_exported_account.privateKey,
          "https://goerli.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
        );
        const web3 = new Web3(provider);

        // step 1. get account info
        const { accInfo } = await exchange.getAccount({
          owner: loopring_exported_account.address,
        });

        if (!accInfo) {
          return;
        }

        const { exchangeInfo } = await exchange.getExchangeInfo();

        console.log("accInfo:", accInfo);

        const eddsakey = await sign_tools.generateKeyPair({
          web3,
          address: loopring_exported_account.addressWhitlisted,
          exchangeAddress: exchangeInfo.exchangeAddress,
          keyNonce: accInfo.nonce - 1,
          walletType: ConnectorNames.MetaMask,
        });

        console.log("eddsakey:", eddsakey.sk);

        // step 3 get apikey
        const request: GetUserApiKeyRequest = {
          accountId: accInfo.accountId,
        };

        const { apiKey } = await userApi.getUserApiKey(request, eddsakey.sk);

        // step 4 get storageId
        const request2: GetNextStorageIdRequest = {
          accountId: accInfo.accountId,
          sellTokenId: 1,
        };
        const storageId = await userApi.getNextStorageId(request2, apiKey);

        // step 5 transfer
        const request3: OriginTransferRequestV3 = {
          exchange: exchangeInfo.exchangeAddress,
          payerAddr: loopring_exported_account.address,
          payerId: accInfo.accountId,
          payeeAddr: "0xb6AdaC3e924B4985Ad74646FEa3610f14cDFB79c",
          payeeId: 10392,
          storageId: storageId.offchainId,
          token: {
            tokenId: 1,
            volume: "100000000000000000000",
          },
          maxFee: {
            tokenId: 1,
            volume: "9400000000000000000",
          },
          validUntil: VALID_UNTIL,
        };

        const response = await userApi.submitInternalTransfer({
          request: request3,
          web3,
          chainId: ChainId.GOERLI,
          walletType: ConnectorNames.Trezor,
          eddsaKey: eddsakey.sk,
          apiKey: apiKey,
        });

        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "whitelistedAccTransfer",
    async () => {
      try {
        // step 1. get account info
        const { accInfo } = await exchange.getAccount({
          owner: loopring_exported_account.addressWhitlisted,
        });

        if (!accInfo) {
          return;
        }

        console.log("accInfo:", accInfo);

        const { exchangeInfo } = await exchange.getExchangeInfo();

        // step 2 get apikey
        const request: GetUserApiKeyRequest = {
          accountId: accInfo.accountId,
        };

        const { apiKey } = await userApi.getUserApiKey(
          request,
          eddkeyWhitelisted
        );

        console.log("apiKey:", apiKey);

        // step 3 get storageId
        const request2: GetNextStorageIdRequest = {
          accountId: accInfo.accountId,
          sellTokenId: 1,
        };
        const storageId = await userApi.getNextStorageId(request2, apiKey);

        // step 4 transfer
        const request3: OriginTransferRequestV3 = {
          exchange: exchangeInfo.exchangeAddress,
          payerAddr: loopring_exported_account.addressWhitlisted,
          payerId: accInfo.accountId,
          payeeAddr: "0xb6AdaC3e924B4985Ad74646FEa3610f14cDFB79c",
          payeeId: 0,
          storageId: storageId.offchainId,
          token: {
            tokenId: 1,
            volume: "100000000000000000000",
          },
          maxFee: {
            tokenId: 1,
            volume: "9400000000000000000",
          },
          validUntil: VALID_UNTIL,
        };

        console.log("request3:", request3);

        const response = await whitelistedUserApi.submitInternalTransfer(
          request3,
          eddkeyWhitelisted,
          apiKey
        );

        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "updateAccount",
    async () => {
      // step 0. init web3
      const provider = new PrivateKeyProvider(
        loopring_exported_account.privateKey,
        "https://goerli.infura.io/v3/a06ed9c6b5424b61beafff27ecc3abf3"
      );

      const web3 = new Web3(provider);

      // step 1. get account info
      const { accInfo } = await exchange.getAccount({
        owner: loopring_exported_account.address,
      });

      if (!accInfo) {
        return;
      }

      const { exchangeInfo } = await exchange.getExchangeInfo();

      console.log("accInfo:", accInfo);
      const eddsaKey = await sign_tools.generateKeyPair({
        web3,
        address: accInfo.owner,
        exchangeAddress: exchangeInfo.exchangeAddress,
        keyNonce: accInfo.nonce - 1,
        walletType: ConnectorNames.MetaMask,
      });
      console.log("eddsakey:", eddsaKey.sk);
      const request = {
        exchange: exchangeInfo.exchangeAddress,
        owner: accInfo.owner,
        accountId: accInfo.accountId,
        publicKey: { x: eddsaKey.formatedPx, y: eddsaKey.formatedPy },
        maxFee: {
          tokenId: 1,
          volume: "0100000000000000000",
        },
        validUntil: VALID_UNTIL,
        nonce: accInfo.nonce as number,
      };
      const result = await userApi.updateAccount({
        request,
        web3,
        chainId: ChainId.GOERLI,
        walletType: ConnectorNames.Unknown,
        isHWAddr: false,
      });
      console.log("updateAccount result: ", JSON.stringify(result));

      // const { accInfo: accInfoNext } = await exchange.getAccount({
      //   owner: loopring_exported_account.address,
      // });
      // if (!accInfoNext) {
      //   return;
      // }
      // const eddsaKeyNext = await sign_tools.generateKeyPair({
      //   web3,
      //   address: accInfoNext.owner,
      //   exchangeAddress: loopring_exported_account.exchangeAddr,
      //   keyNonce: accInfoNext.nonce - 1,
      //   walletType: ConnectorNames.MetaMask,
      // });
      // console.log("eddsakey:", eddsaKeyNext.sk, "nonce", accInfoNext.nonce);
      //
      // const { apiKey } = await userApi.getUserApiKey(
      //   {
      //     accountId: accInfo.accountId,
      //   },
      //   eddsaKey.sk
      // );
      // console.log("apiKey:", apiKey);
    },
    DEFAULT_TIMEOUT + 20000
  );
});

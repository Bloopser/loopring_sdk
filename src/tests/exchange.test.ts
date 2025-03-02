import { dumpError400 } from "../utils/network_tools";
import {
  GetAccountRequest,
  GetCandlestickRequest,
  GetTokenBalancesRequest,
  GetAllowancesRequest,
  GetTickerRequest,
  GetDepthRequest,
  GetMarketTradesRequest,
  GetEthBalancesRequest,
  GetEthNonceRequest,
  GetWithdrawalAgentsRequest,
  GetAccountServicesRequest,
} from "../defs/loopring_defs";

import { TradingInterval, VipCatergory } from "../defs/loopring_enums";

import { DEFAULT_TIMEOUT } from "../defs/loopring_constants";

import { ChainId } from "../defs/web3_defs";
import { ExchangeAPI } from "../api";

import { loopring_exported_account as acc } from "./utils";

import { hasMarket, getExistedMarket } from "../utils/symbol_tools";

let api: ExchangeAPI;

describe("ExchangeAPI test", function () {
  beforeEach(() => {
    api = new ExchangeAPI({ chainId: ChainId.MAINNET });
  });

  it(
    "getProtocolPortrait_Mainnet",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });

      const response = await api.getProtocolPortrait();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getProtocolPortrait_Test",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });

      const response = await api.getProtocolPortrait();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getExchangeFeeInfo_Mainnet",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });

      const response = await api.getExchangeFeeInfo();
      console.log(response);
      console.log(
        response.raw_data[VipCatergory.ORDERBOOK_TRADING_FEES_STABLECOIN]
      );
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getExchangeFeeInfo_Test",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });

      const response = await api.getExchangeFeeInfo();
      console.log(response);
      console.log(
        response.raw_data[VipCatergory.ORDERBOOK_TRADING_FEES_STABLECOIN]
      );
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getRecommendedMarkets_MAINNET",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });

      const response = await api.getRecommendedMarkets();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getRecommendedMarkets",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });

      const response = await api.getRecommendedMarkets();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAccount_Found4",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const request: GetAccountRequest = {
        owner: "0x527784464d31c47e7567cA5a8D7BC719e5Ce2bE6",
      };
      const response = await api.getAccount(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAccount_Found3",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const request: GetAccountRequest = {
        owner: "0xd46ff313cb67b901821f5ce46eb0bc981a9c9457",
      };
      const response = await api.getAccount(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAccount_Found",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const request: GetAccountRequest = {
        owner: acc.address,
      };
      const response = await api.getAccount(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAccount_Not_Found",
    async () => {
      const request: GetAccountRequest = {
        owner: acc.address,
      };
      const response = await api.getAccount(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getEthNonce",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const req: GetEthNonceRequest = {
        owner: acc.address,
      };
      const response = await api.getEthNonce(req);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getGasPrice",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const response = await api.getGasPrice();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getGasPriceRange",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const response = await api.getGasPriceRange();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMarketTrades_err",
    async () => {
      const req: GetMarketTradesRequest = {
        market: "LRC-ETH_Not_Existed",
      };
      const response = await api.getMarketTrades(req);
      console.log(response);
      console.log(response.raw_data.trades);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMarketTrades_have",
    async () => {
      const req: GetMarketTradesRequest = {
        market: "ETH-USDT",
      };
      const response = await api.getMarketTrades(req);
      console.log(response);
      console.log(response.raw_data.trades);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getRelayerCurrentTime",
    async () => {
      const response = await api.getRelayerCurrentTime();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getFiatPrice1",
    async () => {
      const response = await api.getFiatPrice({ legal: "USD" });
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getFiatPrice2",
    async () => {
      const response = await api.getFiatPrice({ legal: "CNY" });
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAllowances",
    async () => {
      try {
        api = new ExchangeAPI({ chainId: ChainId.GOERLI });

        const request: GetAllowancesRequest = {
          owner: acc.address,
          token: "LRC,ETH,DAI",
        };

        const tokens = await api.getTokens();

        const response = await api.getAllowances(
          request,
          tokens.tokenSymbolMap
        );
        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getEthBalances2",
    async () => {
      try {
        api = new ExchangeAPI({ chainId: ChainId.GOERLI });

        const request: GetEthBalancesRequest = {
          owner: "0xBB2F3A6b7B8ec7A7bAcfbF5dC8aebBCB00dBD76B",
        };

        const response = await api.getEthBalances(request);
        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getEthBalances1",
    async () => {
      try {
        api = new ExchangeAPI({ chainId: ChainId.GOERLI });

        const request: GetEthBalancesRequest = {
          owner: acc.address,
        };

        const response = await api.getEthBalances(request);
        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getTokenBalances1",
    async () => {
      console.log("getTokenBalances acc.address:", acc.address);
      try {
        const tokens = await api.getTokens();

        console.log("tokens:", tokens.tokenSymbolMap["ETH"]);

        const request: GetTokenBalancesRequest = {
          owner: acc.address,
          token: tokens.tokenSymbolMap["ETH"].address,
        };

        const response = await api.getTokenBalances(
          request,
          tokens.tokenSymbolMap
        );
        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getTokenBalances0",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });

      console.log("getTokenBalances acc.address:", acc.address);
      try {
        const tokens = await api.getTokens();

        // console.log('tokens:', tokens.tokenSymbolMap)

        const request: GetTokenBalancesRequest = {
          owner: acc.address,
          token: "",
        };

        const response = await api.getTokenBalances(
          request,
          tokens.tokenSymbolMap
        );
        console.log(response);
      } catch (reason) {
        dumpError400(reason);
      }
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMarkets",
    async () => {
      const response = await api.getMarkets();
      console.log(response);
      console.log(response.pairs.LRC.tokenList);

      console.log(
        "hasMarket LRC-ETH:",
        hasMarket(response.marketArr, "LRC-ETH")
      );
      console.log(
        "market 1:",
        getExistedMarket(response.marketArr, "LRC", "ETH")
      );
      console.log(
        "market 2:",
        getExistedMarket(response.marketArr, "ETH", "LRC")
      );
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMixMarkets",
    async () => {
      const response = await api.getMixMarkets();
      console.log(response);
      console.log(response.pairs.LRC.tokenList);

      console.log(
        "hasMarket LRC-ETH:",
        hasMarket(response.marketArr, "LRC-ETH")
      );
      console.log(
        "market 1:",
        getExistedMarket(response.marketArr, "LRC", "ETH")
      );
      console.log(
        "market 2:",
        getExistedMarket(response.marketArr, "ETH", "LRC")
      );
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getWithdrawalAgents",
    async () => {
      const req: GetWithdrawalAgentsRequest = {
        tokenId: 1,
        amount: "10000000000",
      };

      const response = await api.getWithdrawalAgents(req);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getTokens",
    async () => {
      const response = await api.getTokens();
      console.log(response);
      console.log(response.raw_data[0]);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getDepth",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });

      const request: GetDepthRequest = {
        market: "LRC-ETH",
      };

      const response = await api.getDepth(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  // it('getMixDepth_test', async () => {

  //     api = new ExchangeAPI({ chainId: ChainId.GOERLI })

  //     const request: GetDepthRequest = {
  //         market: 'LRC-ETH'
  //     }

  //     const response = await api.getMixDepth(request)
  //     // console.log(response)

  //     const { viewData, } = depth2ViewData({ depth: response.depth, count: 10, })
  //     console.log(viewData)
  //     console.log(viewData.length)

  // }, DEFAULT_TIMEOUT)

  // it('getMixDepth2', async () => {

  //     api = new ExchangeAPI({ chainId: ChainId.MAINNET })

  //     const request: GetDepthRequest = {
  //         market: 'ETH-USDT'
  //     }

  //     const response = await api.getMixDepth(request)
  //     // console.log(response)

  //     const { viewData, } = depth2ViewData({ depth: response.depth, count: 8, maxWidth: 100, })
  //     console.log(viewData)
  //     console.log(viewData.length)

  // }, DEFAULT_TIMEOUT)

  it(
    "getMixDepth1",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });

      const request: GetDepthRequest = {
        market: "LRC-ETH",
      };

      const response = await api.getMixDepth(request);
      console.log(response);
      console.log(response.depth.bids);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getExchangeInfo",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });
      const response = await api.getExchangeInfo();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMixTicker",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });
      const request: GetTickerRequest = {
        market: [
          "LRC-ETH",
          "ETH-DAI",
          "ETH-USDT",
          "DAI-USDT",
          "LRC-USDT",
          "LRC-USDC",
          "USDC-USDT",
          "WBTC-USDT",
          "WBTC-USDC",
          "WBTC-DAI",
          "VSP-ETH",
          "DPI-ETH",
          "NIOX-ETH",
          "WETH-ETH",
          "VSP-DAI",
          "SMARTCREDIT-ETH",
          "ETH-USDC",
          "WBTC-ETH",
          "UNI-ETH",
          "LINK-ETH",
          "KP3R-ETH",
          "YFI-ETH",
          "YFII-ETH",
          "MCB-ETH",
          "AC-ETH",
          "HBTC-USDT",
          "1INCH-ETH",
          "AC-USDT",
          "VETH-ETH",
          "WOO-USDT",
          "HBTC-ETH",
          "CEL-ETH",
          "BEL-ETH",
          "OBTC-ETH",
          "ENJ-ETH",
          "AMP-ETH",
        ].join(","),
      };
      const response = await api.getMixTicker(request);
      console.log(response.tickMap["DAI-USDT"]);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getTicker",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.MAINNET });
      const request: GetTickerRequest = {
        market: "LRC-ETH",
      };
      const response = await api.getTicker(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAllMixTickers0",
    async () => {
      const response = await api.getAllMixTickers();
      console.log(response.tickMap);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAllMixTickers1",
    async () => {
      const response = await api.getAllMixTickers("AMM-LRC-ETH");
      console.log(response.tickMap);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAllMixTickers2",
    async () => {
      const response = await api.getAllMixTickers("AMM-LRC-ETH,LRC-ETH");
      console.log(response.tickMap);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAllTickers",
    async () => {
      const response = await api.getAllTickers();
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMixCandlestickAMM",
    async () => {
      const request: GetCandlestickRequest = {
        market: "AMM-LRC-ETH",
        interval: TradingInterval.min15,
        limit: 96,
      };
      const response = await api.getMixCandlestick(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getMixCandlestickNORMAL",
    async () => {
      const request: GetCandlestickRequest = {
        market: "LRC-ETH",
        interval: TradingInterval.min15,
        limit: 96,
      };
      const response = await api.getMixCandlestick(request);
      console.log(response);
      console.log(response.raw_data.candlesticks.length);
      console.log(response.candlesticks.length);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getCandlestick",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });
      const request: GetCandlestickRequest = {
        market: "LRC-ETH",
        interval: TradingInterval.min15,
        limit: 96,
      };
      const response = await api.getCandlestick(request);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );

  it(
    "getAccountServices",
    async () => {
      api = new ExchangeAPI({ chainId: ChainId.GOERLI });

      const req: GetAccountServicesRequest = {};

      const response = await api.getAccountServices(req);
      console.log(response);
    },
    DEFAULT_TIMEOUT
  );
});

import { BaseAPI } from "./base_api";

import { LOOPRING_URLs } from "../defs/url_defs";

import {
  SIG_FLAG,
  ReqMethod,
  Side,
  MarketStatus,
  VipCatergory,
  TradingInterval,
} from "../defs/loopring_enums";

import {
  ReqParams,
  TokenInfo,
  MarketTradeInfo,
  FiatPriceInfo,
  LoopringMap,
  GetAccountRequest,
  GetCandlestickRequest,
  GetDepthRequest,
  GetTickerRequest,
  GetMarketTradesRequest,
  GetFiatPriceRequest,
  GetTokenBalancesRequest,
  GetAllowancesRequest,
  MarketInfo,
  ExchangeInfo,
  TickerData,
  DepthData,
  Candlestick,
  TokenRelatedInfo,
  ABInfo,
  GetEthBalancesRequest,
  GetEthNonceRequest,
  GetWithdrawalAgentsRequest,
  GetAccountServicesRequest,
  VipFeeRateInfoMap,
} from "../defs/loopring_defs";

import { AccountInfo } from "../defs/account_defs";

import BigNumber from "bignumber.js";
import { getBaseQuote } from "../utils/symbol_tools";

const SEP = ",";

const checkAmt = (rawStr: string) => {
  if (rawStr.trim() === "") {
    return "0";
  }
  return rawStr;
};

function getFeeMap(feeArr: any[], type = 0) {
  const feesMap: any = {};

  if (feeArr instanceof Array) {
    feeArr.forEach((item: any, index: number, array: any) => {
      let key = "";
      switch (type) {
        case 1:
          key = item.type;
          break;
        default:
          key = item.token;
      }
      // feesMap[key] = new BigNumber(item.fee)
      feesMap[key] = item.fee;
    });
  }

  return feesMap;
}

function genAB(data: any[], isReverse = false) {
  const ab_arr: ABInfo[] = [];
  let amtTotal: BigNumber = new BigNumber(0);
  let volTotal: BigNumber = new BigNumber(0);

  const ab_prices: number[] = [];
  const ab_amtTotals: string[] = [];
  const ab_volTotals: string[] = [];

  const best = 0;

  if (data instanceof Array) {
    data.forEach((item: any) => {
      const price = parseFloat(item[0]);
      const amt = new BigNumber(item[1]); // base amt
      const vol = new BigNumber(item[2]); // quote vol
      amtTotal = amtTotal.plus(amt);
      volTotal = volTotal.plus(vol);
      ab_arr.push({
        price: price,
        amt: amt.toString(),
        vol: vol.toString(),
        amtTotal: amtTotal.toString(),
        volTotal: volTotal.toString(),
      });
      ab_prices.push(price);
      ab_amtTotals.push(amtTotal.toString());
      ab_volTotals.push(volTotal.toString());
    });
  }

  if (isReverse) {
    ab_arr.reverse();
    ab_prices.reverse();
    ab_amtTotals.reverse();
    ab_volTotals.reverse();
  }

  return {
    ab_arr,
    ab_prices,
    amtTotal,
    volTotal,
    ab_amtTotals,
    ab_volTotals,
    best,
  };
}

export function getMidPrice({
  _asks,
  askReverse,
  _bids,
  bidReverse,
}: {
  _asks: any;
  askReverse?: boolean;
  _bids: any;
  bidReverse?: boolean;
}) {
  if (askReverse === undefined) {
    askReverse = false;
  }

  if (bidReverse === undefined) {
    bidReverse = true;
  }

  const bids = genAB(_bids, bidReverse);
  const asks = genAB(_asks, askReverse);

  const mid_price =
    (bids.ab_prices[bids.ab_prices.length - 1] + asks.ab_prices[0]) / 2;

  return {
    bids,
    asks,
    mid_price,
  };
}

export class ExchangeAPI extends BaseAPI {
  /*
   * Returns the relayer's current time in millisecond
   */
  public async getRelayerCurrentTime() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_RELAYER_CURRENT_TIME,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    return {
      ...raw_data,
      raw_data,
    };
  }

  /*
   * Returns Protocol Portrait
   */
  public async getProtocolPortrait() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_PROTOCOL_PORTRAIT,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    return {
      ...raw_data,
      raw_data,
    };
  }

  /*
   * Returns exchange fee info
   */
  public async getExchangeFeeInfo() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_EXCHANGE_FEEINFO,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    return {
      orderbookTradingFeesStablecoin: raw_data[
        VipCatergory.ORDERBOOK_TRADING_FEES_STABLECOIN
      ] as VipFeeRateInfoMap,
      orderbookTradingFees: raw_data[
        VipCatergory.ORDERBOOK_TRADING_FEES
      ] as VipFeeRateInfoMap,
      ammTradingFees: raw_data[
        VipCatergory.AMM_TRADING_FEES
      ] as VipFeeRateInfoMap,
      otherFees: raw_data[VipCatergory.OTHER_FEES] as { [key: string]: string },
      raw_data,
    };
  }

  public async getWithdrawalAgents(request: GetWithdrawalAgentsRequest) {
    const reqParams: ReqParams = {
      queryParams: request,
      url: LOOPRING_URLs.GET_WITHDRAWAL_AGENTS,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const supportTokenMap: { [key: string]: any } = {};

    if (raw_data && raw_data.length > 0) {
      raw_data.forEach((item: any) => {
        if (item.symbol) {
          supportTokenMap[item.symbol] = item;
        }
      });
    }

    return {
      supportTokenMap,
      raw_data,
    };
  }

  public async getRecommendedMarkets() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_RECOMENDED_MARKETS,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    let recommended = [];

    if (raw_data?.recommended) {
      if (typeof raw_data.recommended === "string") {
        recommended = raw_data.recommended.split(",");
      } else {
        recommended = raw_data.recommended;
      }
    }

    return {
      recommended,
      raw_data,
    };
  }

  /*
   * Returns the configurations of all supported markets (trading pairs)
   */
  public async getMarkets(url: string = LOOPRING_URLs.GET_MARKETS) {
    const reqParams: ReqParams = {
      url,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const markets: LoopringMap<MarketInfo> = {};

    const pairs: LoopringMap<TokenRelatedInfo> = {};

    const isMix = url === LOOPRING_URLs.GET_MIX_MARKETS;

    if (raw_data?.markets instanceof Array) {
      raw_data.markets.forEach((item: any) => {
        const marketInfo: MarketInfo = {
          baseTokenId: item.baseTokenId,
          enabled: item.enabled,
          market: item.market,
          orderbookAggLevels: item.orderbookAggLevels,
          precisionForPrice: item.precisionForPrice,
          quoteTokenId: item.quoteTokenId,
        };

        if (isMix) {
          marketInfo.status = item.status as MarketStatus;
          marketInfo.isSwapEnabled =
            marketInfo.status === MarketStatus.ALL ||
            marketInfo.status === MarketStatus.AMM;
          marketInfo.createdAt = parseInt(item.createdAt);
        }

        markets[item.market] = marketInfo;

        if (item.enabled) {
          const market: string = item.market;
          const ind = market.indexOf("-");
          const base = market.substring(0, ind);
          const quote = market.substring(ind + 1, market.length);

          if (!pairs[base]) {
            pairs[base] = {
              tokenId: item.baseTokenId,
              tokenList: [quote],
            };
          } else {
            pairs[base].tokenList = [...pairs[base].tokenList, quote];
          }

          if (!pairs[quote]) {
            pairs[quote] = {
              tokenId: item.quoteTokenId,
              tokenList: [base],
            };
          } else {
            pairs[quote].tokenList = [...pairs[quote].tokenList, base];
          }
        }
      });
    }

    const marketArr = Reflect.ownKeys(markets);

    const tokenArr = Reflect.ownKeys(pairs);

    return {
      markets,
      pairs,
      tokenArr,
      tokenArrStr: tokenArr.join(SEP),
      marketArr,
      marketArrStr: marketArr.join(SEP),
      raw_data,
    };
  }

  /*
   * Returns the configurations of all supported markets (trading pairs)
   */
  public async getMixMarkets() {
    return await this.getMarkets(LOOPRING_URLs.GET_MIX_MARKETS);
  }

  /*
   * Returns the configurations of all supported tokens, including Ether.
   */
  public async getTokens() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_TOKENS,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const tokenSymbolMap: LoopringMap<TokenInfo> = {};
    const tokenIdMap: LoopringMap<TokenInfo> = {};
    const tokenIdIndex: LoopringMap<string> = {};
    const tokenAddressMap: LoopringMap<TokenInfo> = {};

    if (raw_data instanceof Array) {
      raw_data.forEach((item: TokenInfo) => {
        if (item.symbol.startsWith("LP-")) {
          item.isLpToken = true;
        } else {
          item.isLpToken = false;
        }
        tokenSymbolMap[item.symbol] = item;
        tokenIdMap[item.tokenId] = item;
        tokenIdIndex[item.tokenId] = item.symbol;
        tokenAddressMap[item.address] = item;
      });
    }

    const tokenSymbolArr = Reflect.ownKeys(tokenSymbolMap);
    const tokenIdArr = Reflect.ownKeys(tokenIdMap);
    const tokenAddressArr = Reflect.ownKeys(tokenAddressMap);

    return {
      tokenSymbolMap,
      tokenIdMap,
      tokenIdIndex,
      tokenAddressMap,

      tokenSymbolArr,
      tokenSymbolArrStr: tokenSymbolArr.join(SEP),
      tokenIdArr,
      tokenIdArrStr: tokenIdArr.join(SEP),
      tokenAddressArr,
      tokenAddressArrStr: tokenAddressArr.join(SEP),

      raw_data,
    };
  }

  private splitTokens(token: string, tokens: LoopringMap<TokenInfo>) {
    let tokenArray: any = [];
    const tokenAddrArr: string[] = [];

    if (tokens) {
      if (token) {
        tokenArray = token.split(SEP);
      }

      if (
        tokenArray.length <= 0 ||
        (tokenArray.length === 1 && tokenArray[0] === "")
      ) {
        tokenArray = Reflect.ownKeys(tokens);
      }

      tokenArray.forEach((item: string) => {
        tokenAddrArr.push(tokens[item].address);
      });

      token = tokenAddrArr.join(SEP);
    }

    return {
      tokenArray,
      token,
    };
  }

  /*
   * Returns the balances of all supported tokens, including Ether.
   */
  public async getEthBalances(request: GetEthBalancesRequest) {
    const reqParams: ReqParams = {
      queryParams: request,
      url: LOOPRING_URLs.GET_ETH_BALANCES,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const ethBalance = raw_data.amount;

    return {
      ethBalance,
      raw_data,
    };
  }

  /*
   * Returns the balances of all supported tokens, including Ether.
   */
  public async getTokenBalances(
    request: GetTokenBalancesRequest,
    tokens: LoopringMap<TokenInfo>
  ) {
    const { tokenArray, token } = this.splitTokens(request.token, tokens);

    request.token = token;

    const reqParams: ReqParams = {
      queryParams: request,
      url: LOOPRING_URLs.GET_TOKEN_BALANCES,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const tokenBalances: LoopringMap<string> = {};

    if (raw_data?.amount instanceof Array) {
      raw_data.amount.forEach((_: any, index: number) => {
        tokenBalances[tokenArray[index]] = raw_data.amount[index];
      });
    }

    return {
      tokenBalances,
      raw_data,
    };
  }

  /*
   * Returns the allowances of all supported tokens
   */
  public async getAllowances(request: GetAllowancesRequest, tokens: any) {
    const { tokenArray, token } = this.splitTokens(request.token, tokens);

    request.token = token;

    const reqParams: ReqParams = {
      queryParams: request,
      url: LOOPRING_URLs.GET_ALLOWANCES,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const tokenAllowances: LoopringMap<string> = {};

    if (raw_data?.allowances instanceof Array) {
      raw_data.allowances.forEach((_: any, index: number) => {
        tokenAllowances[tokenArray[index]] = raw_data.allowances[index];
      });
    }

    return {
      tokenAllowances,
      raw_data,
    };
  }

  /*
   * Return various configurations of Loopring.io
   */
  public async getExchangeInfo() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_EXCHANGE_INFO,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const exchangeInfo: ExchangeInfo = {
      ammExitFees: getFeeMap(raw_data.ammExitFees),
      chainId: raw_data.chainId,
      depositAddress: raw_data.depositAddress,
      exchangeAddress: raw_data.exchangeAddress,
      fastWithdrawalFees: getFeeMap(raw_data.fastWithdrawalFees),
      onchainFees: getFeeMap(raw_data.onchainFees, 1),
      openAccountFees: getFeeMap(raw_data.openAccountFees),
      transferFees: getFeeMap(raw_data.transferFees),
      updateFees: getFeeMap(raw_data.updateFees),
      withdrawalFees: getFeeMap(raw_data.withdrawalFees),
    };

    return {
      exchangeInfo,
      raw_data,
    };
  }

  public async getMixDepth(request: GetDepthRequest) {
    return await this.getDepth(request, LOOPRING_URLs.GET_MIX_DEPTH);
  }

  /*
   * Returns the order book of a given trading pair.
   */
  public async getDepth(
    request: GetDepthRequest,
    url: string = LOOPRING_URLs.GET_DEPTH
  ) {
    if (request?.level === undefined) {
      request.level = 0;
    }

    if (request?.limit === undefined) {
      request.limit = 50;
    }

    const reqParams: ReqParams = {
      queryParams: request,
      url,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const timestamp = raw_data["timestamp"];

    const { asks, bids, mid_price } = getMidPrice({
      _asks: raw_data["asks"],
      _bids: raw_data["bids"],
    });

    const depth: DepthData = {
      symbol: raw_data.market,
      version: parseInt(raw_data.version),
      timestamp,
      mid_price,
      bids: bids.ab_arr,
      bids_prices: bids.ab_prices,
      bids_amtTotals: bids.ab_amtTotals,
      bids_volTotals: bids.ab_volTotals,
      bids_amtTotal: bids.amtTotal.toString(),
      bids_volTotal: bids.volTotal.toString(),
      asks: asks.ab_arr,
      asks_prices: asks.ab_prices,
      asks_amtTotals: asks.ab_amtTotals,
      asks_volTotals: asks.ab_volTotals,
      asks_amtTotal: asks.amtTotal.toString(),
      asks_volTotal: asks.volTotal.toString(),
    };

    return {
      depth,
      raw_data,
    };
  }

  public async getMixTicker(request: GetTickerRequest) {
    return await this.getTicker(request, LOOPRING_URLs.GET_MIX_TICKER);
  }

  /*
   * Gets a markets ticker.
   * Generally speaking, a ticker in Loopring consists in data from the market taken last 24Hours.
   */
  public async getTicker(
    request: GetTickerRequest,
    url: string = LOOPRING_URLs.GET_TICKER
  ) {
    const reqParams: ReqParams = {
      url,
      queryParams: request,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data["tickers"];

    const tickMap: LoopringMap<TickerData> = {};
    const tickList: TickerData[] = [];

    if (raw_data instanceof Array) {
      raw_data.forEach((item: any, ind: number, arr: any) => {
        const open = parseFloat(item[4]);
        const close = parseFloat(item[7]);

        const symbol = item[0].replace("COMBINE-", "");

        const { base, quote } = getBaseQuote(symbol);

        let change = 0;
        if (!isNaN(open) && !isNaN(close)) {
          change = (close - open) / open;
        }

        const timestamp = parseInt(item[1]);

        const tick: TickerData = {
          symbol,
          base,
          quote,
          timestamp,
          base_token_volume: item[2],
          quote_token_volume: item[3],
          open,
          high: parseFloat(item[5]),
          low: parseFloat(item[6]),
          close,
          count: parseInt(item[8]),
          bid: parseFloat(item[9]),
          ask: parseFloat(item[10]),
          base_fee_amt: checkAmt(item[11]),
          quote_fee_amt: checkAmt(item[12]),
          change,
        };

        tickMap[symbol] = tick;
        tickList.push(tick);
      });
    }

    return {
      tickMap,
      tickList,
      raw_data,
    };
  }

  public async getAllMixTickers(markets: string | undefined = undefined) {
    if (!markets) {
      const { marketArrStr } = await this.getMixMarkets();

      markets = marketArrStr;
    }

    const request: GetTickerRequest = {
      market: markets,
    };

    return this.getMixTicker(request);
  }

  public async getAllTickers(markets: string | undefined = undefined) {
    if (!markets) {
      const { marketArrStr } = await this.getMarkets();

      markets = marketArrStr;
    }

    const request: GetTickerRequest = {
      market: markets,
    };

    return this.getTicker(request);
  }

  public async getMixCandlestick(request: GetCandlestickRequest) {
    return await this.getCandlestick(
      request,
      LOOPRING_URLs.GET_MIX_CANDLESTICK
    );
  }

  /*
   * Gets candlesticks.
   */
  public async getCandlestick(
    request: GetCandlestickRequest,
    url: string = LOOPRING_URLs.GET_CANDLESTICK
  ) {
    const reqParams: ReqParams = {
      url,
      queryParams: request,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    let tsStep = 60000;

    switch (request.interval) {
      case TradingInterval.min1:
        break;
      case TradingInterval.min5:
        tsStep = 300000;
        break;
      case TradingInterval.min15:
        tsStep = 900000;
        break;
      case TradingInterval.min30:
        tsStep = 1800000;
        break;
      case TradingInterval.hr1:
        tsStep = 3600000;
        break;
      case TradingInterval.hr2:
        tsStep = 7200000;
        break;
      case TradingInterval.hr4:
        tsStep = 14400000;
        break;
      case TradingInterval.hr12:
        tsStep = 43200000;
        break;
      case TradingInterval.d1:
        tsStep = 86400000;
        break;
      case TradingInterval.w1:
        tsStep = 604800000;
        break;
      default:
        break;
    }

    let candlesticks: Candlestick[] = [];

    if (raw_data?.candlesticks instanceof Array) {
      const rawCandlesticks = raw_data.candlesticks.reverse();

      let lastCandlestick: Candlestick | undefined = undefined;
      let lastTs = -1;

      rawCandlesticks.forEach((item: any) => {
        const curTs = parseInt(item[0]);

        if (lastCandlestick === undefined) {
          lastTs = curTs;

          const candlestick: Candlestick = {
            timestamp: curTs,
            txs: parseInt(item[1]),
            open: parseFloat(item[2]),
            close: parseFloat(item[3]),
            high: parseFloat(item[4]),
            low: parseFloat(item[5]),
            baseVol: item[6],
            quoteVol: item[7],
          };

          lastCandlestick = candlestick;

          candlesticks.push(candlestick);
        } else {
          const counter = (curTs - lastTs) / tsStep;

          // console.log('counter:', curTs, lastTs, counter)

          for (let i = 1; i <= counter; i++) {
            let candlestick: Candlestick;

            if (i === counter) {
              candlestick = {
                timestamp: lastTs + i * tsStep,
                txs: parseInt(item[1]),
                open: parseFloat(item[2]),
                close: parseFloat(item[3]),
                high: parseFloat(item[4]),
                low: parseFloat(item[5]),
                baseVol: item[6],
                quoteVol: item[7],
              };

              lastTs = curTs;
              lastCandlestick = candlestick;
            } else {
              candlestick = {
                timestamp: lastTs + i * tsStep,
                txs: 0,
                open: lastCandlestick.close,
                close: lastCandlestick.close,
                high: lastCandlestick.close,
                low: lastCandlestick.close,
                baseVol: "0",
                quoteVol: "0",
              };
            }

            candlesticks.push(candlestick);
          }
        }
      });
    }

    candlesticks = candlesticks.reverse();

    return {
      candlesticks,
      raw_data,
    };
  }

  /*
   * Fetches, for all the tokens supported by Loopring, their fiat price.
   */
  public async getFiatPrice(request: GetFiatPriceRequest) {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_FIAT_PRICE,
      queryParams: request,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const fiatPrices: LoopringMap<FiatPriceInfo> = {};

    if (raw_data?.prices instanceof Array) {
      raw_data.prices.forEach((item: FiatPriceInfo) => {
        fiatPrices[item.symbol] = item;
      });
    }

    return {
      fiatPrices,
      raw_data,
    };
  }

  /*
   * Query trades with specified market
   */
  public async getMarketTrades(request: GetMarketTradesRequest) {
    if (request.limit === undefined) {
      request.limit = 20;
    }

    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_TRADES,
      queryParams: request,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const marketTrades: MarketTradeInfo[] = [];

    if (raw_data?.trades instanceof Array) {
      raw_data.trades.forEach((item: any) => {
        marketTrades.push({
          tradeTime: parseInt(item[0]),
          tradeId: item[1],
          side: item[2] as Side,
          volume: item[3],
          price: item[4],
          market: item[5],
          fee: item[6],
        });
      });
    }

    return {
      totalNum: raw_data.totalNum,
      marketTrades,
      raw_data,
    };
  }

  /*
   * Returns data associated with the user's exchange account.
   */
  public async getAccount(request: GetAccountRequest) {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.ACCOUNT_ACTION,
      queryParams: request,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    let accInfo: AccountInfo | undefined = undefined;
    let error: any;

    if (raw_data?.resultInfo) {
      error = raw_data?.resultInfo;
    } else {
      accInfo = raw_data as AccountInfo;
    }

    return {
      accInfo,
      error,
      raw_data,
    };
  }

  /*
   */
  public async getEthNonce(request: GetEthNonceRequest) {
    const reqParams: ReqParams = {
      queryParams: request,
      url: LOOPRING_URLs.GET_ETH_NONCE,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const nonce = raw_data?.nonce;

    return {
      nonce,
      raw_data,
    };
  }

  /*
   */
  public async getGasPrice() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_GAS_PRICE,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const gasPrice = raw_data?.price;

    return {
      gasPrice,
      raw_data,
    };
  }

  /*
   */
  public async getGasPriceRange() {
    const reqParams: ReqParams = {
      url: LOOPRING_URLs.GET_GAS_PRICE_RANGE,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    const gasPriceRanges = raw_data?.ranges;

    return {
      gasPriceRanges,
      raw_data,
    };
  }

  public async getAccountServices(request: GetAccountServicesRequest) {
    const reqParams: ReqParams = {
      queryParams: request,
      url: LOOPRING_URLs.GET_ACCOUNT_SERVICES,
      method: ReqMethod.GET,
      sigFlag: SIG_FLAG.NO_SIG,
    };

    const raw_data = (await this.makeReq().request(reqParams)).data;

    return {
      register: raw_data?.register,
      order: raw_data?.order,
      joinAmm: raw_data?.joinAmm,
      dAppTrade: raw_data?.dAppTrade,
      raw_data,
    };
  }
}

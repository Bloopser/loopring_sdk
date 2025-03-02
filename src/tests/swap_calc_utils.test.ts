import {
  LoopringMap,
  MarketInfo,
  TokenInfo,
  DepthData,
  ChainId,
  AmmPoolInfoV3,
  AmmPoolSnapshot,
} from "../defs";

import { AmmpoolAPI, ExchangeAPI } from "../api";

import { dumpError400 } from "../utils/network_tools";

import { getOutputAmount } from "../utils/swap_calc_utils";
import { getExistedMarket } from "../utils";

const chainId = ChainId.GOERLI;

const TIMEOUT = 60000;

const feeBips = "20";

const _slipBips = "50";

let exchangeApi: ExchangeAPI;
let ammApi: AmmpoolAPI;

let sell: string;
let buy: string;
let marketArr: string[];

let isAtoB: boolean;

const AMM_LRC_ETH_poolAddress = "0x18920d6e6fb7ebe057a4dd9260d6d95845c95036";

let tokenMap: LoopringMap<TokenInfo>;

let marketMap: LoopringMap<MarketInfo>;

let depth: DepthData;

let ammpools: LoopringMap<AmmPoolInfoV3>;

let ammPoolSnapshot: AmmPoolSnapshot;

let input: string;

const init = async (chainId: ChainId = ChainId.MAINNET) => {
  try {
    exchangeApi = new ExchangeAPI({ chainId });
    ammApi = new AmmpoolAPI({ chainId });

    tokenMap = (await exchangeApi.getTokens()).tokenSymbolMap;

    const marketAll = await exchangeApi.getMixMarkets();

    marketMap = marketAll.markets;

    marketArr = marketAll.marketArr as string[];

    const { amm, market: marketTmp } = getExistedMarket(marketArr, sell, buy);

    const market = amm as string;

    depth = (await exchangeApi.getMixDepth({ market: marketTmp })).depth;

    // console.log(market, marketTmp, 'depth2:', depth2)

    ammpools = (await ammApi.getAmmPoolConf()).ammpools;

    const ammPoolInfo = ammpools[market];

    if (ammPoolInfo) {
      ammPoolSnapshot = (
        await ammApi.getAmmPoolSnapshot({ poolAddress: ammPoolInfo.address })
      ).ammPoolSnapshot as AmmPoolSnapshot;
    }
  } catch (reason) {
    dumpError400(reason);
  }
};

const initAll = async (
  _input: string,
  _base: string,
  _quote: string,
  _isAtoB = true,
  chainId = ChainId.MAINNET
) => {
  input = _input;
  sell = _base;
  buy = _quote;

  isAtoB = _isAtoB;

  await init(chainId);
};

const checkResult = (
  takerRate = "10",
  slipBips: string = _slipBips,
  feeBips = "20"
) => {
  if (input !== "0" && input !== "0.") {
    const { amm, market } = getExistedMarket(marketArr, sell, buy);

    const hasMarket = !!marketMap[market as string];

    console.log("marketMap hasMarket:", hasMarket);

    const marketItem = marketMap[market as string];

    console.log("marketMap:", marketItem);

    const hasMarket2 = !!ammpools[amm as string];

    console.log("ammpools hasMarket2:", hasMarket2);

    console.log("ammPoolSnapshot:", ammPoolSnapshot);

    console.log(
      input,
      "*",
      sell,
      buy,
      isAtoB,
      depth.mid_price,
      ammPoolSnapshot?.pooled,
      takerRate,
      slipBips
    );
  }

  const output: any = getOutputAmount({
    input,
    sell,
    buy,
    isAtoB,
    marketArr,
    tokenMap,
    marketMap,
    depth,
    feeBips,
    ammPoolSnapshot,
    takerRate,
    slipBips,
  });

  console.log("sell:", sell, " buy:", buy, " output:", output);
};

describe("swap_calc_utils", function () {
  beforeEach(async () => {
    return;
  }, TIMEOUT);

  it(
    "USDT_DAI_a2b_100",
    async () => {
      try {
        await initAll("100", "USDT", "DAI", true, ChainId.MAINNET);

        console.log("ammPoolSnapshot:", ammPoolSnapshot);
        console.log("depth:", depth);

        checkResult("4", _slipBips, "0");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "DAI_USDT_a2b_100",
    async () => {
      try {
        await initAll("100", "DAI", "USDT", true, ChainId.MAINNET);

        console.log("ammPoolSnapshot:", ammPoolSnapshot);
        console.log("depth:", depth);

        checkResult("4", _slipBips, "0");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_a2b_10000",
    async () => {
      try {
        await initAll("1000", "LRC", "ETH", true, ChainId.MAINNET);

        console.log("ammPoolSnapshot:", ammPoolSnapshot);
        console.log("depth:", depth);

        checkResult("10");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_USDT_a2b_1",
    async () => {
      try {
        await initAll("1", "ETH", "USDT", true);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "DAI_USDT_a2b_1",
    async () => {
      try {
        await initAll("100", "DAI", "USDT", true);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "DAI_USDT_a2b_exceedDepth_2",
    async () => {
      try {
        await initAll("100000", "DAI", "USDT", true);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "DAI_USDT_a2b_exceedDepth_3",
    async () => {
      try {
        await initAll("1000000", "DAI", "USDT", true);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "DAI_USDT_b2a_1",
    async () => {
      try {
        await initAll("50", "DAI", "USDT", false);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_a2b_exceedDepth",
    async () => {
      try {
        await initAll("1000000", "LRC", "ETH");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_test1",
    async () => {
      try {
        await initAll("1000", "LRC", "ETH", true, ChainId.MAINNET);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_test2",
    async () => {
      try {
        await initAll("100", "LRC", "ETH", true, ChainId.MAINNET);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_b2a_exceedDepth",
    async () => {
      try {
        await initAll("100", "LRC", "ETH", false);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_LRC_a2b_exceedDepth",
    async () => {
      try {
        await initAll("1000", "ETH", "LRC");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_LRC_b2a_exceedDepth",
    async () => {
      try {
        await initAll("5000000", "ETH", "LRC", false);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  // --------------------------------------------------

  it(
    "LRC_ETH_a2b_not_ExceedDepth200",
    async () => {
      try {
        await initAll("200", "LRC", "ETH");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_a2b_not_ExceedDepth15000",
    async () => {
      try {
        await initAll("15000", "LRC", "ETH");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_a2b_not_ExceedDepth3",
    async () => {
      try {
        await initAll("3", "LRC", "ETH");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_LRC_a2b_not_ExceedDepth0_1",
    async () => {
      try {
        await initAll("0.1", "ETH", "LRC");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_LRC_a2b_not_ExceedDepth5",
    async () => {
      try {
        await initAll("5", "ETH", "LRC");

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "LRC_ETH_b2a_not_ExceedDepth1",
    async () => {
      try {
        await initAll("1", "LRC", "ETH", false);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_LRC_b2a_not_ExceedDepth_10000",
    async () => {
      try {
        await initAll("10000", "ETH", "LRC", false);

        checkResult();
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  //-------

  it(
    "ETH_USDT_a2b_test",
    async () => {
      try {
        await initAll("1", "ETH", "USDT", true, ChainId.GOERLI);

        checkResult("0", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_USDT_b2a_test",
    async () => {
      try {
        await initAll("2800", "ETH", "USDT", false, ChainId.GOERLI);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "USDT_ETH_a2b_test",
    async () => {
      try {
        await initAll("2866", "USDT", "ETH", true, ChainId.GOERLI);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "USDT_ETH_b2a_test",
    async () => {
      try {
        await initAll("1", "USDT", "ETH", false, ChainId.GOERLI);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  //-------

  it(
    "ETH_USDT_a2b_main",
    async () => {
      try {
        await initAll("1", "ETH", "USDT", true, ChainId.MAINNET);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "ETH_USDT_b2a_main",
    async () => {
      try {
        await initAll("3500", "ETH", "USDT", false, ChainId.MAINNET);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "USDT_ETH_a2b_main",
    async () => {
      try {
        await initAll("3500", "USDT", "ETH", true, ChainId.MAINNET);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );

  it(
    "USDT_ETH_b2a_main",
    async () => {
      try {
        await initAll("1", "USDT", "ETH", false, ChainId.MAINNET);

        checkResult("10", "50", "20");
      } catch (reason) {
        dumpError400(reason);
      }
    },
    TIMEOUT
  );
});

export default {};

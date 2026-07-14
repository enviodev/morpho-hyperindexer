import { indexer, PreLiquidationFactory } from "envio";
import { preLiquidationContractId, marketId } from "../utils/ids.js";

indexer.onEvent(
  { contract: "PreLiquidationFactory", event: "CreatePreLiquidation" },
  async ({ event, context }) => {
    const id = preLiquidationContractId(
      event.chainId,
      event.params.id,
      event.params.preLiquidation,
    );

    context.PreLiquidationContract.set({
      id,
      chainId: event.chainId,
      market_id: marketId(event.chainId, event.params.id),
      address: event.params.preLiquidation,
      preLltv: event.params.preLiquidationParams[0],
      preLCF1: event.params.preLiquidationParams[1],
      preLCF2: event.params.preLiquidationParams[2],
      preLIF1: event.params.preLiquidationParams[3],
      preLIF2: event.params.preLiquidationParams[4],
      preLiquidationOracle: event.params.preLiquidationParams[5],
    });
  }
);

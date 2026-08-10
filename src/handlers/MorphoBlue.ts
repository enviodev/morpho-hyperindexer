import { indexer, Morpho } from "envio";
import {
  marketId,
  positionId,
  authorizationId,
} from "../utils/ids.js";

indexer.onEvent(
  { contract: "Morpho", event: "CreateMarket" },
  async ({ event, context }) => {
  const id = marketId(event.chainId, event.params.id);

  context.Market.set({
    id,
    marketId: event.params.id,
    loanToken: event.params.marketParams[0],
    collateralToken: event.params.marketParams[1],
    oracle: event.params.marketParams[2],
    irm: event.params.marketParams[3],
    lltv: event.params.marketParams[4],
    totalSupplyAssets: 0n,
    totalSupplyShares: 0n,
    totalBorrowAssets: 0n,
    totalBorrowShares: 0n,
    lastUpdate: BigInt(event.block.timestamp),
    fee: 0n,
    rateAtTarget: 0n,
  });

}
);

indexer.onEvent(
  { contract: "Morpho", event: "SetFee" },
  async ({ event, context }) => {
  const id = marketId(event.chainId, event.params.id);
  const existing = await context.Market.getOrThrow(id);

  context.Market.set({
    ...existing,
    fee: event.params.newFee,
    lastUpdate: BigInt(event.block.timestamp),
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "AccrueInterest" },
  async ({ event, context }) => {
  const id = marketId(event.chainId, event.params.id);
  const existing = await context.Market.getOrThrow(id);

  context.Market.set({
    ...existing,
    totalSupplyAssets: existing.totalSupplyAssets + event.params.interest,
    totalSupplyShares: existing.totalSupplyShares + event.params.feeShares,
    totalBorrowAssets: existing.totalBorrowAssets + event.params.interest,
    lastUpdate: BigInt(event.block.timestamp),
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "Supply" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    totalSupplyAssets: market.totalSupplyAssets + event.params.assets,
    totalSupplyShares: market.totalSupplyShares + event.params.shares,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.onBehalf,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    supplyShares: position.supplyShares + event.params.shares,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "Withdraw" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    totalSupplyAssets: market.totalSupplyAssets - event.params.assets,
    totalSupplyShares: market.totalSupplyShares - event.params.shares,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.onBehalf,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    supplyShares: position.supplyShares - event.params.shares,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "SupplyCollateral" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.onBehalf,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    collateral: position.collateral + event.params.assets,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "WithdrawCollateral" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.onBehalf,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    collateral: position.collateral - event.params.assets,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "Borrow" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    totalBorrowAssets: market.totalBorrowAssets + event.params.assets,
    totalBorrowShares: market.totalBorrowShares + event.params.shares,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.onBehalf,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    borrowShares: position.borrowShares + event.params.shares,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "Repay" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    totalBorrowAssets: market.totalBorrowAssets - event.params.assets,
    totalBorrowShares: market.totalBorrowShares - event.params.shares,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.onBehalf);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.onBehalf,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    borrowShares: position.borrowShares - event.params.shares,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "Liquidate" },
  async ({ event, context }) => {
  const mId = marketId(event.chainId, event.params.id);
  const market = await context.Market.getOrThrow(mId);
  context.Market.set({
    ...market,
    totalSupplyAssets: market.totalSupplyAssets - event.params.badDebtAssets,
    totalSupplyShares: market.totalSupplyShares - event.params.badDebtShares,
    totalBorrowAssets: market.totalBorrowAssets - event.params.repaidAssets,
    totalBorrowShares: market.totalBorrowShares - event.params.repaidShares,
    lastUpdate: BigInt(event.block.timestamp),
  });

  const pId = positionId(event.chainId, event.params.id, event.params.borrower);
  const position = await context.Position.getOrCreate({
    id: pId,
    market_id: mId,
    user: event.params.borrower,
    supplyShares: 0n,
    borrowShares: 0n,
    collateral: 0n,
  });
  context.Position.set({
    ...position,
    collateral: position.collateral - event.params.seizedAssets,
    borrowShares:
      position.borrowShares -
      event.params.repaidShares -
      event.params.badDebtShares,
  });
}
);

indexer.onEvent(
  { contract: "Morpho", event: "SetAuthorization" },
  async ({ event, context }) => {
  const id = authorizationId(
    event.chainId,
    event.params.authorizer,
    event.params.authorized,
  );

  context.Authorization.set({
    id,
    authorizer: event.params.authorizer,
    authorizee: event.params.authorized,
    isAuthorized: event.params.newIsAuthorized,
  });
}
);

import { indexer, MetaMorphoFactory, MetaMorpho } from "envio";
import { getDecimals } from "../effects/getDecimals.js";
import {
  ZERO_ADDRESS,
  vaultId,
  vaultBalanceId,
  vaultConfigItemId,
  vaultQueueItemId,
  marketId,
} from "../utils/ids.js";

/*//////////////////////////////////////////////////////////////
                        CONTRACT REGISTER
//////////////////////////////////////////////////////////////*/

indexer.contractRegister(
  { contract: "MetaMorphoFactory", event: "CreateMetaMorpho" },
  async ({ event, context }) => {
  context.chain.MetaMorpho.add(event.params.metaMorpho);
}
);

/*//////////////////////////////////////////////////////////////
                        CREATE VAULT
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorphoFactory", event: "CreateMetaMorpho" },
  async ({ event, context }) => {
  const decimalsUnderlying = await context.effect(getDecimals, {
    address: event.params.asset,
  });
  const decimalsOffset = Math.max(0, 18 - decimalsUnderlying);

  const id = vaultId(event.chainId, event.params.metaMorpho);

  context.Vault.set({
    id,
    address: event.params.metaMorpho,
    asset: event.params.asset,
    decimalsUnderlying,
    decimalsOffset,
    totalSupply: 0n,
    owner: event.params.initialOwner,
    pendingOwner: ZERO_ADDRESS,
    curator: ZERO_ADDRESS,
    allocators: [],
    guardian: ZERO_ADDRESS,
    timelock: event.params.initialTimelock,
    pendingGuardian: ZERO_ADDRESS,
    pendingGuardianValidAt: 0n,
    pendingTimelock: 0n,
    pendingTimelockValidAt: 0n,
    fee: 0n,
    feeRecipient: ZERO_ADDRESS,
    skimRecipient: ZERO_ADDRESS,
    supplyQueueLength: 0,
    withdrawQueueLength: 0,
    lastTotalAssets: 0n,
    lostAssets: 0n,
    name: event.params.name,
    symbol: event.params.symbol,
  });
}
);

/*//////////////////////////////////////////////////////////////
                            OWNERSHIP
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorpho", event: "OwnershipTransferStarted" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    pendingOwner: event.params.newOwner,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "OwnershipTransferred" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    owner: event.params.newOwner,
    pendingOwner: ZERO_ADDRESS,
  });
}
);

/*//////////////////////////////////////////////////////////////
                              SUBMIT
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorpho", event: "SubmitCap" },
  async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  const timelock = v?.timelock ?? 0n;

  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const config = await context.VaultConfigItem.getOrCreate({
    id: configId,
    vault_id: vId,
    market_id: marketId(event.chainId, event.params.id),
    cap: 0n,
    pendingCap: 0n,
    pendingCapValidAt: 0n,
    enabled: false,
    removableAt: 0n,
  });
  context.VaultConfigItem.set({
    ...config,
    pendingCap: event.params.cap,
    pendingCapValidAt: BigInt(event.block.timestamp) + timelock,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SubmitGuardian" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  const timelock = existing.timelock;

  context.Vault.set({
    ...existing,
    pendingGuardian: event.params.newGuardian,
    pendingGuardianValidAt: BigInt(event.block.timestamp) + timelock,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SubmitMarketRemoval" },
  async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  const timelock = v?.timelock ?? 0n;

  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);
  if (!existing) return;

  context.VaultConfigItem.set({
    ...existing,
    removableAt: BigInt(event.block.timestamp) + timelock,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SubmitTimelock" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  const timelock = existing.timelock;

  context.Vault.set({
    ...existing,
    pendingTimelock: event.params.newTimelock,
    pendingTimelockValidAt: BigInt(event.block.timestamp) + timelock,
  });
}
);

/*//////////////////////////////////////////////////////////////
                              REVOKE
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorpho", event: "RevokePendingCap" },
  async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const config = await context.VaultConfigItem.getOrCreate({
    id: configId,
    vault_id: vId,
    market_id: marketId(event.chainId, event.params.id),
    cap: 0n,
    pendingCap: 0n,
    pendingCapValidAt: 0n,
    enabled: false,
    removableAt: 0n,
  });
  context.VaultConfigItem.set({
    ...config,
    pendingCap: 0n,
    pendingCapValidAt: 0n,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "RevokePendingGuardian" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    pendingGuardian: ZERO_ADDRESS,
    pendingGuardianValidAt: 0n,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "RevokePendingMarketRemoval" },
  async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const config = await context.VaultConfigItem.getOrCreate({
    id: configId,
    vault_id: vId,
    market_id: marketId(event.chainId, event.params.id),
    cap: 0n,
    pendingCap: 0n,
    pendingCapValidAt: 0n,
    enabled: false,
    removableAt: 0n,
  });
  context.VaultConfigItem.set({
    ...config,
    removableAt: 0n,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "RevokePendingTimelock" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    pendingTimelock: 0n,
    pendingTimelockValidAt: 0n,
  });
}
);

/*//////////////////////////////////////////////////////////////
                              SET
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetCap" },
  async ({ event, context }) => {
  const configId = vaultConfigItemId(
    event.chainId,
    event.srcAddress,
    event.params.id,
  );
  const existing = await context.VaultConfigItem.get(configId);
  if (!existing) return;

  context.VaultConfigItem.set({
    ...existing,
    cap: event.params.cap,
    pendingCap: 0n,
    pendingCapValidAt: 0n,
    ...(event.params.cap > 0n ? { enabled: true, removableAt: 0n } : {}),
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetCurator" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    curator: event.params.newCurator,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetVaultFee" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    fee: event.params.newFee,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetFeeRecipient" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    feeRecipient: event.params.newFeeRecipient,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetGuardian" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    guardian: event.params.guardian,
    pendingGuardian: ZERO_ADDRESS,
    pendingGuardianValidAt: 0n,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetIsAllocator" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  const allocators = existing.allocators as string[];
  const set = new Set(allocators);
  if (event.params.isAllocator) {
    set.add(event.params.allocator);
  } else {
    set.delete(event.params.allocator);
  }

  context.Vault.set({
    ...existing,
    allocators: [...set],
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetName" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    name: event.params.name,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetSkimRecipient" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    skimRecipient: event.params.newSkimRecipient,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetSymbol" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    symbol: event.params.symbol,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetTimelock" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    timelock: event.params.newTimelock,
    pendingTimelock: 0n,
    pendingTimelockValidAt: 0n,
  });
}
);

/*//////////////////////////////////////////////////////////////
                              QUEUES
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetSupplyQueue" },
  async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  if (!v) return;

  const oldLength = v.supplyQueueLength;
  const newQueue = event.params.newSupplyQueue;

  context.Vault.set({
    ...v,
    supplyQueueLength: newQueue.length,
  });

  const maxLen = Math.max(oldLength, newQueue.length);
  for (let ordinal = 0; ordinal < maxLen; ordinal++) {
    const queueItemId = vaultQueueItemId(
      event.chainId,
      event.srcAddress,
      ordinal,
    );
    const queueMarketId = newQueue[ordinal] ?? undefined;

    const queueItem = await context.VaultSupplyQueueItem.getOrCreate({
      id: queueItemId,
      vault_id: vId,
      ordinal,
      market_id: undefined,
    });
    context.VaultSupplyQueueItem.set({
      ...queueItem,
      market_id: queueMarketId
        ? marketId(event.chainId, queueMarketId)
        : undefined,
    });
  }
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "SetWithdrawQueue" },
  async ({ event, context }) => {
  const vId = vaultId(event.chainId, event.srcAddress);
  const v = await context.Vault.get(vId);
  if (!v) return;

  const oldLength = v.withdrawQueueLength;
  const newQueue = event.params.newWithdrawQueue;

  context.Vault.set({
    ...v,
    withdrawQueueLength: newQueue.length,
  });

  const maxLen = Math.max(oldLength, newQueue.length);
  for (let ordinal = 0; ordinal < maxLen; ordinal++) {
    const queueItemId = vaultQueueItemId(
      event.chainId,
      event.srcAddress,
      ordinal,
    );
    const queueMarketId = newQueue[ordinal] ?? undefined;

    const queueItem = await context.VaultWithdrawQueueItem.getOrCreate({
      id: queueItemId,
      vault_id: vId,
      ordinal,
      market_id: undefined,
    });
    context.VaultWithdrawQueueItem.set({
      ...queueItem,
      market_id: queueMarketId
        ? marketId(event.chainId, queueMarketId)
        : undefined,
    });
  }
}
);

/*//////////////////////////////////////////////////////////////
                          SHARES/ASSETS
//////////////////////////////////////////////////////////////*/

indexer.onEvent(
  { contract: "MetaMorpho", event: "Transfer" },
  async ({ event, context }) => {
  if (event.params.value === 0n) return;

  const vId = vaultId(event.chainId, event.srcAddress);

  if (event.params.from === ZERO_ADDRESS) {
    // Mint — increase totalSupply
    const v = await context.Vault.get(vId);
    if (v) {
      context.Vault.set({
        ...v,
        totalSupply: v.totalSupply + event.params.value,
      });
    }
  } else {
    // Not a mint — subtract from sender's balance
    const fromBalanceId = vaultBalanceId(
      event.chainId,
      event.srcAddress,
      event.params.from,
    );
    const fromBalance = await context.VaultBalance.getOrThrow(fromBalanceId);
    context.VaultBalance.set({
      ...fromBalance,
      shares: fromBalance.shares - event.params.value,
    });
  }

  if (event.params.to === ZERO_ADDRESS) {
    // Burn — decrease totalSupply
    const v = await context.Vault.get(vId);
    if (v) {
      context.Vault.set({
        ...v,
        totalSupply: v.totalSupply - event.params.value,
      });
    }
  } else {
    // Not a burn — add to receiver's balance (upsert)
    const toBalanceId = vaultBalanceId(
      event.chainId,
      event.srcAddress,
      event.params.to,
    );
    const toBalance = await context.VaultBalance.getOrCreate({
      id: toBalanceId,
      vault_id: vId,
      user: event.params.to,
      shares: 0n,
    });
    context.VaultBalance.set({
      ...toBalance,
      shares: toBalance.shares + event.params.value,
    });
  }
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "UpdateLastTotalAssets" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    lastTotalAssets: event.params.updatedTotalAssets,
  });
}
);

indexer.onEvent(
  { contract: "MetaMorpho", event: "UpdateLostAssets" },
  async ({ event, context }) => {
  const id = vaultId(event.chainId, event.srcAddress);
  const existing = await context.Vault.get(id);
  if (!existing) return;

  context.Vault.set({
    ...existing,
    lostAssets: event.params.newLostAssets,
  });
}
);

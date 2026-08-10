export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function marketId(id: string): string {
  return `${chainId}-${id}`;
}

export function positionId(
  marketId: string,
  user: string,
): string {
  return `${chainId}-${marketId}-${user}`;
}

export function authorizationId(
  authorizer: string,
  authorizee: string,
): string {
  return `${chainId}-${authorizer}-${authorizee}`;
}

export function preLiquidationContractId(
  marketId: string,
  address: string,
): string {
  return `${chainId}-${marketId}-${address}`;
}

export function vaultId(address: string): string {
  return `${chainId}-${address}`;
}

export function vaultBalanceId(
  vaultAddress: string,
  user: string,
): string {
  return `${chainId}-${vaultAddress}-${user}`;
}

export function vaultConfigItemId(
  vaultAddress: string,
  marketId: string,
): string {
  return `${chainId}-${vaultAddress}-${marketId}`;
}

export function vaultQueueItemId(
  vaultAddress: string,
  ordinal: number,
): string {
  return `${chainId}-${vaultAddress}-${ordinal}`;
}

import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DrillJettonMinter } from '../build/DrillJettonMinter/DrillJettonMinter_DrillJettonMinter';

export async function run(provider: NetworkProvider) {
  const admin = provider.sender().address;
  if (!admin) throw new Error('Connect wallet first');

  const minterAddr = Address.parse(process.env.MINTER_ADDRESS || '');
  const to = Address.parse(process.env.TREASURY_ADDRESS || admin.toString());
  const amountHuman = process.env.MINT_AMOUNT || '1000000';
  const amount = BigInt(amountHuman) * 1_000_000_000n;

  const minter = provider.open(DrillJettonMinter.fromAddress(minterAddr));
  await minter.send(provider.sender(), { value: toNano('0.2') }, {
    $$type: 'Mint',
    queryId: 0n,
    to,
    amount,
  });

  console.log(`Mint ${amountHuman} DRILL to ${to.toString()}`);
}

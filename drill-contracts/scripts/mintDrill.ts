import { Address, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DrillJettonMinter } from '../build/DrillJettonMinter/tact_DrillJettonMinter';

export async function run(provider: NetworkProvider) {
  const minterAddr = Address.parse(process.env.DRILL_MINTER_ADDRESS || '');
  const to = Address.parse(process.env.MINT_TO || '');
  const amountHuman = process.env.MINT_AMOUNT || '1000000';

  const minter = provider.open(DrillJettonMinter.fromAddress(minterAddr));
  await minter.send(
    provider.sender(),
    { value: toNano('0.15') },
    {
      $$type: 'Mint',
      queryId: BigInt(Date.now()),
      to,
      amount: toNano(amountHuman),
    },
  );

  console.log(`Mint ${amountHuman} DRILL ke ${to.toString()}`);
}

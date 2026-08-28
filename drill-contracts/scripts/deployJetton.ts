import { beginCell, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DrillJettonMinter } from '../build/DrillJettonMinter/tact_DrillJettonMinter';

export async function run(provider: NetworkProvider) {
  const admin = provider.sender().address;
  if (!admin) throw new Error('Connect wallet dulu');

  const content = beginCell()
    .storeUint(1, 8)
    .storeStringTail('https://drill-chi-flax.vercel.app/drill.json')
    .endCell();

  const minter = provider.open(await DrillJettonMinter.fromInit(admin, content));

  await minter.send(
    provider.sender(),
    { value: toNano('0.2') },
    { $$type: 'Mint', queryId: 0n, to: admin, amount: toNano('1000000') },
  );

  await provider.waitForDeploy(minter.address);
  console.log('DRILL minter:', minter.address.toString());
  console.log('Mint pertama 1,000,000 DRILL ke admin. Lanjut transfer ke treasury/liquid.');
}

import { Address, beginCell, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DrillJettonMinter } from '../build/DrillJettonMinter/DrillJettonMinter_DrillJettonMinter';

function offchainContent(url: string) {
  return beginCell().storeUint(1, 8).storeStringTail(url).endCell();
}

export async function run(provider: NetworkProvider) {
  const admin = provider.sender().address;
  if (!admin) throw new Error('Connect wallet first');

  const metadataUrl =
    process.env.METADATA_URL || 'https://drill-chi-flax.vercel.app/drill.json';

  const minter = provider.open(
    await DrillJettonMinter.fromInit(0n, admin, true, offchainContent(metadataUrl)),
  );

  await minter.send(provider.sender(), { value: toNano('0.15') }, null);
  await provider.waitForDeploy(minter.address);

  console.log('DRILL minter:', minter.address.toString());
  console.log('Admin:', admin.toString());
  console.log('Simpan address ini ke NEXT_PUBLIC_DRILL_JETTON_MASTER');
}

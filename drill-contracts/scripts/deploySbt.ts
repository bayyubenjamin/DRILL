import { toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DrillPassCollection } from '../build/DrillPassCollection/tact_DrillPassCollection';

export async function run(provider: NetworkProvider) {
  const admin = provider.sender().address;
  if (!admin) throw new Error('Connect wallet dulu');

  const collection = provider.open(
    await DrillPassCollection.fromInit(admin, toNano('1')),
  );

  await collection.send(provider.sender(), { value: toNano('0.15') }, null);
  await provider.waitForDeploy(collection.address);

  console.log('SBT collection:', collection.address.toString());
  console.log('Harga awal: 1 TON. Ganti pakai SetPrice.');
}

import { Address, beginCell, Dictionary, toNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { DrillPassCollection } from '../build/DrillPassCollection/DrillPassCollection_DrillPassCollection';

function offchainContent(url: string) {
  return beginCell().storeUint(1, 8).storeStringTail(url).endCell();
}

export async function run(provider: NetworkProvider) {
  const admin = provider.sender().address;
  if (!admin) throw new Error('Connect wallet first');

  const metadataUrl =
    process.env.PASS_METADATA_URL || 'https://drill-chi-flax.vercel.app/drill-pass.json';
  const price = toNano(process.env.MINT_PRICE_TON || '1');
  const minted = Dictionary.empty<Address, bigint>(
    Dictionary.Keys.Address(),
    Dictionary.Values.BigInt(257),
  );

  const collection = provider.open(
    await DrillPassCollection.fromInit(admin, 0n, price, offchainContent(metadataUrl), minted),
  );

  await collection.send(provider.sender(), { value: toNano('0.15') }, null);
  await provider.waitForDeploy(collection.address);

  console.log('Drill Pass collection:', collection.address.toString());
  console.log('Simpan address ini ke NEXT_PUBLIC_NFT_COLLECTION_ADDRESS');
}

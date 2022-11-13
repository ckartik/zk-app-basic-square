import { Square } from './Square.js';
import {
  isReady,
  shutdown,
  Field,
  Mina,
  PrivateKey,
  AccountUpdate,
} from 'snarkyjs';

(async function main() {
  console.log('waiting to be ready.');
  await isReady;
  console.log('Snarky has loaded');

  const Local = Mina.LocalBlockchain();
  Mina.setActiveInstance(Local);
  const deployerAccount = Local.testAccounts[0].privateKey;

  const zkAppPrivateKey = PrivateKey.random();
  const zkAppAddress = zkAppPrivateKey.toPublicKey();

  const contract = new Square(zkAppAddress);
  const deployTxn = await Mina.transaction(deployerAccount, () => {
    AccountUpdate.fundNewAccount(deployerAccount);
    contract.deploy({ zkappKey: zkAppPrivateKey });
    contract.init();
    contract.sign(zkAppPrivateKey);
  });
  await deployTxn.send().wait();
  const num0 = contract.num.get();
  console.log('state after init:', num0.toString());
  const updateTxn = await Mina.transaction(deployerAccount, () => {
    contract.update(Field(9));
    contract.sign(zkAppPrivateKey);
  });
  await updateTxn.send().wait();

  try {
    const txn3 = await Mina.transaction(deployerAccount, () => {
      contract.update(Field(81));
      contract.sign(zkAppPrivateKey);
    });
    await txn3.send().wait();
  } catch (err: any) {
    console.log(err.message);
  }

  const num1 = contract.num.get();
  console.log('state at the end:', num1.toString());
  console.log('Shutting down');
  await shutdown();
})();

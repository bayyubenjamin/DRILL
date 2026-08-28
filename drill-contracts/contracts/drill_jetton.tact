struct JettonMinterData {
    totalSupply: Int;
    mintable: Bool;
    adminAddress: Address;
    jettonContent: Cell;
    jettonWalletCode: Cell;
}

struct JettonWalletData {
    balance: Int;
    owner: Address;
    master: Address;
    code: Cell;
}

message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address?;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x178d4519) JettonTransferInternal {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) JettonNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0x595f07bc) JettonBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address?;
    customPayload: Cell?;
}

message(0x7bdd97de) JettonBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    responseDestination: Address?;
}

message(0xd53276db) JettonExcesses {
    queryId: Int as uint64;
}

message Mint {
    queryId: Int as uint64;
    to: Address;
    amount: Int as coins;
}

message ChangeAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message CloseMinting {
    queryId: Int as uint64;
}

const GAS_FOR_TRANSFER: Int = 8000;
const MIN_TONCOIN_FOR_STORAGE: Int = ton("0.01");

contract DrillJettonWallet(
    balance: Int as coins,
    owner: Address,
    master: Address,
) {
    receive(msg: JettonTransfer) {
        require(sender() == self.owner, "Only owner can transfer");
        self.balance -= msg.amount;
        require(self.balance >= 0, "Insufficient balance");

        deploy(DeployParameters{
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonTransferInternal{
                queryId: msg.queryId,
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload,
            }.toCell(),
            init: initOf DrillJettonWallet(0, msg.destination, self.master),
        });
    }

    receive(msg: JettonTransferInternal) {
        let expected: StateInit = initOf DrillJettonWallet(0, msg.sender, self.master);
        if (sender() != contractAddress(expected)) {
            require(sender() == self.master, "Invalid jetton sender");
        }
        self.balance += msg.amount;

        if (msg.forwardTonAmount > 0) {
            message(MessageParameters{
                to: self.owner,
                value: msg.forwardTonAmount,
                bounce: false,
                body: JettonNotification{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    sender: msg.sender,
                    forwardPayload: msg.forwardPayload,
                }.toCell(),
            });
        }

        if (msg.responseDestination != null) {
            message(MessageParameters{
                to: msg.responseDestination!!,
                value: 0,
                mode: SendRemainingValue + SendIgnoreErrors,
                bounce: false,
                body: JettonExcesses{ queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: JettonBurn) {
        require(sender() == self.owner, "Only owner can burn");
        self.balance -= msg.amount;
        require(self.balance >= 0, "Insufficient balance");
        message(MessageParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonBurnNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                sender: self.owner,
                responseDestination: msg.responseDestination,
            }.toCell(),
        });
    }

    bounced(msg: bounced<JettonTransferInternal>) {
        self.balance += msg.amount;
    }

    bounced(msg: bounced<JettonBurnNotification>) {
        self.balance += msg.amount;
    }

    get fun get_wallet_data(): JettonWalletData {
        return JettonWalletData{
            balance: self.balance,
            owner: self.owner,
            master: self.master,
            code: myCode(),
        };
    }
}

/// $DRILL master. Hard cap 10,000,000,000 tokens (9 decimals).
/// Only admin can mint. Admin cannot take tokens from user wallets.
contract DrillJettonMinter(
    totalSupply: Int as coins,
    admin: Address,
    mintable: Bool,
    content: Cell,
) {
    const MAX_SUPPLY: Int = 10000000000000000000;

    receive() {}

    receive(msg: Mint) {
        require(sender() == self.admin, "Only admin can mint");
        require(self.mintable, "Minting is closed");
        require(msg.amount > 0, "Amount must be positive");
        require(self.totalSupply + msg.amount <= self.MAX_SUPPLY, "Exceeds 10B hard cap");
        self.totalSupply += msg.amount;

        deploy(DeployParameters{
            value: 0,
            mode: SendRemainingValue,
            bounce: true,
            body: JettonTransferInternal{
                queryId: msg.queryId,
                amount: msg.amount,
                sender: myAddress(),
                responseDestination: self.admin,
                forwardTonAmount: 0,
                forwardPayload: beginCell().storeBit(false).asSlice(),
            }.toCell(),
            init: initOf DrillJettonWallet(0, msg.to, myAddress()),
        });
    }

    receive(msg: JettonBurnNotification) {
        let expected: StateInit = initOf DrillJettonWallet(0, msg.sender, myAddress());
        require(sender() == contractAddress(expected), "Invalid burn sender");
        require(msg.amount <= self.totalSupply, "Burn exceeds supply");
        self.totalSupply -= msg.amount;
        if (msg.responseDestination != null) {
            message(MessageParameters{
                to: msg.responseDestination!!,
                value: 0,
                mode: SendRemainingValue + SendIgnoreErrors,
                bounce: false,
                body: JettonExcesses{ queryId: msg.queryId }.toCell(),
            });
        }
    }

    receive(msg: ChangeAdmin) {
        require(sender() == self.admin, "Only admin");
        self.admin = msg.newAdmin;
    }

    receive(msg: CloseMinting) {
        require(sender() == self.admin, "Only admin");
        self.mintable = false;
    }

    get fun get_jetton_data(): JettonMinterData {
        return JettonMinterData{
            totalSupply: self.totalSupply,
            mintable: self.mintable,
            adminAddress: self.admin,
            jettonContent: self.content,
            jettonWalletCode: initOf DrillJettonWallet(0, myAddress(), myAddress()).code,
        };
    }

    get fun maxSupply(): Int {
        return self.MAX_SUPPLY;
    }

    get fun remainingMintable(): Int {
        return self.MAX_SUPPLY - self.totalSupply;
    }

    get fun admin(): Address {
        return self.admin;
    }

    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf DrillJettonWallet(0, owner, myAddress()));
    }
}

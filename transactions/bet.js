
const {
    BaseTransaction,
    TransactionError,
} = require('@liskhq/lisk-transactions')
const { isValidTransferAmount } = require("@liskhq/lisk-validator");

class BetTransaction extends BaseTransaction {
    //交易类型
    static get TYPE () {
        return 102;
    }
    //交易费用
    static get FEE () {
        return `0`;
    };
    //为 apply 和 undo 准备数据：缓存账户信息
    async prepare (store) {
        await store.account.cache([
            {
                address: this.senderId,
            },
            {
                address: this.asset.recipientId,
            },
        ]);
    }
    assetFromSync (raw) {
        if (raw.tf_data) {
            // This line will throw if there is an error
            const data = raw.tf_data.toString('utf8');
            return { data };
        }
        return undefined;
    }
    assetToBytes () {
        const { data } = this.asset;
        return data ? Buffer.from(data, 'utf8') : Buffer.alloc(0);
    }
    //检验交易金额是否是有效值
    validateAsset () {
        const errors = [];

        if (!isValidTransferAmount(this.asset.amount.toString())) {
            errors.push(
                new TransactionError(
                    'Invalid asset.amount',
                    this.id,
                    '->',
                    this.asset.amount.toString(),
                    "Valid number as string"
                ),
            );
        }
        return errors;
    }
    //交易主要逻辑函数
    applyAsset (store) {
        const errors = [];
        //获取发送者信息
        const sender = store.account.get(this.senderId);
        //获取接收者信息
        const recipient = store.account.getOrDefault(this.asset.recipientId);
        //判断发送者账户金额是否小于交易的金额，如果小于抛出错误，提示发送者账户资金不足
        if (BigInt(sender.balance) < BigInt(this.asset.amount)) {
            errors.push(
                new TransactionError(
                    'Sender has not enough balance',
                    this.id,
                    '->',
                    sender.balance,
                    this.asset.amount,
                ),
            );
        }
        //发送者账户金额减去交易金额
        const updatedSenderBalance = BigInt(sender.balance) - BigInt(this.asset.amount);
        const updatedSender = {
            ...sender,
            balance: updatedSenderBalance.toString(),
        };
        //更新发送者账户金额
        store.account.set(updatedSender.address, updatedSender);
        //接收者账户金额加上交易金额
        const updatedRecipientBalance = BigInt(recipient.balance) + BigInt(this.asset.amount);
        const updatedRecipient = {
            ...recipient,
            balance: updatedRecipientBalance.toString(),
        };
        //更新接收者账户金额
        store.account.set(updatedRecipient.address, updatedRecipient);
        return errors;
    }
    //撤销函数与apply逻辑相反
    undoAsset (store) {
        const errors = [];
        //获取发送者信息
        const sender = store.account.get(this.senderId);
        //发送者账户金额加上交易金额
        const updatedSenderBalance = BigInt(sender.balance) + BigInt(this.asset.amount);
        const updatedSender = {
            ...sender,
            balance: updatedSenderBalance.toString(),

        };
        //更新发送者账户金额信息
        store.account.set(updatedSender.address, updatedSender);
        //获取接收者信息
        const recipient = store.account.getOrDefault(this.asset.recipientId);
        //接收者账户金额减去交易金额
        const updatedRecipientBalance = BigInt(recipient.balance) - BigInt(this.asset.amount);
        const updatedRecipient = {
            ...recipient,
            balance: updatedRecipientBalance.toString(),
        };
        //更新接收者账户金额信息恢复成交易前的金额
        store.account.set(updatedRecipient.address, updatedRecipient);
        return errors;
    }
}
module.exports = BetTransaction;
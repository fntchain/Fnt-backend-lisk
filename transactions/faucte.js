
const {
    BaseTransaction,
    TransactionError,
} = require('@liskhq/lisk-transactions');
const { isValidTransferAmount } = require("@liskhq/lisk-validator");
//自定义事务继承BaseTransaction接口
class FaucetTransaction extends BaseTransaction {
    //设置交易类型
    static get TYPE () {
        return 101;
    }
    //设置交易费用为0
    static get FEE () {
        return `0`;
    }
    //为 apply 和 undo 准备数据：缓存账户信息
    async prepare (store) {
        await store.account.cache([
            {
                address: this.asset.recipientId,
            },
            {
                address: this.senderId,
            },
            { username: this.asset.data },
        ]);
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
    //注册充值主要逻辑函数
    applyAsset (store) {
        const errors = [];
        //获取发送者信息
        const sender = store.account.get(this.senderId);
        //获取接收者信息
        const recipient = store.account.getOrDefault(this.asset.recipientId);
        //判断发送者账户金额是否小于要交易的金额，如果小于抛出错误，提示发送者账户资金不足
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
        //查询用户名是否存在
        const usernameExists = store.account.find(
            (account) => account.username === this.asset.data && account.address !== this.asset.recipientId,
        );
        //如果用户名已经存在抛出错误，提示该用户名已被使用
        if (usernameExists) {
            errors.push(
                new TransactionError(
                    `Username is not unique.`,
                    this.id,
                    '.asset.username',
                ),
            );
        }
        //发送者账户金额减去充值金额
        const updatedSenderBalance = BigInt(sender.balance) - BigInt(this.asset.amount);
        const updatedSender = {
            ...sender,
            balance: updatedSenderBalance.toString(),
        };
        //更新发送者账户金额
        store.account.set(updatedSender.address, updatedSender);
        //接收者账户金额加上充值金额
        const updatedRecipientBalance = BigInt(recipient.balance) + BigInt(this.asset.amount);
        const updatedRecipient = {
            ...recipient,
            username: this.asset.data,
            balance: updatedRecipientBalance.toString(),
        };
        //更新接收者账户金额和用户名
        store.account.set(updatedRecipient.address, updatedRecipient);
        return errors;
    }
    //撤销函数与apply逻辑相反
    undoAsset (store) {
        const errors = [];
        //获取发送者信息
        const sender = store.account.get(this.senderId);
        //获取接收者信息
        const recipient = store.account.getOrDefault(this.asset.recipientId);
        //发送者账户金额加上充值金额
        const updatedSenderBalance = BigInt(sender.balance) + BigInt(this.asset.amount);
        const updatedSender = {
            ...sender,
            balance: updatedSenderBalance.toString(),
        };
        //更新发送者账户金额信息
        store.account.set(updatedSender.address, updatedSender);
        //接收者账户金额减去充值金额
        const updatedRecipientBalance = BigInt(recipient.balance) - BigInt(this.asset.amount);
        const updatedRecipient = {
            ...recipient,
            username: null,
            balance: updatedRecipientBalance.toString(),
        };
        //更新接收者账户信息恢复成注册之前的状态
        store.account.set(updatedRecipient.address, updatedRecipient);

        return errors;
    }
}
module.exports = FaucetTransaction;
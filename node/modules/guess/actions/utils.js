const { APIClient } = require('@liskhq/lisk-api-client')
const cryptography = require('@liskhq/lisk-cryptography')
const faucteBetTransaction = require('../../../../transactions/faucte')
const transferBetTransaction = require('../../../../transactions/bet')
const { utils } = require('@liskhq/lisk-transactions')
const API_BASEURL = 'https://api.eliteeffect.info'
const api = new APIClient([API_BASEURL])
const networkIdentifier = cryptography.getNetworkIdentifier(
    '23ce0366ef0a14a91e5fd4b1591fc880ffbef9d988ff8bebf8f3666b0c09597d',
    'Lisk'
)
const { BigNum } = require('lisk-sdk');
const admin = {
    "address": "11237980039345381032L",
    "passphrase": "creek own stem final gate scrub live shallow stage hide concert they"
}

function doFaucteTransaction (amount, username, address) {
    amount = new BigNum(amount).times(10 ** 8).toString()
    const faucteTransaction = new faucteBetTransaction({
        asset: {
            data: username,
            amount,
            recipientId: address,
        },
        networkIdentifier: networkIdentifier,
        timestamp: utils.getTimeFromBlockchainEpoch(new Date()),
    })
    faucteTransaction.sign(admin.passphrase)
    return api.transactions.broadcast(faucteTransaction.toJSON())
}

async function doTransferTransaction (amount, address, passphrase,asset) {
    amount = new BigNum(amount).times(10 ** 8).toString()
    const transferTransaction = new transferBetTransaction({
        asset: {
            amount,
            recipientId: address,
            ...asset
        },
        networkIdentifier: networkIdentifier,
        timestamp: utils.getTimeFromBlockchainEpoch(new Date()),
    })
    transferTransaction.sign(passphrase)
    return api.transactions.broadcast(transferTransaction.toJSON())


}

module.exports = {
    doFaucteTransaction,
    doTransferTransaction,
    admin
}
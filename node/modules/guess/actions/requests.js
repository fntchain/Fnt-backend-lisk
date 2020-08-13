
const Chedule = require('../controllers/guessChedule')
const schedule = require('node-schedule')
const moment = require('moment-timezone')
const { doTransferTransaction, doFaucteTransaction, admin } = require('./utils')
moment.tz.setDefault('Asia/Shanghai')

function getIssue (start_time, interval) {
    let now = moment().unix()
    let endTime = moment()
        .endOf('day')
        .unix()
    let expIuess = Math.ceil((endTime - now) / interval)
    let totalIuess =
        now - start_time > 86400
            ? Math.ceil(86400 / interval)
            : Math.ceil((endTime - start_time) / interval)
    return { expIuess, totalIuess }
}
module.exports = ({ components }, socket, io) => {
    socket.on('assets', async (assets, callback) => {
        let offset = (assets.pageNumber - 1) * assets.pageSize
        let filters = {}
        let currentAsset = await components.storage.entities.Assets.get(filters, { limit: assets.pageSize, offset, extended: true })
        callback(currentAsset)
    })
    socket.on('userInfo', async (account, callback) => {
        let user = await components.storage.entities.Account.getOne({ address: account.address });
        user.passphrase = account.passphrase;
        callback(user)
    })
    socket.on('create_assets', async (assets, callback) => {
        assets.region = JSON.stringify(assets.region)
        assets.issue = 10000;
        assets.start_time = moment(assets.start_time).unix()
        await components.storage.entities.Assets.create(assets);
        let currentAassets = await components.storage.entities.Assets.getOne({ assets_name: assets.assets_name });
        await components.storage.entities.PrizePool.create({ assets_id: currentAassets.id, period: 10000, pool: assets.pool_amount });
        let guessChedule = new Chedule(components.storage, io)
        guessChedule.setSchedule(currentAassets)
        guessChedule.setIssueSchedule(currentAassets)
        callback(currentAassets)
    })
    socket.on('get_assets', async (id, callback) => {
        let currentAassets = await components.storage.entities.Assets.getOne({ id });
        callback(currentAassets)
    })

    socket.on('update_assets', async (assets, callback) => {
        assets.region = JSON.stringify(assets.region)
        assets.start_time = moment(assets.start_time).unix()
        await components.storage.entities.Assets.updateOne({ id: assets.id }, assets);
        let guessChedule = new Chedule(components.storage, io)
        guessChedule.setSchedule(assets)
        guessChedule.setIssueSchedule(assets)
        callback(assets)
    })
    socket.on('delete_assets', async (id, callback) => {
        let current = await components.storage.entities.Assets.getOne({ id });
        schedule.scheduledJobs[current.assets_name] ? schedule.scheduledJobs[current.assets_name].cancel() : null
        schedule.scheduledJobs[current.assets_name + "_issue"] ? schedule.scheduledJobs[current.assets_name + '_issue'].cancel() : null
        await components.storage.entities.Assets.delete({ id });
        callback({ id })
    })
    socket.on('assets_list', async (callback) => {
        let endTime = moment().endOf('day').format('X')
        let startTime = moment().startOf('day').format('X')
        let assets = await components.storage.entities.Assets.get({}, { limit: 100 })

        for (let i = 0; i < assets.length; i++) {
            const item = assets[i];
            let issue = getIssue(item.start_time, item.interval)
            item.totalIuess = issue.totalIuess
            item.expIuess = issue.expIuess
            let totalAmount = 0;
            let currentAmount = 0;
            let number = [{ count: 0 }]
            delete item.region
            let record = await components.storage.entities.UserRecord.get({ guess_time_gte: startTime, guess_time_lte: endTime, assets_id: item.id })
            let pool = await components.storage.entities.PrizePool.getOne({ period: item.issue, assets_id: item.id })

            for (let j = 0; j < record.length; j++) {
                const recordItem = record[j];
                let amount = parseInt(recordItem.amount)
                totalAmount += amount
                if (item.issue == recordItem.period) {
                    currentAmount += amount
                    number = await components.storage.entities.UserRecord.count({ period: item.issue, assets_id: item.id })
                }
            }
            item.totalAmount = totalAmount
            item.number = number[0].count
            item.pool = pool.pool
            item.currentAmount = currentAmount
        }
        callback(assets)
    })
    socket.on('assetsById', async (id, callback) => {
        let item = await components.storage.entities.Assets.getOne({ id })
        let number = await components.storage.entities.UserRecord.count({ period: item.issue, assets_id: item.id })
        let issue = getIssue(item.start_time, item.interval)
        item.totalIuess = issue.totalIuess
        item.expIuess = issue.expIuess
        item.number = number[0].count
        delete item.region
        callback(item)
    })

    socket.on('lottery', async (assets_id, callback) => {
        let lottery = await components.storage.entities.Lottery.get({ project_id: assets_id }, { limit: 10 })
        callback(lottery)
    })
    socket.on('number', async (item) => {
        let number = await components.storage.entities.UserRecord.count({ period: item.issue, assets_id: item.id })
        io.emit('number', { data: number[0].count, id: item.id })
    })
    socket.on('record_list', async (params, callback) => {
        let offset = (params.pageNumber - 1) * params.pageSize
        let record = await components.storage.entities.UserRecord.get({ address: params.address, assets_id: params.id }, { limit: params.pageSize, offset })
        let total = await components.storage.entities.UserRecord.countAll({ address: params.address, assets_id: params.id })
        callback({ data: record, total: total[0].count })
    })
    socket.on('saveRecord', async (record) => {
        try {
            let project = await components.storage.entities.Assets.getOne({ id:record.id });
            let asset = {period:record.period,guess_project:project.assets_name,guess_price:record.price};
            await doTransferTransaction(record.amount, admin.address, record.passphrase,asset);
            let params = { period: record.period, assets_id: record.id, guess_price: record.price, amount: record.amount, guess_time: moment().unix(), address: record.address, state: 0 }
            await components.storage.entities.UserRecord.create(params)
            let pool = await components.storage.entities.PrizePool.getOne({ period: record.period, assets_id: record.id })
            await components.storage.entities.PrizePool.update({ period: record.period, assets_id: record.id }, { pool: Number(pool.pool) + Number(record.amount) });
            let current = { ...record }
            current.state = 0;
            delete current.passphrase
            io.emit(`save_${record.address}`, { state: 200, message: 'Successful bet', amount: record.amount })
        } catch (error) {
            io.emit(`save_${record.address}`, { state: 201, message: error.errors[0].message })
        }
    })
    socket.on('login', async (account, callback) => {
        let current = await components.storage.entities.Account.get({ address: account.address })
        if (current[0]) {
            callback(current)
        } else {
            callback({ state: 201, message: 'User does not exist' })
        }

    })

    socket.on('register', async (account, callback) => {
        try {
            await doFaucteTransaction(100, account.username, account.address)
            account.balance = 10000000000
            callback({ state: 200, account })
        } catch (error) {
            callback({ state: 201, error })
        }
    })
    socket.on('topup', async (user) => {
        try {
            await doTransferTransaction(user.amount, user.address, user.passphrase)
            io.emit(`save_${user.own}`, { state: 200, message: 'Deposit successfully', amount: user.amount })
            io.emit(`topup_${user.address}`, { state: 200, amount: user.amount })
        } catch (error) {
            io.emit(`save_${user.own}`, { state: 201, message: error.errors[0].message })
        }
    })
}
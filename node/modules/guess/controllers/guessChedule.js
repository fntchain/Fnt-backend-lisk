const schedule = require('node-schedule')
const axios = require('axios')
const moment = require('moment-timezone')
const { doTransferTransaction, admin } = require('../actions/utils')
moment.tz.setDefault('Asia/Shanghai')
class GuessSchedule {
    constructor(storage = {}, socket) {
        this.storage = storage,
            this.socket = socket
    }

    //根据初始项目启动定时任务
    async start () {
        //查询项目配置表信息
        const project = await this.storage.entities.Assets.get({}, { limit: 100 });
        for (let i = 0; i < project.length; i++) {
            this.setSchedule(project[i])
            this.setIssueSchedule(project[i])
        }
    }

    //设置定时任务
    async setSchedule (assets) {
        //先取消已存在的定时任务
        schedule.scheduledJobs[assets.assets_name] ? schedule.scheduledJobs[assets.assets_name].cancel() : null
        let rule = new schedule.RecurrenceRule()
        //定时任务规则
        const rules = this.rule(assets.start_time, assets.interval)
        const { minute, seconds } = this.drawRule(rules, assets.seal_time)
        rule.minute = minute
        rule.second = seconds
        schedule.scheduleJob(assets.assets_name, rule, async () => {
            let totalBalance = 0;
            //写入数据
            try {
                let body = await axios.get(`https://api.coincap.io/v2/assets/${assets.api_assets_name}`)
                let priceUsd = Number(body.data.data.priceUsd).toFixed(3)
                const project = await this.storage.entities.Assets.getOne({ id: assets.id });
                if (project.issue - 1 < 10000) {
                    return false;
                }
                this.storage.entities.Lottery.create(assets.id, project.issue - 1, priceUsd)
                let userRecord = await this.storage.entities.UserRecord.get({ period: project.issue - 1, assets_id: assets.id })
                let prizePool = await this.storage.entities.PrizePool.getOne({ period: project.issue - 1, assets_id: assets.id })
                let region = JSON.parse(assets.region)
                region = this.getAwards(userRecord, region, priceUsd)
                console.log(region)
                let q = 0;
                for (let i = 0; i < userRecord.length; i++) {
                    const record = userRecord[i];
                    let userBalance = parseInt(-record.amount);
                    for (let j = 0; j < region.length; j++) {
                        const awards = region[j];
                        let lowAwardsRegion = Math.floor((priceUsd - awards.region)*1000)/1000;
                        let upAwardsRegion = Number(priceUsd) + Number(awards.region);
                        if (record.guess_price >= lowAwardsRegion && record.guess_price <= upAwardsRegion) {
                            console.log(prizePool)
                            console.log(awards.percentage)
                            let balance = prizePool.pool * (awards.percentage / 100) * (record.amount / awards.total)
                            balance = Math.floor(balance)
                            setTimeout(async () => {
                                await doTransferTransaction(balance, record.address, admin.passphrase)
                                this.socket.emit(`awards_${record.address}`, { balance })
                            }, q * 1000)
                            q++;
                            totalBalance += balance
                            userBalance = balance + userBalance
                            break;
                        }

                    }

                    let updateSet = { state: 2, price: priceUsd, profit: userBalance }
                    await this.storage.entities.UserRecord.updateOne({ id: record.id }, updateSet)
                }
                let currentPrizePool = await this.storage.entities.PrizePool.getOne({ period: project.issue, assets_id: assets.id })
                let poolAmount = currentPrizePool.pool - totalBalance;
                if (poolAmount <= assets.lowest_amount) poolAmount = assets.pool_amount
                await this.storage.entities.PrizePool.update({ period: project.issue, assets_id: assets.id }, { pool: poolAmount });

            } catch (err) {
                console.log(err)
            }

        })
    }
    setIssueSchedule (assets) {
        //先取消已存在的定时任务
        schedule.scheduledJobs[assets.assets_name + '_issue'] ? schedule.scheduledJobs[assets.assets_name + '_issue'].cancel() : null
        let rule = new schedule.RecurrenceRule()
        //定时任务规则
        const { minute, seconds } = this.rule(assets.start_time, assets.interval)
        rule.minute = minute
        rule.second = seconds
        let issue = parseInt(assets.issue)
        schedule.scheduleJob(assets.assets_name + '_issue', rule, async () => {
            try {
                let record = await this.storage.entities.UserRecord.get({ period: issue, assets_id: assets.id });
                let pool = await this.storage.entities.PrizePool.getOne({ period: issue, assets_id: assets.id })
                if (record.length > 0) await this.storage.entities.UserRecord.update({ period: issue, assets_id: assets.id }, { state: 1 });
                issue += 1
                await this.storage.entities.PrizePool.create({ period: issue, assets_id: assets.id, pool: pool.pool })
                await this.storage.entities.Assets.updateOne({ id: assets.id }, { issue });
            } catch (error) {
                console.log(error)
            }
        })
    }


    rule (startTime, interval) {
        const minuteArr = [];
        const newDate = moment(startTime * 1000);
        const expSecond = (interval) % 60
        let minute = Math.floor(interval / 60);
        let length = Math.ceil(3600 / interval)
        for (let i = 0; i < length; i++) {
            let currentMinute = newDate.minutes();
            newDate.minutes(currentMinute + minute)
            minuteArr.push(newDate.minutes())
        }

        return { minute: minuteArr, seconds: expSecond }
    }
    drawRule (rule, seal_time) {
        let ruleArr = []
        const newDate = moment();
        let totalSeconds = rule.seconds + seal_time
        let minute = Math.floor(totalSeconds / 60)
        let expSecond = totalSeconds - minute * 60
        for (let index = 0; index < rule.minute.length; index++) {
            const element = rule.minute[index];
            newDate.minute(element + minute)
            ruleArr.push(newDate.minutes())
        }
        return { minute: ruleArr, seconds: expSecond }
    }

    getAwards (userRecord, region, price) {
        for (let i = 0; i < userRecord.length; i++) {
            const record = userRecord[i];
            for (let j = 0; j < region.length; j++) {
                const awards = region[j];
                let lowAwardsRegion = Math.floor((price - awards.region)*1000)/1000;
                let upAwardsRegion = Number(price) + Number(awards.region);
                if (region[j].count == undefined) region[j].count = 0;
                if (region[j].total == undefined) region[j].total = 0;
                if (record.guess_price >= lowAwardsRegion && record.guess_price <= upAwardsRegion) {
                    region[j].count += 1;
                    region[j].total += parseInt(record.amount)
                    break;
                }

            }

        }
        return region
    }
}
module.exports = GuessSchedule

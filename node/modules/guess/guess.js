const { createLoggerComponent } = require('lisk-framework/src/components/logger');
const { createStorageComponent } = require('lisk-framework/src/components/storage');
const { Account } = require('lisk-framework/src/modules/chain/components/storage/entities');
const { LotteryEntity, AssetsEntity, UserRecordEntity, PrizePoolEntity } = require('./components/storage/entities');
const subscribeRequests = require('./actions/requests');
const guessSchedule = require('./controllers/guessChedule')
const io = require('socket.io')();

class Guess {

    constructor(options) {
        this.options = options;
        this.logger = null;
        this.scope = null;
        this.channel = null;
    }

    async bootstrap (channel) {
        this.channel = channel;
        // Logger
        const loggerConfig = await this.channel.invoke(
            'app:getComponentConfig',
            'logger',
        );
        this.logger = createLoggerComponent({
            ...loggerConfig,
            module: 'guess',
        });

        // Storage
        this.logger.debug('Initiating storage...');
        const storageConfig = await this.channel.invoke(
            'app:getComponentConfig',
            'storage',
        );
        const dbLogger =
            storageConfig.logFileName &&
                storageConfig.logFileName === loggerConfig.logFileName
                ? this.logger
                : createLoggerComponent({
                    ...loggerConfig,
                    logFileName: storageConfig.logFileName,
                    module: 'guess:database',
                });
        const storage = createStorageComponent(storageConfig, dbLogger);
        storage.registerEntity('Account', Account, {
            replaceExisting: true,
        });
        //注册数据库
        storage.registerEntity('Assets', AssetsEntity);
        storage.registerEntity('Lottery', LotteryEntity);
        storage.registerEntity('UserRecord', UserRecordEntity);
        storage.registerEntity('PrizePool', PrizePoolEntity);
        const status = await storage.bootstrap();
        if (!status) {
            throw new Error('Cannot bootstrap the storage component');
        }

        const applicationState = await this.channel.invoke(
            'app:getApplicationState',
        );

        // Setup scope
        this.scope = {
            components: {
                logger: this.logger,
                storage,
            },
            channel: this.channel,
            applicationState,
        };
        //定时器任务
        const schedule = new guessSchedule(storage, io)
        schedule.start();
        io.on('connection', client => {
            subscribeRequests(this.scope, client, io);
        });

        io.listen(7171);
    }

    async cleanup (code, error) {
        const { components } = this.scope;
        if (error) {
            this.logger.fatal(error.toString());
            if (code === undefined) {
                code = 1;
            }
        } else if (code === undefined || code === null) {
            code = 0;
        }
        this.logger.info('Cleaning guess module...');

        try {
            if (components !== undefined) {
                Object.keys(components).forEach(async key => {
                    if (components[key].cleanup) {
                        await components[key].cleanup();
                    }
                });
            }
        } catch (componentCleanupError) {
            this.logger.error(componentCleanupError);
        }
        this.logger.info('Cleaned up successfully');
    }
}
module.exports = Guess;
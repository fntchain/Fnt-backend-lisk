const { Application, genesisBlockDevnet, configDevnet } = require('lisk-sdk');
const FaucetTransaction = require('../transactions/faucte')
const BetTransaction = require('../transactions/bet')
const GuessModule = require('./modules/guess')
configDevnet.app.label = 'guess-game-blockchain-app';
configDevnet.components.storage.user = 'firstvip';
configDevnet.components.storage.password = 'firstvip123';
configDevnet.components.storage.database = 'firstvip_dev';
const app = new Application(genesisBlockDevnet, configDevnet);
app.registerModule(GuessModule);
app.registerTransaction(FaucetTransaction)
app.registerTransaction(BetTransaction)

app
    .run()
    .then(() => app.logger.info('App started...'))
    .catch(error => {
        console.error('Faced error in application', error);
        process.exit(1);
    });
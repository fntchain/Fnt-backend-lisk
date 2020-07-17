const Guess = require('./guess');
const BaseModule = require('lisk-framework/src/modules/base_module');
const migrations = require("./migrations");
class GuessModule extends BaseModule {

    constructor(options) {
        super(options);
        this.guess = null;
    }

    static get alias () {
        return 'guess';
    }

    static get info () {
        return {
            author: 'cool',
            version: '0.0.1',
            name: 'lisk-guess',
        };
    }

    static get migrations () {
        return migrations;
    }

    static get defaults () {
        return {};
    }

    get events () {
        return [
        ];
    }

    get actions () {
        return {};
    }

    async load (channel) {
        this.guess = new Guess(this.options);

        channel.once('app:ready', async () => {
            await this.guess.bootstrap(channel);
        });
    }

    async unload () {
        return this.guess ? this.guess.cleanup(0) : true;
    }
}

module.exports = GuessModule
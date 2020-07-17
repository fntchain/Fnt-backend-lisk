const _ = require('lodash');
const path = require('path');
const filterTypes = require('lisk-framework/src/components/storage/utils/filter_types');
const { BaseEntity } = require('lisk-framework/src/components/storage/entities');

const sqlFiles = {
    select: 'userRecord/get.sql',
    create: 'userRecord/create.sql',
    update: 'userRecord/update.sql',
    count: 'userRecord/count.sql',
    update_one: 'userRecord/update_one.sql',
    countAll: 'userRecord/count_all.sql'
};
const readOnlyFields = ['id'];
class UserRecordEntity extends BaseEntity {

    constructor(adapter, defaultFilters = {}) {
        super(adapter, defaultFilters);
        this.sqlDirectory;
        this.addField;
        this.loadSQLFiles;
        this.adapter;
        this.SQLs;
        this.validateFilters;
        this.validateOptions;
        this.defaultOptions;
        this.mergeFilters;
        this.parseFilters;
        this.parseSort;
        this.addField('id', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('assets_id', 'number', {
            filter: filterTypes.NUMBER,
        });

        this.addField('period', 'number', {
            filter: filterTypes.NUMBER,
        });

        this.addField('guess_price', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('address', 'string', {
            filter: filterTypes.TEXT,
        });
        this.addField('amount', 'string', {
            filter: filterTypes.TEXT,
        });
        this.addField('guess_time', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('state', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('price', 'string', {
            filter: filterTypes.TEXT,
        });
        this.addField('profit', 'string', {
            filter: filterTypes.TEXT,
        });

        this.sqlDirectory = path.join(path.dirname(__filename), '../sql');

        this.SQLs = this.loadSQLFiles('userRecord', sqlFiles, this.sqlDirectory);
    }

    static _sanitizeFilters (filters = {}) {
        const sanitizeFilterObject = filterObject => {
            return filterObject;
        };

        // PostgresSQL does not support null byte buffer so have to parse in javascript
        if (Array.isArray(filters)) {
            filters = filters.map(sanitizeFilterObject);
        } else {
            filters = sanitizeFilterObject(filters);
        }

        return filters;
    }

    getOne (filters, options = {}, tx) {
        return this._getResults(filters, options, tx, 1);
    }

    get (filters, options = {}, tx) {
        return this._getResults(filters, options, tx, 37);
    }

    create (params) {
        return this.adapter.executeFile(this.SQLs.create, params, { expectedResultCount: 0 });
    }
    updateOne (filters, data, _options, tx) {
        const atLeastOneRequired = true;
        filters = UserRecordEntity._sanitizeFilters(filters);
        this.validateFilters(filters, atLeastOneRequired);

        const objectData = _.omit(data, readOnlyFields);
        const mergedFilters = this.mergeFilters(filters);
        const parsedFilters = this.parseFilters(mergedFilters);
        const updateSet = this.getUpdateSet(objectData);

        const params = {
            ...objectData,
            parsedFilters,
            updateSet,
        };

        return this.adapter.executeFile(this.SQLs.update_one, params, {}, tx);
    }

    async update (filters, data, _options, tx) {
        const atLeastOneRequired = true;
        filters = UserRecordEntity._sanitizeFilters(filters);
        this.validateFilters(filters, atLeastOneRequired);

        const objectData = _.omit(data, readOnlyFields);

        const mergedFilters = this.mergeFilters(filters);
        const parsedFilters = this.parseFilters(mergedFilters);
        const updateSet = this.getUpdateSet(objectData);

        const params = {
            ...objectData,
            parsedFilters,
            updateSet,
        };

        if (_.isEmpty(objectData)) {
            return false;
        }

        return this.adapter.executeFile(this.SQLs.update, params, {}, tx);
    }
    count (filters, options, tx) {
        filters = UserRecordEntity._sanitizeFilters(filters);
        this.validateFilters(filters);
        this.validateOptions(options);
        const mergedFilters = this.mergeFilters(filters);
        const parsedFilters = this.parseFilters(mergedFilters);
        const params = {
            parsedFilters,
        };
        return this.adapter.executeFile(this.SQLs.count, params, {}, tx);
    }
    countAll (filters, options, tx) {
        filters = UserRecordEntity._sanitizeFilters(filters);
        this.validateFilters(filters);
        this.validateOptions(options);
        const mergedFilters = this.mergeFilters(filters);
        const parsedFilters = this.parseFilters(mergedFilters);
        const params = {
            parsedFilters,
        };
        return this.adapter.executeFile(this.SQLs.countAll, params, {}, tx);
    }
    _getResults (filters, options, tx, expectedResultCount) {
        filters = UserRecordEntity._sanitizeFilters(filters);
        this.validateFilters(filters);
        this.validateOptions(options);

        const mergedFilters = this.mergeFilters(filters);
        const parsedFilters = this.parseFilters(mergedFilters);
        this.defaultOptions.limit = 37;
        const parsedOptions = _.defaults(
            {},
            _.pick(options, ['limit', 'offset', 'sort', 'extended']),
            _.pick(this.defaultOptions, ['limit', 'offset', 'sort', 'extended']),
        );

        // To have deterministic pagination add extra sorting
        if (parsedOptions.sort) {
            parsedOptions.sort = _.flatten([parsedOptions.sort, 'id:desc']).filter(
                Boolean,
            );
        } else {
            parsedOptions.sort = ['id:desc'];
        }

        let parsedSort = this.parseSort(parsedOptions.sort);

        const params = {
            limit: parsedOptions.limit,
            offset: parsedOptions.offset,
            parsedSort,
            parsedFilters,
        };

        return this.adapter
            .executeFile(
                this.SQLs.select,
                params,
                { expectedResultCount },
                tx,
            )
            .then(resp => {
                return resp;
            });
    }
}
module.exports = UserRecordEntity
const _ = require('lodash');
const path = require('path');
const filterTypes = require('lisk-framework/src/components/storage/utils/filter_types');
const { BaseEntity } = require('lisk-framework/src/components/storage/entities');

const sqlFiles = {
    select: 'lottery/get.sql',
    create: 'lottery/create.sql',
};

class LotteryEntity extends BaseEntity {

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

        this.addField('project_id', 'number', {
            filter: filterTypes.NUMBER,
        });

        this.addField('period', 'number', {
            filter: filterTypes.NUMBER,
        });

        this.addField('price', 'string', {
            filter: filterTypes.TEXT,
        });

        this.sqlDirectory = path.join(path.dirname(__filename), '../sql');

        this.SQLs = this.loadSQLFiles('lottery', sqlFiles, this.sqlDirectory);
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

    create (project_id, period, price) {
        const params = {
            project_id: project_id,
            period: period,
            price: price,
        };
        return this.adapter.executeFile(this.SQLs.create, params, { expectedResultCount: 0 });
    }


    _getResults (filters, options, tx, expectedResultCount) {
        filters = LotteryEntity._sanitizeFilters(filters);
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
            parsedOptions.sort = _.flatten([parsedOptions.sort, 'period:desc']).filter(
                Boolean,
            );
        } else {
            parsedOptions.sort = ['period:desc'];
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
module.exports = LotteryEntity
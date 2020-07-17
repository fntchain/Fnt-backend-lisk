const _ = require('lodash');
const path = require('path');
const filterTypes = require('lisk-framework/src/components/storage/utils/filter_types');
const { BaseEntity } = require('lisk-framework/src/components/storage/entities');

const sqlFiles = {
    select: 'assets/get.sql',
    create: 'assets/create.sql',
    update_one: 'assets/update_one.sql',
    delete: 'assets/delete.sql'
};
const readOnlyFields = ['id'];
class AssetsEntity extends BaseEntity {
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
        this.getUpdateSet;

        this.addField('assets_name', 'string', {
            filter: filterTypes.TEXT,
        });
        this.addField('id', 'number', {
            filter: filterTypes.NUMBER,
        });

        this.addField('api_assets_name', 'string', {
            filter: filterTypes.TEXT,
        });

        this.addField('icon', 'string', {
            filter: filterTypes.NUMBER,
        });
        this.addField('start_time', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('seal_time', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('pool_amount', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('lowest_amount', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('issue', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('interval', 'number', {
            filter: filterTypes.NUMBER,
        });
        this.addField('region', 'string', {
            filter: filterTypes.TEXT,
        });

        this.sqlDirectory = path.join(path.dirname(__filename), '../sql');

        this.SQLs = this.loadSQLFiles('assets', sqlFiles, this.sqlDirectory);
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
        filters = AssetsEntity._sanitizeFilters(filters);
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
    delete(filters, _options, tx = null) {
        filters = AssetsEntity._sanitizeFilters(filters);
		this.validateFilters(filters);
		const mergedFilters = this.mergeFilters(filters);
		const parsedFilters = this.parseFilters(mergedFilters);

		return this.adapter
			.executeFile(
				this.SQLs.delete,
				{ parsedFilters },
				{ expectedResultCount: 0 },
				tx,
			)
			.then(result => result);
	}

    _getResults (filters, options, tx, expectedResultCount) {
        filters = AssetsEntity._sanitizeFilters(filters);
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

module.exports = AssetsEntity
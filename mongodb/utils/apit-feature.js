class APIFeature {
    constructor(query,queryStr) {
        this.query = query,
        this.queryStr = queryStr;
        this.sortBy = '-createdAt'; // default sort by createdAt in descending order
        this.fields = '-__v'; // default fields to exclude
        this.defaultPage = 1; // default page number
        this.defaultLimit = 10; // default limit
        this.excludedFields = ['sort', 'page', 'limit', 'fields']; // fields to exclude from the query
    }

    filter() {
        let queryString = JSON.stringify(this.queryStr);
        // add $ sign to the query field
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        const queryObject = JSON.parse(queryString);
        //excluede the fields from the query
        let mongoQueryObject = { ...queryObject };
        this.excludedFields.forEach(el => delete mongoQueryObject[el]);
        this.query = this.query.find(mongoQueryObject);
        return this;
    }

    sort() {
        //if query has multiple sort fields replace commas with spaces
        if(this.queryStr.sort) {
            this.sortBy = this.queryStr.sort.split(',').join(' ');
        }
        this.query = this.query.sort(this.sortBy)
        return this;
    }

    limitFields() {
        //if query has multiple filter fields replace commas with spaces
        if(this.queryStr.fields) {
            this.fields = this.queryStr.fields.split(',').join(' ');
        }
        this.query = this.query.select(this.fields);
        return this;
    }

    paginate() {
        const page = this.queryStr.page * 1 || this.defaultPage;
        const limit = this.queryStr.limit * 1 || this.defaultLimit;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeature;